import { describe, expect, it } from 'vitest'
import { clashBearer, clashBody, createClashLobby, updateClashLobby } from './clashPvpHttp'
import { clashPvpRegistry } from './clashPvp'
import { createFightEnvironment } from '$lib/fighting/fightEnvironment'
import { PVP_RULESET } from '$lib/fighting/pvp/types'

const setup = {
  player: 'hisoka',
  opponent: 'kurapika',
  formatId: 'knockout',
  environment: createFightEnvironment(),
}
const request = (token = '') =>
  new Request('http://localhost/test', { headers: { authorization: `Bearer ${token}` } })
describe('Clash PvP HTTP boundary', () => {
  it('bounds streamed JSON and handles malformed requests', async () => {
    expect(
      await clashBody(new Request('http://localhost', { method: 'POST', body: 'x'.repeat(8193) })),
    ).toBeNull()
    expect(
      await clashBody(new Request('http://localhost', { method: 'POST', body: '{' })),
    ).toBeNull()
    expect(
      await clashBody(new Request('http://localhost', { method: 'POST', body: '{"sequence":1}' })),
    ).toEqual({ sequence: 1 })
    expect(clashBearer(new Request('http://localhost'))).toBe('')
    expect(clashBearer(request('private'))).toBe('private')
  })
  it('rejects wrong versions, forged setups, unknown commands and unauthenticated inputs', async () => {
    expect(createClashLobby({ setup, ruleset: 'old' }).status).toBe(426)
    expect(
      createClashLobby({ setup: { ...setup, health: 1000 }, ruleset: PVP_RULESET }).status,
    ).toBe(400)
    const session = await createClashLobby({ setup, ruleset: PVP_RULESET }).json()
    expect(
      updateClashLobby(session.matchId, request(), {
        kind: 'input',
        round: 1,
        inputEpoch: 0,
        packet: { sequence: 0, input: 0, commands: [] },
      }).status,
    ).toBe(401)
    expect(
      updateClashLobby(session.matchId, request(session.token), {
        kind: 'input',
        round: 1,
        inputEpoch: 0,
        packet: { sequence: 0, input: 0, commands: [{ kind: 'panel', payload: 'forged' }] },
      }).status,
    ).toBe(400)
    expect(
      updateClashLobby(session.matchId, request(session.token), {
        kind: 'set-winner',
        winner: 'player',
      }).status,
    ).toBe(400)
  })
  it('keeps tokens out of invitations, requires both confirmations, and never accepts a client verdict', async () => {
    const created = createClashLobby({ setup, ruleset: PVP_RULESET })
    expect(created.headers.get('cache-control')).toBe('no-store')
    const host = await created.json()
    const guest = await updateClashLobby(host.matchId, request(), {
      kind: 'join',
      ruleset: PVP_RULESET,
      invitation: host.inviteHref.split('#')[1],
    }).json()
    const configHash = clashPvpRegistry.view(host.matchId, host.token).configHash
    for (const token of [host.token, guest.token])
      expect(
        updateClashLobby(host.matchId, request(token), {
          kind: 'ready',
          ruleset: PVP_RULESET,
          configHash,
        }).status,
      ).toBe(200)
    const response = updateClashLobby(host.matchId, request(guest.token), {
      kind: 'input',
      round: 1,
      inputEpoch: 0,
      packet: {
        sequence: 0,
        input: 0,
        commands: [{ kind: 'move', side: 'player', action: 'heavy', input: 0 }],
      },
    })
    expect(response.status).toBe(400)
    expect(clashPvpRegistry.view(host.matchId, host.token).nextSequence).toBe(0)
    expect(clashPvpRegistry.view(host.matchId, host.token).status).toBe('playing')
  })
})
