import { describe, expect, it } from 'vitest'
import {
  BASELINE_FIGHTERS,
  BASELINE_SITUATIONS,
  BASELINE_TERRAINS,
  BASELINE_SEED,
  createBaselineSituation,
} from './combatBaseline'
import { combatRoute, combatRoutesFor } from './combatRoutes'
import { createBaselineRoute, runBaselineRoute } from './combatBaselineRoutes'
import { runBaselineSituation } from './combatBaselineSituations'
import { verifyBaselineReplay } from './combatBaselineTape'
import { fightReplayHash } from './fightReplayHash'
import { decodeFightReplay } from './fightReplayCodec'
import { createReplayPlayer } from './fightReplayPlayer'
import { practiceReplay } from './fightReplayPractice'
import { tickFight } from './engine'
import { EMPTY_INPUT } from './types'
import type { BaselineTerrain } from './combatBaseline'

const terrains = Object.keys(BASELINE_TERRAINS) as BaselineTerrain[]

describe('six-fighter fixed starting situations', () => {
  it('starts the approach trial clear of both interactive crates', () => {
    const state = createBaselineSituation({
      fighter: 'kurapika',
      terrain: 'interactive',
      situation: 'approach',
    })
    const after = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: EMPTY_INPUT,
      ai: false,
    })
    expect(after.player.x).toBe(state.player.x)
    expect(after.opponent.x).toBe(state.opponent.x)
  })
  for (const fighter of BASELINE_FIGHTERS)
    for (const terrain of terrains)
      it(`${fighter}/${terrain}: seven independent finite states`, () => {
        for (const situation of BASELINE_SITUATIONS) {
          const options = { fighter, terrain, situation }
          const state = createBaselineSituation(options)
          expect(fightReplayHash(createBaselineSituation(options))).toBe(fightReplayHash(state))
          expect(state).toMatchObject({ rng: BASELINE_SEED, phase: 'fighting', mode: 'training' })
          for (const side of ['player', 'opponent'] as const) {
            expect(state[side]).toMatchObject({ health: 300, aura: 100, attack: null })
            expect(state.training!.settings.resources[side]).toMatchObject({
              infiniteHealth: false,
              infiniteAura: false,
            })
          }
          expect(state.environment).toMatchObject(BASELINE_TERRAINS[terrain])
          expect(state.battlefield!.entities.filter((entry) => entry.arena)).toHaveLength(
            terrain === 'interactive' ? 2 : 0,
          )
          expect(state.player.hatsuEffects.cyclotronTurns).toBe(0)
          expect(state.bungeeGum).toBeNull()
          expect(state.training!.settings.dummy.behavior).toBe(
            situation === 'wakeup' ? 'reversal' : 'manual',
          )
        }
      })
})

describe('routes keep real prerequisites and measured outcomes', () => {
  for (const fighter of BASELINE_FIGHTERS)
    for (const route of combatRoutesFor(fighter))
      it(`${route.id}: real conversion and replay at two cadences`, () => {
        const result = runBaselineRoute({
          route,
          terrain: 'neutral',
          mirrored: false,
          corner: false,
          gap: 6,
        })
        expect(result.route.completed, JSON.stringify(result.measurement.contacts)).toBe(true)
        expect(result.route.recoverySettled).toBe(true)
        expect(result.measurement.replayVerified).toBe(true)
        expect(result.measurement.resources.opponent.healthLost).toBeGreaterThan(0)
      })
  it('uses paid setup snapshots and retains the actual aura and target health', () => {
    for (const id of ['hisoka:tether', 'phinks:charged']) {
      const route = combatRoute(id)
      const state = createBaselineRoute({
        route,
        terrain: 'neutral',
        mirrored: false,
        corner: false,
        gap: 6,
      })
      expect(state.frame).toBeGreaterThan(0)
      expect(state.player.aura).toBeLessThan(100)
      if (id.startsWith('hisoka')) expect(state.bungeeGum).not.toBeNull()
      else expect(state.player.hatsuEffects.cyclotronTurns).toBeGreaterThan(0)
    }
  })
})

describe('scripted situations record real events rather than forcing success', () => {
  for (const fighter of BASELINE_FIGHTERS)
    for (const terrain of terrains)
      for (const situation of BASELINE_SITUATIONS)
        it(`${fighter}/${situation}/${terrain}: checkpoints and importable practice`, () => {
          const result = runBaselineSituation({ fighter, situation, terrain })
          expect(result.measurement.endFrame).toBe(240)
          expect(result.measurement.replayVerified).toBe(true)
          if (situation === 'throws') {
            expect(result.measurement.throwTechs).toBe(1)
            expect(result.measurement.resources.player.healthLost).toBe(0)
            expect(result.measurement.resources.opponent.healthLost).toBe(0)
          }
          if (situation === 'projectiles')
            expect(result.measurement.projectilesLaunched).toBeGreaterThan(0)
          if (situation === 'corner')
            expect(result.measurement.contacts.some((hit) => hit.blocked || hit.parried)).toBe(true)
          const replay = decodeFightReplay(JSON.stringify(result.replay))
          const initial = createReplayPlayer(replay).state
          const practice = practiceReplay(initial, 'baseline', 0)!
          expect(practice.player).toEqual(initial.player)
          expect(practice.opponent).toEqual(initial.opponent)
          expect(practice.mode).toBe('versus-local')
        })
  it('detects altered recordings instead of certifying them', () => {
    const result = runBaselineSituation({
      fighter: 'phinks',
      situation: 'throws',
      terrain: 'neutral',
    })
    const tampered = structuredClone(result.replay)
    tampered.packets[0][3] = []
    expect(() => verifyBaselineReplay(tampered)).toThrow(/Baseline replay/)
  })
  it('does not grant Pain Packer injuries for an initial preparation request', () => {
    const result = runBaselineSituation({
      fighter: 'feitan',
      situation: 'preparation',
      terrain: 'neutral',
    })
    expect(result.measurement.attempts[0]).toMatchObject({
      frame: 0,
      outcome: 'refused',
      auraDebited: 0,
    })
  })
})
