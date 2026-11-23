import { performTrainingAction } from './trainingAction'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

/**
 * Movement steps of a signature combo (Dix tours, un poing): start the Cyclotron, jump, land,
 * finish a turn. Each is entered through ordinary commands or held directions and is done only
 * once the simulation really shows it. Shared by the runner and the Academy.
 */
export type SignatureMotionStep =
  /** Start winding Ripper Cyclotron (neutral special). */
  | { wind: true }
  /** Jump forward from the ground. */
  | { jump: 'forward' }
  /** Wait for the landing that follows a jump. */
  | { land: true }
  /** Wait until the turn in progress completes. */
  | { turn: true }

export interface MotionFrame {
  state: FightState
  input: FightInput
  done: boolean
}

export function isMotionStep(step: object): step is SignatureMotionStep {
  return 'wind' in step || 'jump' in step || 'land' in step || 'turn' in step
}

export function motionStepFrame(state: FightState, step: SignatureMotionStep): MotionFrame {
  if ('wind' in step) return wind(state)
  if ('jump' in step) return jump(state)
  if ('land' in step) return { state, input: EMPTY_INPUT, done: state.player.y === 0 }
  return { state, input: EMPTY_INPUT, done: motionStepDone(state, step) }
}

/** Whether the simulation shows this step as done: the Academy observes the same facts. */
export function motionStepDone(state: FightState, step: SignatureMotionStep): boolean {
  const player = state.player
  if ('wind' in step) return Boolean(player.cyclotronWindup)
  if ('jump' in step) return player.y > 0
  if ('land' in step) return player.y === 0
  return player.cyclotronWindup?.frame === 0
}

function wind(state: FightState): MotionFrame {
  const after = performTrainingAction({ state, side: 'player', action: 'special' })
  const started = Boolean(after.player.cyclotronWindup) && !state.player.cyclotronWindup
  return { state: started ? after : state, input: EMPTY_INPUT, done: started }
}

/** Held jump and forward until the body leaves the ground; waits for a running dash to end. */
function jump(state: FightState): MotionFrame {
  if (state.player.y > 0) return { state, input: EMPTY_INPUT, done: true }
  // A low dodge stays crouched until it ends.
  const down = state.player.crouching ?? false
  if (state.player.motion?.dash) return { state, input: { ...EMPTY_INPUT, down }, done: false }
  return { state, input: jumpInput(state), done: false }
}

export function jumpInput(state: FightState): FightInput {
  const forward = state.player.facing
  return { ...EMPTY_INPUT, jump: true, right: forward === 1, left: forward === -1 }
}
