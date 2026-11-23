import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { commandMary } from './bloodyMaryAction'
import { performAuraAttack } from './engine'
import { PREDATOR_RANGE_SPREAD } from './predatorSheet'
import { predatorReady } from './predator'
import { setTrainingResources } from './trainingSession'
import { performTrainingAction } from './trainingAction'
import { EMPTY_INPUT, type FightInput, type FightState, type MoveSlot } from './types'

/**
 * Canonical non-strike steps for Lot 2 signature combos (21–30): Rihan's live Predator
 * analysis, Zakuro's Bloody Mary preparation/scouts/recall, Melody's non-damaging flute
 * performance, Basho's uninterrupted haiku writing, and Camilla's opponent-caused fatal
 * riposte triggering Cat's Name post-mortem resurrection.
 */
export type SignatureLot2Step =
  | { opponentSpecial: true }
  | { predator: 'watch' | 'analyze' | 'launch' }
  | { mary: 'bleed' | 'scout' | 'recall' }
  | { melody: 'play' | 'stop' }
  | { basho: 'write' }
  | { fatalRiposte: MoveSlot }

export interface Lot2Frame {
  state: FightState
  input: FightInput
  done: boolean
  catsSeen?: boolean
}

export function isLot2Step(step: object): step is SignatureLot2Step {
  return (
    'opponentSpecial' in step ||
    'predator' in step ||
    'mary' in step ||
    'melody' in step ||
    'basho' in step ||
    'fatalRiposte' in step
  )
}

export function lot2StepFrame(
  state: FightState,
  step: SignatureLot2Step,
  catsSeen = false,
): Lot2Frame {
  if ('opponentSpecial' in step) return opponentSpecialFrame(state)
  if ('predator' in step) return predatorFrame(state, step.predator)
  if ('mary' in step) return maryFrame(state, step.mary)
  if ('melody' in step) return melodyFrame(state, step.melody)
  if ('basho' in step) return bashoFrame(state)
  return fatalRiposteFrame(state, step.fatalRiposte, catsSeen)
}

function opponentSpecialFrame(state: FightState): Lot2Frame {
  if (state.opponent.hanzoProjection) return { state, input: EMPTY_INPUT, done: true }
  if (state.opponent.attack) return { state, input: EMPTY_INPUT, done: false }
  const after = performTrainingAction({ state, side: 'opponent', action: 'special' })
  return { state: after, input: EMPTY_INPUT, done: Boolean(after.opponent.hanzoProjection) }
}

function predatorFrame(state: FightState, phase: 'watch' | 'analyze' | 'launch'): Lot2Frame {
  if (phase === 'watch') return watchPredator(state)
  if (phase === 'analyze') return analyzePredator(state)
  return launchPredatorFrame(state)
}

function watchPredator(state: FightState): Lot2Frame {
  if (state.player.predator?.watching) return { state, input: EMPTY_INPUT, done: true }
  if (state.player.attack || state.player.motion?.dash)
    return { state, input: EMPTY_INPUT, done: false }
  const after = performTrainingAction({ state, side: 'player', action: 'special' })
  return { state: after, input: EMPTY_INPUT, done: Boolean(after.player.predator?.watching) }
}

function predatorAdvanceInput(state: FightState): FightInput {
  const right = state.opponent.x > state.player.x
  return { ...EMPTY_INPUT, right, left: !right }
}

function analyzePredator(state: FightState): Lot2Frame {
  if (predatorReady(state, 'player')) return { state, input: EMPTY_INPUT, done: true }
  const sheet = state.player.predator?.analysis?.sheet
  if (!sheet) return { state, input: EMPTY_INPUT, done: false }
  if (sheet.postures.length < 3) return { state, input: { ...EMPTY_INPUT, guard: true }, done: false }
  const spread = sheet.spacing ? sheet.spacing.max - sheet.spacing.min : 0
  const input = spread < PREDATOR_RANGE_SPREAD ? predatorAdvanceInput(state) : EMPTY_INPUT
  return { state, input, done: false }
}

function launchPredatorFrame(state: FightState): Lot2Frame {
  if (state.player.predator?.hunt) return { state, input: EMPTY_INPUT, done: true }
  if (state.player.attack) return { state, input: EMPTY_INPUT, done: false }
  const after = performTrainingAction({ state, side: 'player', action: 'finisher' })
  return { state: after, input: EMPTY_INPUT, done: Boolean(after.player.predator?.hunt) }
}

