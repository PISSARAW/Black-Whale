import { describe, expect, it } from 'vitest'
import { spectatorSnapshot } from './spectator'
import { beginFight, createFight, performMove, performAttack, tickFight } from '../engine'
import { decodeFightSnapshot } from '../fightReplaySnapshot'
import { EMPTY_INPUT } from '../types'
import { ClashPvpRegistry } from '$lib/server/clashPvp'
import { PVP_RULESET } from './types'
import { createFightEnvironment } from '../fightEnvironment'

describe('read-only public spectator feed', () => {
  it('removes private facts from both seats, hidden In and all future branches', () => {
    let state = beginFight(createFight('tserriednich', 'hisoka', { mode: 'versus-local' }))
    for (const side of ['player', 'opponent'] as const)
      state[side].bodyAndSoulReplies = [
        {
          frame: 0,
          question: 'in',
          questioner: side,
          target: side === 'player' ? 'opponent' : 'player',
          concealed: true,
        },
      ]
    state = performMove({ state, side: 'player', action: 'special' })
    for (let frame = 0; frame < 32; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
    expect(state.parallelFuture?.phase).toBe('vision')
    state.bungeeGum = { owner: 'opponent', target: 'player', hidden: true, retracting: false }
    const snapshot = spectatorSnapshot(state)
    const view = decodeFightSnapshot(snapshot.snapshot, {
      player: 'tserriednich',
      opponent: 'hisoka',
      mode: 'versus-local',
      formatId: state.formatId,
      environment: state.environment,
    })
    expect(view.parallelFuture).toBeUndefined()
    expect(view.bungeeGum).toBeNull()
    expect(view.player.bodyAndSoulReplies).toBeUndefined()
    expect(view.opponent.bodyAndSoulReplies).toBeUndefined()
    expect(view.player.x).toBe(state.player.x)
    expect(view.opponent.x).toBe(state.opponent.x)
    expect(view.commandFeedback).toBeUndefined()
    expect(view.spectatorView).toBe(true)
    expect(view.player.aura).toBe(0)
    expect(view.opponent.aura).toBe(0)
  })
  it('keeps a physical bullet visible when its aura is concealed, while hiding a Nen projectile', () => {
    let state = performAttack(
      beginFight(createFight('theta', 'franklin', { mode: 'versus-local' })),
      'player',
      'ranged',
    )
    for (let frame = 0; frame < 30 && !state.projectiles.length; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
    const bullet = state.projectiles[0]
    expect(bullet.matter).toBe('object')
    state = {
      ...state,
      projectiles: [
        { ...bullet, concealed: true },
        { ...bullet, id: bullet.id + 1, matter: 'nen', concealed: true },
      ],
    }
    const snapshot = spectatorSnapshot(state)
    const view = decodeFightSnapshot(snapshot.snapshot, {
      player: 'theta',
      opponent: 'franklin',
      mode: 'versus-local',
      formatId: state.formatId,
      environment: state.environment,
    })
    expect(view.projectiles).toHaveLength(1)
    expect(view.projectiles[0].matter).toBe('object')
  })
  it('requires a separate watch token and cannot authenticate a player command with it', () => {
    let now = 1000,
      n = 0
    const registry = new ClashPvpRegistry(
      () => now,
      () => `watch-${++n}`,
    )
    const host = registry.create({
      player: 'hisoka',
      opponent: 'kurapika',
      formatId: 'knockout',
      environment: createFightEnvironment(),
    })
    const watchToken = host.watchHref!.split('#')[1]
    expect(() => registry.join(host.matchId, PVP_RULESET, { invitation: watchToken })).toThrow(
      'INVITATION',
    )
    const guest = registry.join(host.matchId, PVP_RULESET, {
        invitation: host.inviteHref.split('#')[1],
      }),
      watch = host.watchHref!.split('#')[1]
    expect(() => registry.watch(host.matchId, host.token)).toThrow('UNAUTHORIZED')
    expect(() => registry.view(host.matchId, watch)).toThrow('UNAUTHORIZED')
    expect(() =>
      registry.ready(host.matchId, { token: watch, ruleset: PVP_RULESET, configHash: 'anything' }),
    ).toThrow('UNAUTHORIZED')
    const configHash = registry.view(host.matchId, host.token).configHash
    for (const token of [host.token, guest.token])
      registry.ready(host.matchId, { token, ruleset: PVP_RULESET, configHash })
    now += 3100
    expect(registry.watch(host.matchId, watch).status).toBe('interrupted')
    now += 30000
    expect(registry.watch(host.matchId, watch).status).toBe('abandoned')
  })
})
