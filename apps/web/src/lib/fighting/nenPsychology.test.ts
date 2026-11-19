import { expect, it } from 'vitest'
import { beginFight, createFight, nextRound } from './engine'
import { planOpponentNen } from './opponentNenPlan'
import { advanceNenPsychology, auraPsychology, readAuraPsychology } from './nenPsychology'
import type { FightImpact, FightState } from './types'

function impact(patch: Partial<FightImpact> = {}): FightImpact {
  return {
    sequence: 1,
    attacker: 'player',
    kind: 'heavy',
    damage: 20,
    blocked: false,
    parried: false,
    critical: false,
    knockdown: false,
    counterHit: true,
    punish: false,
    antiAir: false,
    wallSplat: false,
    invulnerable: false,
    comboHits: 1,
    damageScale: 1,
    points: 0,
    zone: 'torso',
    concealed: false,
    avoided: false,
    projectileId: null,
    position: { x: 50, y: 1 },
    ...patch,
  }
}

function duel(): FightState {
  return beginFight(createFight('hisoka', 'franklin', { mode: 'versus-local' }))
}

it('separates outward pressure from details that require Gyo or En', () => {
  const state = duel()
  state.player = {
    ...state.player,
    nen: { ...state.player.nen, mode: 'ren', in: true },
  }
  expect(auraPsychology(state, 'player').pressure).toBeGreaterThan(0)
  expect(readAuraPsychology(state, 'player', 'opponent')).toBeNull()

  state.opponent = {
    ...state.opponent,
    nen: { ...state.opponent.nen, gyo: true },
  }
  expect(readAuraPsychology(state, 'player', 'opponent')).toMatchObject({
    pressure: 'high',
    detail: { stability: 'steady', intent: 'guarded' },
  })
})

it('reacts once to an authoritative impact and ignores speculative futures', () => {
  const before = duel()
  const contact = { ...before, impact: impact() }
  const reacted = advanceNenPsychology(before, contact)
  expect(reacted.opponent.nenPsychology!.apprehension).toBeGreaterThan(0)
  expect(reacted.opponent.nenPsychology!.composure).toBeLessThan(7_000)
  expect(reacted.player.nenPsychology!.resolve).toBeGreaterThan(5_000)

  const settled = advanceNenPsychology(reacted, reacted)
  expect(settled.opponent.nenPsychology!.apprehension).toBeLessThan(
    reacted.opponent.nenPsychology!.apprehension,
  )
  const forecast = { ...contact, forecastSimulation: true }
  expect(advanceNenPsychology(before, forecast)).toBe(forecast)

  const witnessed = {
    ...before,
    opponent: {
      ...before.opponent,
      hatsuEffects: {
        ...before.opponent.hatsuEffects,
        witnessedHatsu: 'hisoka' as const,
        witnessedAt: before.frame,
      },
    },
  }
  expect(advanceNenPsychology(before, witnessed).opponent.nenPsychology?.apprehension).toBe(90)
})

it('turns overwhelming aura into caution, not damage, and recentres between rounds', () => {
  const state = duel()
  state.player = {
    ...state.player,
    x: 22,
    nen: { ...state.player.nen, mode: 'ren', on: true },
  }
  state.opponent = { ...state.opponent, x: 42, aura: 55 }
  const planned = planOpponentNen(state)
  expect(planned.opponent.nen.ken).toBe(true)
  expect(planned.player.health).toBe(state.player.health)
  expect(planned.opponent.health).toBe(state.opponent.health)
  const tired = {
    ...state,
    player: { ...state.player, nenMentalFatigue: 8_000 },
  }
  expect(auraPsychology(tired, 'player').stability).toBeLessThan(
    auraPsychology(state, 'player').stability,
  )

  const finished = {
    ...state,
    phase: 'finished' as const,
    winner: 'player' as const,
    player: {
      ...state.player,
      nenPsychology: { composure: 5_000, apprehension: 4_000, resolve: 7_000 },
    },
  }
  const next = nextRound(finished)
  expect(next.player.nenPsychology).toEqual({
    composure: 6_000,
    apprehension: 2_000,
    resolve: 6_000,
  })
})