function maryFrame(state: FightState, action: 'bleed' | 'scout' | 'recall'): Lot2Frame {
  if (action === 'bleed') return bleedMary(state)
  if (action === 'scout') return scoutMary(state)
  return recallMaryFrame(state)
}

function bleedMary(state: FightState): Lot2Frame {
  if ((state.player.bloodyMary?.available ?? 0) >= 6)
    return { state, input: EMPTY_INPUT, done: true }
  if ((state.player.openWounds ?? 0) > 0) return { state, input: EMPTY_INPUT, done: false }
  const after = commandMary({ state, side: 'player', command: 'bleed' }, performAuraAttack)
  return { state: after, input: EMPTY_INPUT, done: false }
}

function scoutMary(state: FightState): Lot2Frame {
  if ((state.player.bloodyMary?.drops.length ?? 0) > 0)
    return { state, input: EMPTY_INPUT, done: true }
  const after = commandMary({ state, side: 'player', command: 'scout' }, performAuraAttack)
  return { state: after, input: EMPTY_INPUT, done: (after.player.bloodyMary?.drops.length ?? 0) > 0 }
}

function maryRecalled(state: FightState): boolean {
  const blood = state.player.bloodyMary
  return Boolean(blood?.returning || (blood?.sealedWounds ?? 0) > 0)
}

function recallMaryFrame(state: FightState): Lot2Frame {
  if (maryRecalled(state)) return { state, input: EMPTY_INPUT, done: true }
  if (state.player.attack) return { state, input: EMPTY_INPUT, done: false }
  const after = commandMary({ state, side: 'player', command: 'recall' }, performAuraAttack)
  return { state: after, input: EMPTY_INPUT, done: maryRecalled(after) }
}

function melodyFrame(state: FightState, phase: 'play' | 'stop'): Lot2Frame {
  if (phase === 'play') {
    if (state.opponent.hatsuEffects.entrancedFrames > 0)
      return { state, input: EMPTY_INPUT, done: true }
    if (state.player.melodyPerformance || state.player.attack || state.player.motion?.dash)
      return { state, input: EMPTY_INPUT, done: false }
    const after = performTrainingAction({ state, side: 'player', action: 'special' })
    return { state: after, input: EMPTY_INPUT, done: false }
  }
  if (!state.player.melodyPerformance) return { state, input: EMPTY_INPUT, done: true }
  const after = performTrainingAction({ state, side: 'player', action: 'special' })
  return { state: after, input: EMPTY_INPUT, done: !after.player.melodyPerformance }
}

function bashoFrame(state: FightState): Lot2Frame {
  if (state.player.bashoPoem?.ready) return { state, input: EMPTY_INPUT, done: true }
  if (state.player.bashoPoem?.writingFrames || state.player.attack || state.player.motion?.dash)
    return { state, input: EMPTY_INPUT, done: false }
  const after = performTrainingAction({ state, side: 'player', action: 'special' })
  return { state: after, input: EMPTY_INPUT, done: false }
}

function mortalState(state: FightState): FightState {
  const base = state.training?.settings.resources.player.infiniteHealth
    ? setTrainingResources(state, 'player', { infiniteHealth: false })
    : state
  return {
    ...base,
    formatId: 'knockout',
    training: base.training ? { ...base.training, readyFrames: 0 } : base.training,
  }
}

function fatalRiposteFrame(state: FightState, slot: MoveSlot, catsSeen: boolean): Lot2Frame {
  const mortal = mortalState(state)
  const seen = catsSeen || Boolean(mortal.catsName)
  if (seen && !mortal.catsName && mortal.player.health === mortal.player.maxHealth)
    return { state: mortal, input: EMPTY_INPUT, done: true, catsSeen: true }
  const zetsu = !seen && Boolean(mortal.opponent.attack)
  const holdZetsu: FightInput = { ...EMPTY_INPUT, aura: zetsu, down: zetsu }
  if (mortal.catsName || mortal.opponent.attack)
    return { state: mortal, input: holdZetsu, done: false, catsSeen: seen }
  const gap = Math.abs(mortal.opponent.x - mortal.player.x)
  if (gap > 6) {
    const toward = mortal.player.x < mortal.opponent.x ? -1 : 1
    return {
      state: { ...mortal, opponent: { ...mortal.opponent, x: mortal.opponent.x + toward * 3 } },
      input: holdZetsu,
      done: false,
      catsSeen: seen,
    }
  }
  const after = performTrainingAction({
    state: mortal,
    side: 'opponent',
    action: combatRouteAction(slot),
    input: combatRouteInput(slot, mortal.opponent.facing),
  })
  return { state: after, input: holdZetsu, done: false, catsSeen: seen }
}
