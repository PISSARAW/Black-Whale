import { packReplayInput } from './fightReplayInput'
import type { ReplayCommand } from './fightReplayTypes'
import type { SignatureStep } from './signatureCombos'
import { isMotionStep, motionStepDone, motionStepFrame } from './signatureMotionSteps'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

/**
 * Academy side of the non-striking steps (signatureSchool.ts): True Form, the Cyclotron's
 * wind-up and turns, jump and landing, and dashes from neutral (back dash, low dodge). They are
 * judged on the same simulated facts as signatureMotionSteps.ts.
 */
type Dash = Extract<SignatureStep, { dash: unknown }>

/** Whether this step is done on this frame; null for the steps signatureSchool.ts judges. */
export function motionLessonDone(step: SignatureStep, state: FightState): boolean | null {
  if ('trueForm' in step) return Boolean(state.player.biscuitTrueForm)
  if ('emperor' in step) return Boolean(state.player.kurapika?.emperorTime)
  if (isMotionStep(step)) return motionStepDone(state, step)
  if ('dash' in step && step.free) return freeDashing(state, step)
  return null
}

function freeDashing(state: FightState, step: Dash): boolean {
  const dash = state.player.motion?.dash
  if (!dash || dash.accel || (step.low && !state.player.crouching)) return false
  return (dash.direction === state.player.facing) === (step.dash !== 'back')
}

const SPECIAL: ReplayCommand = {
  kind: 'move',
  side: 'player',
  action: 'special',
  input: packReplayInput(EMPTY_INPUT),
}

/** Emperor Time, or the neutral special that reveals True Form or starts the wind-up, once. */
export function motionDemoCommand(step: SignatureStep, state: FightState): ReplayCommand | null {
  if ('emperor' in step)
    return capturing(state) && !state.player.kurapika?.emperorTime
      ? { kind: 'emperor', side: 'player' }
      : null
  if ('trueForm' in step) return state.player.biscuitTrueForm ? null : SPECIAL
  if ('wind' in step) return state.player.cyclotronWindup ? null : SPECIAL
  return null
}

/** Emperor Time waits for a confirmed capture or Chain Jail, as in signatureComboRunner.ts. */
function capturing(state: FightState): boolean {
  const attack = state.player.attack
  return Boolean(attack?.confirmedHit && /:(throw|neutralSpecial)$/.test(attack.moveId ?? ''))
}

/** Held inputs of a jump (and of a low dodge still running before it); null otherwise. */
export function motionDemoInput(step: SignatureStep, state: FightState): FightInput | null {
  return 'jump' in step ? motionStepFrame(state, step).input : null
}

/** A dash from neutral waits for a free body; an accélération for a confirmed hit. */
export function dashTapReady(step: Dash, state: FightState): boolean {
  if (step.free) return !state.player.attack && !state.player.motion?.dash
  return Boolean(state.player.attack?.confirmedHit) && state.hitstop === 0
}
