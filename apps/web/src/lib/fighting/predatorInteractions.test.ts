import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, performMove, tickFight } from './engine'
import { FIXED_STEP, activeHitbox, attackData } from './frameData'
import { advancePredator, PREDATOR_ANALYSIS_FRAMES } from './predator'
import { predatorAiSlots } from './predatorAi'
import { resolvePredatorThreats } from './predatorCombat'
import { PREDATOR_SEAL_FRAMES } from './predatorSeal'
import { EMPTY_INPUT, type FightProjectile, type FightState } from './types'

function frames(state: FightState, count: number): FightState {
  for (let n = 0; n < count; n++)
    state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
  return state
}

function hunting(): FightState {
  let state = beginFight(createFight('rihan', 'hisoka', { mode: 'versus-local' }))
  state.player.aura = 100
  state.bungeeGum = { owner: 'opponent', target: 'player', hidden: false, retracting: false }
  state = frames(
    performMove({ state, side: 'player', action: 'special' }),
    PREDATOR_ANALYSIS_FRAMES,
  )
  return performMove({ state, side: 'player', action: 'finisher' })
}

describe('Predator interactions', () => {
  it('can be destroyed by an enemy blow without sealing Nen or hitting a body', () => {
    const armed = performAttack(hunting(), 'opponent', 'light')
    armed.opponent.attack!.frame = attackData('light', armed.opponent).startup
    const box = activeHitbox(armed.opponent)!
    armed.player.predator!.hunt = {
      ...armed.player.predator!.hunt!,
      x: (box.left + box.right) / 2,
      y: (box.top + box.bottom) / 2,
    }
    const next = resolvePredatorThreats(armed)
    expect(next.player.predator?.hunt).toBeNull()
    expect(next.player.predator?.sealFrames).toBe(0)
    expect(next.bungeeGum).not.toBeNull()
    expect(next.opponent.attack).toMatchObject({ impacted: true, confirmedHit: false })
    expect(next.player.health).toBe(armed.player.health)
    expect(next.opponent.health).toBe(armed.opponent.health)
    expect(next.score).toEqual(armed.score)
  })

  it('intercepts a swept projectile without giving its user the successful-predation penalty', () => {
    const state = hunting()
    const hunt = state.player.predator!.hunt!
    const shot: FightProjectile = {
      id: 9,
      owner: 'opponent',
      fighterId: 'hisoka',
      x: hunt.x + 8,
      y: hunt.y,
      velocityX: -1200,
      width: 0.5,
      height: 0.3,
      damage: 8,
      hitstun: 13,
      blockstun: 9,
      hitstop: 5,
      knockback: 2,
      targetZone: 'torso',
      shape: 'card',
      colour: '#fff',
      age: 0,
      lifetime: 120,
      matter: 'object',
    }
    state.projectiles = [shot]
    const next = resolvePredatorThreats(state)
    expect(next.player.predator?.hunt).toBeNull()
    expect(next.player.predator?.sealFrames).toBe(0)
    expect(next.projectiles).toEqual([])
    expect(next.bungeeGum).not.toBeNull()
  })

  it('devours Hanzo’s double while leaving the real body unharmed', () => {
    let state = beginFight(createFight('rihan', 'hanzo', { mode: 'versus-local' }))
    state.player.aura = 100
    state.opponent.aura = 100
    state = performAttack(state, 'opponent', 'special')
    state = frames(performMove({ state, side: 'player', action: 'special' }), 210)
    expect(state.player.predator?.analysis?.preyId).toBe('hanzo-skill-4')
    expect(state.opponent.hanzoProjection).toBeTruthy()
    const health = state.opponent.health
    state = performMove({ state, side: 'player', action: 'finisher' })
    for (let n = 0; n < 180 && !state.player.predator?.sealFrames; n++) state = frames(state, 1)
    expect(state.opponent.hanzoProjection).toBeUndefined()
    expect(state.opponent.health).toBe(health)
    expect(state.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
    expect(state.player.predator?.sealFrames).toBe(PREDATOR_SEAL_FRAMES)
  })

  it('makes the AI study first and release only a prepared Predator', () => {
    const state = hunting()
    state.opponent.id = 'rihan'
    expect(predatorAiSlots(state)[0]).toBe('neutralSpecial')
    state.opponent.predator = {
      ...state.player.predator!,
      hunt: null,
      analysis: { owner: 'player', preyId: 'bungee-gum', observedFrames: PREDATOR_ANALYSIS_FRAMES },
    }
    state.player.id = 'hisoka'
    state.bungeeGum = { owner: 'player', target: 'opponent', hidden: false, retracting: false }
    expect(predatorAiSlots(state)).toEqual(['finisher'])
  })

  it('keeps a borrowed Predator active through analysis and capture, retaining the price on Kurapika', () => {
    let state = beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' }))
    state.player.aura = 100
    state.player.kurapika = {
      ...state.player.kurapika!,
      emperorTime: true,
      held: {
        victim: 'opponent',
        source: 'rihan',
        moveId: 'rihan:neutralSpecial',
        loaded: true,
        used: false,
        sustainedKeys: [],
      },
    }
    state.bungeeGum = { owner: 'opponent', target: 'player', hidden: false, retracting: false }
    state = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(state.player.kurapika?.held?.used).toBe(true)
    expect(state.player.predator?.watching).toBe(true)
    state = frames(state, PREDATOR_ANALYSIS_FRAMES)
    expect(state.player.kurapika?.held).toBeTruthy()
    state = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(state.player.predator?.hunt).toBeTruthy()
    for (let n = 0; n < 180 && !state.player.predator?.sealFrames; n++) state = frames(state, 1)
    expect(state.bungeeGum).toBeNull()
    expect(state.player.predator?.sealFrames).toBe(PREDATOR_SEAL_FRAMES)
    expect(state.player.nen.mode).toBe('zetsu')
    expect(state.player.id).toBe('kurapika')
    expect(advancePredator(state).player.predator?.sealFrames).toBe(PREDATOR_SEAL_FRAMES)
  })
})
