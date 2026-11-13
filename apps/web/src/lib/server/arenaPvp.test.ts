import { describe, expect, it } from 'vitest'
import { ArenaPvpRegistry, ArenaPvpRegistryError } from './arenaPvp'

describe('Arena PvP transport registry', () => {
  it('creates an invite, joins two authenticated seats and exposes one match', () => {
    const ids = ['match', 'host-id', 'host-token', 'guest-id', 'guest-token']
    const registry = new ArenaPvpRegistry(
      () => 1_000,
      () => ids.shift()!,
    )
    const host = registry.create()
    expect(registry.view(host.matchId, host.playerToken).status).toBe('waiting')

    const guest = registry.join(host.matchId)
    expect(guest.side).toBe('opponent')
    expect(registry.view(host.matchId, host.playerToken).snapshot?.matchId).toBe('match')
    expect(registry.view(host.matchId, guest.playerToken).side).toBe('opponent')
  })

  it('submits ordered commands under the authenticated seat', () => {
    const ids = ['match', 'host-id', 'host-token', 'guest-id', 'guest-token']
    const registry = new ArenaPvpRegistry(
      () => 1_000,
      () => ids.shift()!,
    )
    const host = registry.create()
    registry.join(host.matchId)

    const view = registry.submit(host.matchId, {
      token: host.playerToken,
      sequence: 0,
      action: { type: 'RYU', side: 'player', attackShare: 0.8 },
    })
    expect(view.nextSequence).toBe(1)
    expect(view.snapshot?.state.player.ryuShift?.attackShare).toBe(0.8)
    expect(() =>
      registry.submit(host.matchId, {
        token: host.playerToken,
        sequence: 0,
        action: { type: 'GUARD', side: 'player' },
      }),
    ).toThrowError(ArenaPvpRegistryError)
  })

  it('does not expose a lobby to an unknown token', () => {
    const ids = ['match', 'host-id', 'host-token']
    const registry = new ArenaPvpRegistry(
      () => 1_000,
      () => ids.shift()!,
    )
    const host = registry.create()
    expect(() => registry.view(host.matchId, 'intruder')).toThrowError(
      expect.objectContaining({ code: 'UNAUTHORIZED' }),
    )
  })
})
