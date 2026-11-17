import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { ClashPvpRegistry } from '$lib/server/clashPvp'
import { createFightEnvironment } from '../fightEnvironment'
import { FIGHTING_ROSTER } from '../roster'
import { createPvpClient } from './client'
import { readPvpInputReceipt } from './inputReceipt'
import { parsePvpControlUpload } from './controlUpload'
import { PVP_RULESET, pvpSessionKey, type PvpInputPacket } from './types'
import type { FighterId, FightSide } from '../types'

function session(fighter: FighterId = 'hisoka', side: FightSide = 'player') {
  let now = 1000,
    id = 0
  const registry = new ClashPvpRegistry(
    () => now,
    () => `epoch-${++id}`,
  )
  const host = registry.create({
    player: side === 'player' ? fighter : 'hisoka',
    opponent: side === 'opponent' ? fighter : 'bill',
    formatId: 'knockout',
    environment: createFightEnvironment(),
  })
  const guest = registry.join(host.matchId, PVP_RULESET, {
    invitation: host.inviteHref.split('#')[1],
  })
  const configHash = registry.view(host.matchId, host.token).configHash
  for (const seat of [host, guest])
    registry.ready(host.matchId, { token: seat.token, ruleset: PVP_RULESET, configHash })
  const owner = side === 'player' ? host : guest
  const other = side === 'player' ? guest : host
  return {
    registry,
    host,
    guest,
    owner,
    other,
    now: () => now,
    time: (ms: number) => {
      now += ms
    },
  }
}
const packet = (sequence: number): PvpInputPacket => ({
  sequence,
  input: 2,
  commands: [{ kind: 'move', action: 'special', input: 0 }],
})

describe('server control generations fence interrupted inputs', () => {
  for (const { id } of FIGHTING_ROSTER)
    it.each(['player', 'opponent'] as const)(
      `${id} as %s cannot replay a pre-disconnect command`,
      (side) => {
        const f = session(id, side)
        const before = f.registry.view(f.host.matchId, f.owner.token)
        f.registry.receiveInputs(f.host.matchId, {
          token: f.owner.token,
          inputEpoch: before.inputEpoch,
          round: 1,
          packets: [packet(0)],
        })
        f.time(3101)
        const interrupted = f.registry.view(f.host.matchId, f.other.token)
        expect(interrupted.status).toBe('interrupted')
        const epoch = interrupted.inputEpoch
        // Repeated outgoing observations do not continually invalidate controls.
        expect(f.registry.peek(f.host.matchId, f.other.token).inputEpoch).toBe(epoch)
        const resumed = f.registry.view(f.host.matchId, f.owner.token)
        expect(resumed.status).toBe('playing')
        expect(resumed.inputEpoch).toBeGreaterThan(before.inputEpoch)
        expect(resumed.appliedSequence).toBe(1)
        expect(resumed.authorityHash).toBe(before.authorityHash)
        for (const sequence of [0, 1])
          expect(() =>
            f.registry.receiveInputs(f.host.matchId, {
              token: f.owner.token,
              inputEpoch: before.inputEpoch,
              round: 1,
              packets: [packet(sequence)],
            }),
          ).toThrow('STALE_INPUT')
        expect(f.registry.view(f.host.matchId, f.owner.token).nextSequence).toBe(1)
        const fresh = f.registry.receiveInputs(f.host.matchId, {
          token: f.owner.token,
          inputEpoch: resumed.inputEpoch,
          round: 1,
          packets: [{ sequence: 1, input: 0, commands: [] }],
        })
        expect(fresh.nextSequence).toBe(2)
        expect(fresh.inputEpoch).toBe(resumed.inputEpoch)
      },
    )
  it('keeps an abandonment terminal and never invents a combat winner', () => {
    const f = session('camilla')
    const before = f.registry.view(f.host.matchId, f.host.token)
    f.time(30001)
    const abandoned = f.registry.view(f.host.matchId, f.guest.token)
    expect(abandoned.status).toBe('abandoned')
    expect(f.registry.view(f.host.matchId, f.host.token).status).toBe('abandoned')
    expect(abandoned.authorityHash).toBe(before.authorityHash)
    expect(() =>
      f.registry.receiveInputs(f.host.matchId, {
        token: f.host.token,
        inputEpoch: before.inputEpoch,
        round: 1,
        packets: [packet(0)],
      }),
    ).toThrow('NOT_PLAYING')
  })
})

