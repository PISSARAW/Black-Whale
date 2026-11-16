import { describe, expect, it } from 'vitest'
import { clashBody, createClashLobby, updateClashLobby } from './clashPvpHttp'
import { clashPvpRegistry, ClashPvpRegistry } from './clashPvp'
import { AuthoritativeClashMatch } from '$lib/fighting/pvp/serverMatch'
import { createFightEnvironment } from '$lib/fighting/fightEnvironment'
import { beginFight, createFight } from '$lib/fighting/engine'
import { packReplayInput } from '$lib/fighting/fightReplayInput'
import { EMPTY_INPUT } from '$lib/fighting/types'
import { parsePvpPackets } from '$lib/fighting/pvp/protocol'
import { PVP_RULESET, type PvpInputPacket } from '$lib/fighting/pvp/types'

const packet = (sequence: number, input = 0): PvpInputPacket => ({
  sequence,
  input,
  commands: [{ kind: 'move', action: 'special', input: 0 }],
})
const request = (token: string) =>
  new Request('http://localhost/test', {
    headers: { authorization: `Bearer ${token}` },
  })
async function lobby() {
  const host = await createClashLobby({
    ruleset: PVP_RULESET,
    setup: {
      player: 'hisoka',
      opponent: 'kurapika',
      formatId: 'knockout',
      environment: createFightEnvironment(),
    },
  }).json()
  const guest = await updateClashLobby(host.matchId, request(''), {
    kind: 'join',
    ruleset: PVP_RULESET,
    invitation: host.inviteHref.split('#')[1],
  }).json()
  const configHash = clashPvpRegistry.view(host.matchId, host.token).configHash
  for (const token of [host.token, guest.token])
    updateClashLobby(host.matchId, request(token), {
      kind: 'ready',
      ruleset: PVP_RULESET,
      configHash,
    })
  return { host, guest }
}
describe('ordered cumulative input HTTP boundary', () => {
  it('cannot apply an in-flight round-one action after both players start round two', () => {
    let now = 1000,
      id = 0
    const registry = new ClashPvpRegistry(
      () => now,
      () => `epoch-${++id}`,
    )
    const host = registry.create({
      player: 'hisoka',
      opponent: 'kurapika',
      formatId: 'knockout',
      environment: createFightEnvironment(),
    })
    const guest = registry.join(host.matchId, PVP_RULESET, {
      invitation: host.inviteHref.split('#')[1],
    })
    const view = () => registry.view(host.matchId, host.token)
    const ready = () => {
      for (const token of [host.token, guest.token])
        registry.ready(host.matchId, { token, ruleset: PVP_RULESET, configHash: view().configHash })
    }
    ready()
    for (let pulse = 0; pulse < 481 && view().status === 'playing'; pulse++) {
      now += 250
      registry.view(host.matchId, guest.token)
    }
    expect(view().status).toBe('ready')
    ready()
    expect(JSON.parse(view().snapshot).roundNumber).toBe(2)
    expect(() =>
      registry.receiveInputs(host.matchId, { token: host.token, round: 1, packets: [packet(0)] }),
    ).toThrow('NOT_PLAYING')
    expect(view().nextSequence).toBe(0)
    expect(
      registry.receiveInputs(host.matchId, { token: host.token, round: 2, packets: [packet(0)] })
        .nextSequence,
    ).toBe(1)
  })
  it('never restores an obsolete guard after a newer release was applied', () => {
    const server = new AuthoritativeClashMatch(
      beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' })),
    )
    const guard = {
      sequence: 0,
      input: packReplayInput({ ...EMPTY_INPUT, guard: true }),
      commands: [],
    }
    const release = { sequence: 1, input: 0, commands: [] }
    expect(server.submit('player', guard, 0)).toBe('accepted')
    server.advance(17)
    expect(server.snapshot().player.blocking).toBe(true)
    expect(server.submit('player', release, 20)).toBe('accepted')
    server.advance(34)
    expect(server.snapshot().player.blocking).toBe(false)
    expect(server.submit('player', guard, 40)).toBe('duplicate')
    server.advance(50)
    expect(server.snapshot().player.blocking).toBe(false)
  })
  it('authenticates compact receipts without returning another world snapshot', async () => {
    const { host, guest } = await lobby()
    const body = { kind: 'inputs', round: 1, packets: [packet(0), packet(1)] }
    expect(updateClashLobby(host.matchId, request('foreign'), body).status).toBe(401)
    expect(clashPvpRegistry.view(host.matchId, host.token).nextSequence).toBe(0)
    const response = updateClashLobby(host.matchId, request(host.token), body)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({
      matchId: host.matchId,
      side: 'player',
      nextSequence: 2,
      round: 1,
    })
    expect(clashPvpRegistry.view(host.matchId, guest.token).nextSequence).toBe(0)
    expect(await updateClashLobby(host.matchId, request(host.token), body).json()).toEqual({
      matchId: host.matchId,
      side: 'player',
      nextSequence: 2,
      round: 1,
    })
  })
  it('rejects delayed uploads from another round without consuming their sequences', async () => {
    const { host } = await lobby()
    for (const round of [undefined, -1, 0.5, '1', 2]) {
      const response = updateClashLobby(host.matchId, request(host.token), {
        kind: 'inputs',
        round,
        packets: [packet(0)],
      })
      expect(response.status).toBe(round === 2 ? 409 : 400)
      expect(clashPvpRegistry.view(host.matchId, host.token).nextSequence).toBe(0)
    }
    expect(
      updateClashLobby(host.matchId, request(host.token), {
        kind: 'inputs',
        round: 1,
        packets: [packet(0)],
      }).status,
    ).toBe(200)
  })
  it('accepts a newer redundant request before the older upload and never rewrites its inputs', () => {
    const server = new AuthoritativeClashMatch(
      beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' })),
    )
    expect(server.submit('player', packet(0, 2), 0)).toBe('accepted')
    expect(server.submit('player', packet(1, 0), 20)).toBe('accepted')
    expect(server.submit('player', packet(0, 2), 40)).toBe('duplicate')
    expect(server.submit('player', packet(1, 0), 40)).toBe('duplicate')
    expect(server.submit('player', packet(0, 1), 40)).toBe('sequence')
    expect(server.nextSequence('player')).toBe(2)
    server.advance(50)
    expect(server.acknowledgement('player').appliedSequence).toBe(2)
  })
  it('validates the entire envelope before admission, including contiguous sequences and eight total commands', async () => {
    const { host } = await lobby()
    for (const packets of [
      [],
      [packet(0), packet(2)],
      [packet(0), packet(0)],
      Array.from({ length: 9 }, (_, i) => ({ ...packet(i), commands: [] })),
      [packet(0), { ...packet(1), tick: 100 }],
      [packet(0), { ...packet(1), commands: [{ kind: 'emperor', health: 1000 }] }],
      [packet(0), { ...packet(1), commands: Array(8).fill({ kind: 'call' }) }],
    ]) {
      expect(parsePvpPackets(packets)).toBeNull()
      expect(
        updateClashLobby(host.matchId, request(host.token), { kind: 'inputs', packets }).status,
      ).toBe(400)
    }
    expect(clashPvpRegistry.view(host.matchId, host.token).nextSequence).toBe(0)
    const body = JSON.stringify({ kind: 'inputs', packets: [packet(0)] })
    expect(await clashBody(new Request('http://localhost', { method: 'POST', body }))).toEqual(
      JSON.parse(body),
    )
  })
  it('retains the pending prefix on backpressure and acknowledges it only after the simulation tick', () => {
    const server = new AuthoritativeClashMatch(
      beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' })),
    )
    const full = (sequence: number) => ({
      sequence,
      input: 0,
      commands: Array(8).fill({ kind: 'call' }),
    })
    expect(server.submit('player', full(0), 0)).toBe('accepted')
    expect(server.submit('player', full(1), 0)).toBe('accepted')
    expect(server.submit('player', packet(2), 0)).toBe('busy')
    expect(server.acknowledgement('player').appliedSequence).toBe(0)
    server.advance(17)
    expect(server.acknowledgement('player').appliedSequence).toBe(1)
    expect(server.submit('player', full(0), 20)).toBe('duplicate')
    expect(server.submit('player', full(1), 20)).toBe('duplicate')
    expect(server.submit('player', packet(2), 20)).toBe('accepted')
    server.advance(34)
    expect(server.acknowledgement('player').appliedSequence).toBe(2)
    server.advance(50)
    expect(server.acknowledgement('player').appliedSequence).toBe(3)
  })
})
