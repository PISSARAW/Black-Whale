import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performMove,
  performAuraAttack,
  tickFight,
} from './engine'
import { finishFight } from './combatVerdict'
import { FIXED_STEP } from './fightClock'
import { hatsuDefenceFactor, hatsuFor, canUseFightHatsu } from './hatsu'
import { applyAuraContext, focusGuardRyu, focusAttackRyu } from './nen'
import { canUseRangedAttack } from './projectiles'
import { canSwearOn } from './onTechnique'
import { finisherReady, moveForSlot } from './movesets'
import {
  advancePredator,
  PREDATOR_ANALYSIS_FRAMES,
  predatorReady,
  choosePredatorPrey,
} from './predator'
import { PREDATOR_SEAL_FRAMES, predatorNenLocked } from './predatorSeal'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type FighterId,
} from './types'

function duel(owner: FightSide = 'player', enemy: FighterId = 'hisoka'): FightState {
  const state = beginFight(
    createFight(owner === 'player' ? 'rihan' : enemy, owner === 'opponent' ? 'rihan' : enemy, {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return {
    ...state,
    player: { ...state.player, aura: 100 },
    opponent: { ...state.opponent, aura: 100 },
  }
}

function frames(
  state: FightState,
  count: number,
  playerInput: Partial<FightInput> = {},
): FightState {
  for (let n = 0; n < count; n++)
    state = tickFight(
      state,
      { ...EMPTY_INPUT, ...playerInput },
      { dt: FIXED_STEP, opponentInput: EMPTY_INPUT },
    )
  return state
}

function gum(state: FightState, owner: FightSide = 'opponent'): FightState {
  return {
    ...state,
    bungeeGum: {
      owner,
      target: owner === 'player' ? 'opponent' : 'player',
      hidden: false,
      retracting: false,
    },
  }
}

function studied(owner: FightSide = 'player'): FightState {
  const state = gum(duel(owner), owner === 'player' ? 'opponent' : 'player')
  return frames(performMove({ state, side: owner, action: 'special' }), PREDATOR_ANALYSIS_FRAMES)
}

function succeed(state: FightState, owner: FightSide = 'player'): FightState {
  state = performMove({ state, side: owner, action: 'finisher' })
  expect(state[owner].predator?.hunt).toBeTruthy()
  for (let n = 0; n < 180 && !predatorNenLocked(state[owner]); n++) state = frames(state, 1)
  expect(predatorNenLocked(state[owner])).toBe(true)
  return state
}

describe('Rihan — analysis, targeted predation and the 48-hour price', () => {
  it('never grants defence or forced Zetsu just by landing a special', () => {
    const state = duel()
    const next = hatsuFor('rihan').onImpact({
      state,
      side: 'player',
      defenderSide: 'opponent',
      source: 'rihan',
      blocked: false,
      concealed: false,
    })
    expect(next).toBe(state)
    expect(next.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
    expect(hatsuDefenceFactor(next.player)).toBe(1)
    expect(next.player.predator).toBeUndefined()
  })

  it('starts a personal observation with no strike, lunge or aura cost', () => {
    const state = duel()
    const next = performMove({ state, side: 'player', action: 'special' })
    expect(next.player.predator?.watching).toBe(true)
    expect(next.player.attack).toBeNull()
    expect(next.player.aura).toBe(state.player.aura)
    expect(next.player.x).toBe(state.player.x)
    expect(next.player.predator?.analysis).toBeNull()
    expect(finisherReady(next, 'player')).toBe(false)
    expect(performMove({ state: next, side: 'player', action: 'finisher' })).toBe(next)
  })

  it.each(['player', 'opponent'] as const)(
    'studies only the visible specific manifestation (%s)',
    (side) => {
      const state = studied(side)
      expect(state[side].predator?.analysis).toMatchObject({
        preyId: 'bungee-gum',
        observedFrames: PREDATOR_ANALYSIS_FRAMES,
      })
      expect(state[side].predator?.known).toEqual(['bungee-gum'])
      expect(predatorReady(state, side)).toBe(true)
      expect(hatsuDefenceFactor(state[side])).toBe(1)
    },
  )

  it('does not turn repeated command presses or a witnessed-Hatsu flag into analysis', () => {
    let state = duel()
    state.player.hatsuEffects.witnessedHatsu = 'hisoka'
    for (let n = 0; n < 20; n++) state = performMove({ state, side: 'player', action: 'special' })
    state = frames(state, 240)
    expect(state.player.predator?.known).toEqual([])
    expect(state.player.predator?.analysis).toBeNull()
    expect(finisherReady(state, 'player')).toBe(false)
  })

  it.each(['phinks', 'franklin', 'biscuit'] as const)(
    'does not counter ordinary reinforcement or simple emitted shots: %s',
    (enemy) => {
      let state = performMove({ state: duel('player', enemy), side: 'player', action: 'special' })
      state.opponent.hatsuEffects.cyclotronTurns = 6
      state = frames(state, 200)
      expect(state.player.predator?.analysis).toBeNull()
    },
  )

  it('requires direct sight and Gyo for a concealed manifestation', () => {
    let state = gum(duel())
    state.bungeeGum!.hidden = true
    state = frames(performMove({ state, side: 'player', action: 'special' }), 90)
    expect(state.player.predator?.analysis).toBeNull()
    state = frames(state, 30, { aura: true, jump: true })
    expect(state.player.predator?.analysis?.observedFrames).toBe(30)
  })

  it('pauses observation when all senses are sealed or Rihan is unconscious', () => {
    const state = gum(duel())
    state.player.hatsuEffects.senseSeals = 3
    const next = frames(performMove({ state, side: 'player', action: 'special' }), 30)
    expect(next.player.predator?.analysis).toBeNull()
    const hurt = {
      ...next,
      player: {
        ...next.player,
        hatsuEffects: { ...next.player.hatsuEffects, senseSeals: 0 },
        hitStun: 60,
      },
    }
    expect(frames(hurt, 30).player.predator?.analysis).toBeNull()
  })

  it('keeps separate knowledge and progress for different Hatsu', () => {
    let state = duel('player', 'chrollo')
    state.opponent.chrolloBook = {
      pages: ['hisoka', 'sun-and-moon'],
      page: 0,
      open: true,
      bookmark: 'sun-and-moon',
    }
    state.player.hatsuEffects.sunMark = 1
    state = frames(performMove({ state: gum(state), side: 'player', action: 'special' }), 40)
    expect(state.player.predator?.analysis?.preyId).toBe('bungee-gum')
    state.bungeeGum = null
    state = frames(state, 20)
    expect(state.player.predator?.analysis?.observedFrames).toBe(40)
    state = choosePredatorPrey(state, 'player', 1)
    expect(state.player.predator?.analysis).toMatchObject({
      preyId: 'sun-and-moon',
      observedFrames: 0,
    })
    expect(frames(state, 20).player.predator?.analysis?.observedFrames).toBe(20)
  })

  it.each(['player', 'opponent'] as const)(
    'devours the studied construct with no damage, points or enemy Zetsu (%s)',
    (side) => {
      const ready = studied(side)
      const enemy = side === 'player' ? 'opponent' : 'player'
      const next = succeed(ready, side)
      expect(next.bungeeGum).toBeNull()
      expect(next[side].predator?.sealFrames).toBe(PREDATOR_SEAL_FRAMES)
      expect(next[side].predator?.successes).toBe(1)
      expect(next[side].nen.mode).toBe('zetsu')
      expect(next[enemy].nen.mode).toBe('ten')
      expect(next[enemy].hatsuEffects.forcedZetsuFrames).toBe(0)
      expect(next.player.health).toBe(ready.player.health)
      expect(next.opponent.health).toBe(ready.opponent.health)
      expect(next.score).toEqual(ready.score)
      expect(next.knockdowns).toEqual(ready.knockdowns)
      expect(next.impact).toBeNull()
      expect(next.phase).toBe('fighting')
      expect(next[side].aura).toBeLessThan(ready[side].aura)
    },
  )

  it('does not remove another Hatsu or prevent the opponent from using Nen', () => {
    let state = duel('player', 'chrollo')
    state.opponent.chrolloBook = {
      pages: ['hisoka', 'sun-and-moon'],
      page: 0,
      open: true,
      bookmark: 'sun-and-moon',
    }
    state.player.hatsuEffects.sunMark = 1
    state = frames(performMove({ state: gum(state), side: 'player', action: 'special' }), 180)
    const next = succeed(state)
    expect(next.player.hatsuEffects.sunMark).toBe(1)
    expect(canUseFightHatsu(next.opponent)).toBe(true)
    expect(applyAuraContext(next.opponent, { ...EMPTY_INPUT, aura: true }).nen.mode).toBe('ren')
  })

  it('pays no 48-hour seal if the studied manifestation disappears before capture', () => {
    let state = performMove({ state: studied(), side: 'player', action: 'finisher' })
    state.bungeeGum = null
    state = frames(state, 1)
    expect(state.player.predator?.hunt).toBeNull()
    expect(state.player.predator?.sealFrames).toBe(0)
    expect(state.player.predator?.successes).toBe(0)
    expect(state.player.nen.mode).toBe('ten')
  })

  it('cancels the hunt when Rihan loses access to Predator', () => {
    const state = performMove({ state: studied(), side: 'player', action: 'finisher' })
    state.player.hatsuEffects.hatsuStolen = 1
    const next = advancePredator(state)
    expect(next.player.predator?.hunt).toBeNull()
    expect(next.bungeeGum).not.toBeNull()
    expect(next.player.predator?.sealFrames).toBe(0)
  })

  it('requires 40 aura to conjure the predator but not to study', () => {
    let state = duel()
    state.player.aura = 0
    state = performMove({ state, side: 'player', action: 'special' })
    expect(state.player.predator?.watching).toBe(true)
    const ready = studied()
    ready.player.aura = 39
    expect(predatorReady(ready, 'player')).toBe(false)
    expect(performMove({ state: ready, side: 'player', action: 'finisher' })).toBe(ready)
  })

  it.each([{ aura: true }, { aura: true, guard: true }, { aura: true, jump: true }, {}])(
    'blocks all aura controls during the seal: %j',
    (input) => {
      const state = succeed(studied())
      const locked = applyAuraContext(state.player, { ...EMPTY_INPUT, ...input })
      expect(locked.nen).toMatchObject({
        mode: 'zetsu',
        gyo: false,
        ken: false,
        ko: null,
        on: false,
        ryu: {},
      })
      expect(focusGuardRyu(locked, 'head').nen.ryu).toEqual({})
      expect(focusAttackRyu(locked, 'heavy').nen.ryu).toEqual({})
      expect(canUseFightHatsu(locked)).toBe(false)
      expect(canUseRangedAttack(locked)).toBe(false)
      expect(canSwearOn({ ...locked, on: { grudge: 100, sealFrames: 0 } })).toBe(false)
    },
  )

  it('allows physical combat without Ko or defensive enhancements during the seal', () => {
    const state = succeed(studied())
    const next = performMove({
      state,
      side: 'player',
      action: 'light',
      input: { ...EMPTY_INPUT, aura: true },
    })
    expect(next.player.attack?.kind).toBe('light')
    expect(next.player.attack?.auraCharged).toBe(false)
    expect(next.player.nen.mode).toBe('zetsu')
    expect(hatsuDefenceFactor(next.player)).toBe(1)
    expect(next.player.aura).toBe(state.player.aura)
    expect(performAuraAttack({ state, side: 'player', kind: 'special', auraCharged: true })).toBe(
      state,
    )
  })

  it('counts 48 actual simulated hours, including hitstop, and expires only after that time', () => {
    expect(PREDATOR_SEAL_FRAMES).toBe(48 * 3600 * 60)
    let state = succeed(studied())
    const initial = state.player.predator!.sealFrames
    state.hitstop = 10
    state = frames(state, 10)
    expect(state.player.predator!.sealFrames).toBe(initial - 10)
    state.player.predator!.sealFrames = 2
    expect(predatorNenLocked(frames(state, 1).player)).toBe(true)
    const released = frames(state, 2)
    expect(predatorNenLocked(released.player)).toBe(false)
    expect(released.player.nen.mode).toBe('ten')
  })

  it('keeps the seal across the next round and resets it only for a fresh match', () => {
    const state = succeed(studied())
    const round = nextRound(finishFight(state, 'opponent'))
    expect(round.player.predator!.sealFrames).toBe(state.player.predator!.sealFrames)
    expect(round.player.nen.mode).toBe('zetsu')
    expect(performMove({ state: beginFight(round), side: 'player', action: 'special' })).toEqual(
      beginFight(round),
    )
    expect(createFight('rihan', 'hisoka').player.predator).toBeUndefined()
  })

  it('preserves the cost in training without ending or resetting the round', () => {
    const state = studied()
    state.mode = 'training'
    const next = succeed(state)
    expect(next.phase).toBe('fighting')
    expect(next.player.predator?.sealFrames).toBe(PREDATOR_SEAL_FRAMES)
    expect(next.winner).toBeNull()
  })

  it('makes Skill Hunter perform its own analysis and pay the same lasting price', () => {
    let state = duel()
    state.player.id = 'chrollo'
    state.player.chrolloBook = { pages: ['rihan'], page: 0, open: true, bookmark: 'rihan' }
    state.player.hatsuEffects.stolenHatsu = 'rihan'
    state = frames(performMove({ state: gum(state), side: 'player', action: 'special' }), 180)
    expect(state.player.predator?.analysis?.observedFrames).toBe(180)
    const next = succeed(state)
    next.player.chrolloBook = { pages: ['black-voice'], page: 0, open: true, bookmark: null }
    expect(frames(next, 1).player.predator!.sealFrames).toBe(PREDATOR_SEAL_FRAMES - 1)
    expect(canUseFightHatsu(next.player)).toBe(false)
  })

  it('never assigns damage or knockback to any Predator command', () => {
    for (const slot of [
      'neutralSpecial',
      'forwardSpecial',
      'backSpecial',
      'downSpecial',
      'finisher',
    ] as const) {
      const move = moveForSlot('rihan', slot)!
      expect(move.tuning).toMatchObject({ damage: 0, lunge: 0, reach: 0, hitstun: 0, knockback: 0 })
    }
  })
})