describe('strict upload generations and late receipts', () => {
  it.each(['input', 'inputs'])(
    '%s requires a round and generation with no client simulation data',
    (kind) => {
      const base = {
        kind,
        round: 1,
        inputEpoch: 3,
        ...(kind === 'input' ? { packet: packet(0) } : { packets: [packet(0)] }),
      }
      expect(parsePvpControlUpload(base)?.inputEpoch).toBe(3)
      for (const inputEpoch of [undefined, -1, 0.2, '3', Infinity, Number.MAX_SAFE_INTEGER + 1])
        expect(parsePvpControlUpload({ ...base, inputEpoch })).toBeNull()
      for (const extra of [{ tick: 7 }, { state: {} }, { winner: 'player' }])
        expect(parsePvpControlUpload({ ...base, ...extra })).toBeNull()
    },
  )
  it('ignores old-generation receipts, rejects forged future receipts and bounds cumulative acks', () => {
    const context = {
      matchId: 'test',
      side: 'player' as const,
      inputEpoch: 3,
      round: 1,
      nextSequence: 2,
    }
    const receipt = { matchId: 'test', side: 'player', inputEpoch: 3, round: 1, nextSequence: 2 }
    expect(readPvpInputReceipt(receipt, context)).toBe(2)
    expect(readPvpInputReceipt({ ...receipt, inputEpoch: 1, round: 0 }, context)).toBeNull()
    for (const extra of [
      { inputEpoch: 4 },
      { nextSequence: 3 },
      { round: 2 },
      { side: 'opponent' },
    ])
      expect(() => readPvpInputReceipt({ ...receipt, ...extra }, context)).toThrow('DIVERGED')
  })
  it('drops queued intentions and requires neutral even when interruption views were missed', async () => {
    const f = session('tserriednich')
    let hold = true,
      release = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const uploads: Array<Record<string, unknown>> = []
    const fetcher: typeof fetch = async (url, init) => {
      if (String(url).includes('stream=1'))
        return new Response('{}', { headers: { 'content-type': 'application/json' } })
      const body = init?.body ? JSON.parse(String(init.body)) : null
      if (body?.kind === 'inputs') {
        uploads.push(body)
        if (hold) await gate
        try {
          return new Response(
            JSON.stringify(
              f.registry.receiveInputs(f.host.matchId, { token: f.host.token, ...body }),
            ),
          )
        } catch (error) {
          return new Response(JSON.stringify({ error: (error as Error).message }), { status: 409 })
        }
      }
      return new Response(JSON.stringify(f.registry.view(f.host.matchId, f.host.token)))
    }
    const client = createPvpClient({
      matchId: f.host.matchId,
      endpoint: '/match',
      fetch: fetcher,
      now: f.now,
      storage: {
        getItem: (key) => (key === pvpSessionKey(f.host.matchId) ? f.host.token : null),
        setItem: () => {},
        removeItem: () => {},
      },
    })
    try {
      await client.join()
      client.queue({ kind: 'move', action: 'special', input: 0 })
      client.pump(2)
      for (let i = 0; i < 40; i++) await Promise.resolve()
      f.time(3101)
      f.registry.view(f.host.matchId, f.guest.token)
      f.registry.view(f.host.matchId, f.host.token)
      client.pump(2)
      for (let i = 0; i < 40; i++) await Promise.resolve()
      expect(get(client).view!.inputEpoch).toBeGreaterThan(Number(uploads[0].inputEpoch))
      expect(client.predictionStats.neutralRequired).toBe(true)
      expect(client.predictionStats.pending).toBe(0)
      hold = false
      release()
      for (let i = 0; i < 40; i++) await Promise.resolve()
      expect(f.registry.view(f.host.matchId, f.host.token).nextSequence).toBe(0)
      client.queue({ kind: 'move', action: 'special', input: 0 })
      await client.step(2)
      expect(uploads.at(-1)!.packets).toEqual([{ sequence: 0, input: 0, commands: [] }])
      await client.step(0)
      expect(client.predictionStats.neutralRequired).toBe(false)
      client.queue({ kind: 'move', action: 'light', input: 0 })
      await client.step(0)
      expect(get(client).connection).toBe('connected')
      expect(JSON.stringify(uploads.at(-1))).toContain('light')
    } finally {
      hold = false
      release()
      client.stop()
    }
  })
})
