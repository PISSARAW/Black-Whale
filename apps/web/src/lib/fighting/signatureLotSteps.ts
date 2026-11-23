import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { crossGameRestrained } from './crossGame'
import { projectionPreparing } from './hanzoProjection'
import { performTrainingAction } from './trainingAction'
import { EMPTY_INPUT, type FightInput, type FightState, type MoveSlot } from './types'

/**
 * Additional non-strike steps for Lot 1 signature combos: Bonolenov's uninterrupted dances,
 * Hinrigh's living handcuffs capture, Mizaistom's Cross Game disobedience and Hanzo's astral
 * double movement. Every step uses real engine commands and respects canonical conditions.
 */
export type SignatureLotStep =
  | { dance: 'prologue' | 'jupiter' }
  | { biohazard: 'capture' }
  | { disobey: MoveSlot }
  | { astral: 'project' | 'cross' | 'descend' }

export interface LotStepFrame {
  state: FightState
  input: FightInput
  done: boolean
}

export function isLotStep(step: object): step is SignatureLotStep {
  return 'dance' in step || 'biohazard' in step || 'disobey' in step || 'astral' in step
}

export function lotStepFrame(state: FightState, step: SignatureLotStep): LotStepFrame {
  if ('dance' in step) return danceFrame(state, step.dance)
  if ('biohazard' in step) return biohazardFrame(state)
  if ('disobey' in step) return disobeyFrame(state, step.disobey)
  return astralFrame(state, step.astral)
}

function danceFrame(state: FightState, piece: 'prologue' | 'jupiter'): LotStepFrame {
  const ready =
    piece === 'prologue'
      ? Boolean(state.player.battleCantabile?.prologue)
      : state.projectiles.some((shot) => shot.owner === 'player' && shot.jupiter)
  if (ready) return { state, input: EMPTY_INPUT, done: true }
  if (state.player.battleCantabile?.preparation || state.player.attack || state.player.motion?.dash)
    return { state, input: EMPTY_INPUT, done: false }
  const action = piece === 'prologue' ? 'special' : 'finisher'
  const after = performTrainingAction({ state, side: 'player', action })
  return { state: after, input: EMPTY_INPUT, done: false }
}

function biohazardFrame(state: FightState): LotStepFrame {
  if (state.opponent.biohazardRestraint?.owner === 'player')
    return { state, input: EMPTY_INPUT, done: true }
  const active = state.player.biohazard?.objects.some((o) => o.phase !== 'carried')
  if (active || state.player.attack) return { state, input: EMPTY_INPUT, done: false }
  const after = performTrainingAction({ state, side: 'player', action: 'special' })
  return { state: after, input: EMPTY_INPUT, done: false }
}

function disobeyFrame(state: FightState, slot: MoveSlot): LotStepFrame {
  if (crossGameRestrained(state.opponent)) return { state, input: EMPTY_INPUT, done: true }
  const warning = state.opponent.crossGame
  if (warning?.phase !== 'warning' || warning.noticeFrames > 0)
    return { state, input: EMPTY_INPUT, done: false }
  const after = performTrainingAction({
    state,
    side: 'opponent',
    action: combatRouteAction(slot),
    input: combatRouteInput(slot, state.opponent.facing),
  })
  return { state: after, input: EMPTY_INPUT, done: crossGameRestrained(after.opponent) }
}

function astralFrame(
  state: FightState,
  phase: 'project' | 'cross' | 'descend',
): LotStepFrame {
  if (phase === 'project') return projectAstral(state)
  if (phase === 'descend') return descendAstral(state)
  return crossAstral(state)
}

function projectAstral(state: FightState): LotStepFrame {
  if (state.player.hanzoProjection)
    return { state, input: EMPTY_INPUT, done: !projectionPreparing(state.player) }
  if (state.player.attack || state.player.motion?.dash)
    return { state, input: EMPTY_INPUT, done: false }
  const after = performTrainingAction({ state, side: 'player', action: 'special' })
  return { state: after, input: EMPTY_INPUT, done: false }
}

function crossAstral(state: FightState): LotStepFrame {
  const projection = state.player.hanzoProjection
  if (!projection) return { state, input: EMPTY_INPUT, done: false }
  const bodySide = Math.sign(projection.bodyX - state.opponent.x) || -1
  const currentSide = Math.sign(state.player.x - state.opponent.x)
  const crossed = currentSide !== 0 && currentSide !== bodySide
  const past = Math.abs(state.player.x - state.opponent.x) >= 3
  if (crossed && past && state.player.y >= 3.5) return { state, input: EMPTY_INPUT, done: true }
  const dir = -bodySide
  return {
    state,
    input: {
      ...EMPTY_INPUT,
      jump: state.player.y < 5,
      right: dir > 0,
      left: dir < 0,
    },
    done: false,
  }
}

function descendAstral(state: FightState): LotStepFrame {
  if (state.player.y === 0) return { state, input: EMPTY_INPUT, done: true }
  return { state, input: { ...EMPTY_INPUT, down: true }, done: false }
}

/** True when a non-striking utility command mutated state without opening a player.attack. */
export function utilityCommandDone(before: FightState, after: FightState): boolean {
  return (
    after.opponent.needlePuppet?.order !== before.opponent.needlePuppet?.order ||
    after.opponent.crossGame?.phase !== before.opponent.crossGame?.phase ||
    after.player.lynchQuestion !== before.player.lynchQuestion
  )
}

/** Wait for an approaching needle puppet to walk into melee reach before striking it. */
export function waitingForPuppetApproach(state: FightState): boolean {
  const puppet = state.opponent.needlePuppet
  if (!puppet?.needleEmbedded || puppet.order !== 'approach') return false
  return Math.abs(state.opponent.x - state.player.x) > 9.5
}
