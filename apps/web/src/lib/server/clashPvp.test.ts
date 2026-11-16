import { describe, expect, it } from 'vitest'
import { ClashPvpRegistry } from './clashPvp'
import { createFightEnvironment } from '$lib/fighting/fightEnvironment'
import { PVP_RULESET } from '$lib/fighting/pvp/types'
import { decodePvpView } from '$lib/fighting/pvp/client'
import { packReplayInput } from '$lib/fighting/fightReplayInput'
import { EMPTY_INPUT } from '$lib/fighting/types'

function lobby() {
  let now = 1_000,
    id = 0
  const registry = new ClashPvpRegistry(
    () => now,
    () => `test-${++id}`,
  )
  const setup = {
    player: 'kurapika',
    opponent: 'hisoka',
    formatId: 'knockout',
    environment: createFightEnvironment(),
  } as const
  const host = registry.create(setup),
    guest = registry.join(host.matchId, PVP_RULESET, { invitation: host.inviteHref.split('#')[1] })
  const view = () => registry.view(host.matchId, host.token)
  const ready = (token: string) =>
    registry.ready(host.matchId, { token, ruleset: PVP_RULESET, configHash: view().configHash })
  return { registry, host, guest, view, ready, advance: (ms: number) => (now += ms) }
}
describe('authoritative private Clash lobby', () => {
  it('allows time to review the initial lobby and starts only while both confirmed seats are connected', () => {
    const l = lobby()
    const configHash = l.view().configHash
    l.ready(l.host.token)
    l.advance(31_000)
    const guestReady = l.registry.ready(l.host.matchId, {
      token: l.guest.token,
      ruleset: PVP_RULESET,
      configHash,
    })
    expect(guestReady.status).toBe('ready')
    expect(l.view().status).toBe('playing')
    expect(guestReady.tick).toBe(0)
  })
  it('requires both seats again after a timed round and resets through the ordinary round engine', () => {
    const l = lobby()
    l.ready(l.host.token)
    l.ready(l.guest.token)
    for (let pulse = 0; pulse < 481 && l.view().status === 'playing'; pulse++) {
      l.advance(250)
      l.registry.view(l.host.matchId, l.guest.token)
    }
    const finished = l.view()
    expect(finished.status).toBe('ready')
    expect(decodePvpView(finished).phase).toBe('finished')
    expect(finished.ready).toEqual({ player: false, opponent: false })
    l.ready(l.host.token)
    expect(decodePvpView(l.view()).roundNumber).toBe(1)
    const next = l.ready(l.guest.token)
    expect(decodePvpView(next).roundNumber).toBe(2)
    expect(decodePvpView(next).remainingFrames).toBe(7200)
  })
  it('produces the same terminal match verdict for both browsers after two real gunfight rounds', () => {
    let now = 1000,
      id = 0
    const registry = new ClashPvpRegistry(
      () => now,
      () => `verdict-${++id}`,
    )
    const host = registry.create({
      player: 'theta',
      opponent: 'hisoka',
      formatId: 'knockout',
      environment: createFightEnvironment(),
    })
    const guest = registry.join(host.matchId, PVP_RULESET, {
      invitation: host.inviteHref.split('#')[1],
    })
    const view = () => registry.view(host.matchId, host.token)
    function readyBoth() {
      for (const token of [host.token, guest.token])
        registry.ready(host.matchId, { token, ruleset: PVP_RULESET, configHash: view().configHash })
    }
    readyBoth()
    let sequence = 0
    for (let pulse = 0; pulse < 2000 && view().status !== 'finished'; pulse++) {
      if (view().status === 'ready') readyBoth()
      registry.submit(host.matchId, {
        token: host.token,
        packet: {
          sequence: sequence++,
          input: 0,
          commands: [{ kind: 'move', action: 'ranged', input: 0 }],
        },
      })
      now += 100
      registry.view(host.matchId, guest.token)
    }
    const one = view(),
      two = registry.view(host.matchId, guest.token)
    expect(one.status).toBe('finished')
    expect(one.authorityHash).toBe(two.authorityHash)
    expect(decodePvpView(one).matchWinner).toBe('player')
    expect(decodePvpView(two).matchWinner).toBe('opponent')
    expect(decodePvpView(one).roundsWon.player).toBe(2)
    expect(() =>
      registry.ready(host.matchId, {
        token: host.token,
        ruleset: PVP_RULESET,
        configHash: one.configHash,
      }),
    ).toThrow('NOT_READY')
  }, 20000)
  it('does not reopen an invitation abandoned before the guest joined', () => {
    let id = 0
    const registry = new ClashPvpRegistry(
      () => 1000,
      () => `closed-${++id}`,
    )
    const host = registry.create({
      player: 'hisoka',
      opponent: 'kurapika',
      formatId: 'knockout',
      environment: createFightEnvironment(),
    })
    registry.leave(host.matchId, host.token)
    expect(() =>
      registry.join(host.matchId, PVP_RULESET, { invitation: host.inviteHref.split('#')[1] }),
    ).toThrow('NOT_READY')
  })
  it('uses one invite and two opaque authenticated seats, and requires both configuration confirmations', () => {
    const l = lobby()
    expect(l.host.token).not.toBe(l.guest.token)
    expect(l.host.inviteHref).not.toContain(l.host.token)
    expect(() =>
      l.registry.join(l.host.matchId, PVP_RULESET, { invitation: l.host.inviteHref.split('#')[1] }),
    ).toThrow('FULL')
    expect(() => l.registry.view(l.host.matchId, 'wrong')).toThrow('UNAUTHORIZED')
    expect(l.ready(l.host.token).status).toBe('ready')
    l.advance(100)
    expect(l.view().tick).toBe(0)
    expect(l.ready(l.guest.token).status).toBe('playing')
    l.advance(50)
    const one = l.view(),
      two = l.registry.view(l.host.matchId, l.guest.token)
    expect(one.tick).toBe(3)
    expect(two.authorityHash).toBe(one.authorityHash)
    expect(two.configHash).toBe(one.configHash)
    expect(decodePvpView(two).player.id).toBe('hisoka')
    expect(decodePvpView(one).player.id).toBe('kurapika')
  })
  it('refuses a mismatched ruleset or configuration without marking the seat ready', () => {
    const l = lobby()
    expect(() => l.registry.join('absent', 'old', { invitation: '' })).toThrow('VERSION')
    for (const change of [{ ruleset: 'old' }, { configHash: 'tampered' }])
      expect(() =>
        l.registry.ready(l.host.matchId, {
          token: l.host.token,
          ruleset: PVP_RULESET,
          configHash: l.view().configHash,
          ...change,
        }),
      ).toThrow('VERSION')
    expect(l.view().ready.player).toBe(false)
  })
  it('binds commands to the token seat and accepts only the next sequence, with exact duplicate receipts', () => {
    const l = lobby()
    l.ready(l.host.token)
    l.ready(l.guest.token)
    const packet = {
      sequence: 0,
      input: packReplayInput({ ...EMPTY_INPUT, left: true }),
      commands: [],
    }
    const first = l.registry.submit(l.host.matchId, { token: l.guest.token, packet })
    expect(first.nextSequence).toBe(1)
    expect(l.registry.submit(l.host.matchId, { token: l.guest.token, packet }).nextSequence).toBe(1)
    expect(() =>
      l.registry.submit(l.host.matchId, { token: l.guest.token, packet: { ...packet, input: 0 } }),
    ).toThrow('SEQUENCE')
    l.advance(50)
    const state = decodePvpView(l.view())
    expect(state.player.x).toBe(22)
    expect(state.opponent.x).toBeLessThan(78)
  })
  it('suspends on missing heartbeat, releases held controls, and resumes the same state without catch-up', () => {
    const l = lobby()
    l.ready(l.host.token)
    l.ready(l.guest.token)
    l.advance(3100)
    const interrupted = l.view()
    expect(interrupted.status).toBe('interrupted')
    expect(interrupted.tick).toBe(0)
    const resumed = l.registry.view(l.host.matchId, l.guest.token)
    expect(resumed.status).toBe('playing')
    expect(resumed.tick).toBe(0)
    l.advance(50)
    expect(l.view().tick).toBe(3)
    expect(decodePvpView(l.view()).player.x).toBe(22)
  })
  it('abandonment is terminal and preserves the last combat state without inventing a winner', () => {
    const l = lobby()
    l.ready(l.host.token)
    l.ready(l.guest.token)
    l.advance(31_000)
    const abandoned = l.view()
    expect(abandoned.status).toBe('abandoned')
    expect(decodePvpView(abandoned).winner).toBeNull()
    expect(l.registry.view(l.host.matchId, l.guest.token).status).toBe('abandoned')
    expect(() =>
      l.registry.submit(l.host.matchId, {
        token: l.host.token,
        packet: { sequence: 0, input: 0, commands: [] },
      }),
    ).toThrow('NOT_PLAYING')
  })
  it('handles explicit leave, expiry, and response mutation without mutating the referee', () => {
    const l = lobby()
    const view = l.view()
    view.ready.player = true
    view.setup.player = 'camilla'
    expect(l.view().setup.player).toBe('kurapika')
    l.registry.leave(l.host.matchId, l.guest.token)
    expect(l.view().status).toBe('abandoned')
    l.advance(30 * 60_000 + 1)
    expect(() => l.view()).toThrow('NOT_FOUND')
  })
  it.each([50, 100, 150])(
    'keeps both seats on the same verdict state with %i ms simulated request latency',
    (latency) => {
      const l = lobby()
      l.ready(l.host.token)
      l.ready(l.guest.token)
      for (let sequence = 0; sequence < 12; sequence++) {
        l.advance(latency)
        l.registry.submit(l.host.matchId, {
          token: l.host.token,
          packet: { sequence, input: 0, commands: [{ kind: 'move', action: 'light', input: 0 }] },
        })
        l.advance(latency)
        l.registry.submit(l.host.matchId, {
          token: l.guest.token,
          packet: { sequence, input: 0, commands: [] },
        })
        const host = l.view(),
          guest = l.registry.view(l.host.matchId, l.guest.token)
        expect(guest.authorityHash).toBe(host.authorityHash)
        expect(decodePvpView(host).winner).toBe(decodePvpView(guest).winner)
        expect(host.status).toBe('playing')
      }
    },
  )
})
