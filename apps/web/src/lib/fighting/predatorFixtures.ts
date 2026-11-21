import { performMove, tickFight } from './engine'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'

export interface PredatorInvestigation {
  state: FightState
  /** The investigator: Rihan, Skill Hunter's Rihan page, or Kurapika borrowing it. */
  side: FightSide
  /** Makes the studied Hatsu appear under the investigator's eyes (the trigger line). */
  manifest: (state: FightState) => FightState
  /** Upper bound of frames to run; the loop stops as soon as Predator leaves. */
  maxFrames?: number
  /** Starts the watch; defaults to the investigator's neutral special. */
  watch?: (state: FightState) => FightState
}

/**
 * Engine-driven investigation, never a fabricated sheet: the investigator starts watching,
 * the manifestation appears, its user then the investigator jump (conditions), the
 * investigator backs off (range), and the study runs until Predator is released on its own.
 */
export function investigatePredator(options: PredatorInvestigation): FightState {
  const { side } = options
  const watch = options.watch ?? ((s) => performMove({ state: s, side, action: 'special' }))
  let state = options.manifest(investigationStep(watch(options.state), side, 0))
  for (let n = 0; n < (options.maxFrames ?? 300) && !state[side].predator?.hunt; n++)
    state = investigationStep(state, side, n)
  return state
}

/** One scripted frame: back off for 20 frames, the user jumps at 1, the investigator at 30. */
export function investigationStep(state: FightState, side: FightSide, n: number): FightState {
  const forward: Partial<FightInput> = state[side].facing > 0 ? { left: n < 20 } : { right: n < 20 }
  const own = { ...EMPTY_INPUT, ...forward, jump: n === 30 }
  const owner = { ...EMPTY_INPUT, jump: n === 1 }
  return tickFight(state, side === 'player' ? own : owner, {
    dt: 1 / 60,
    opponentInput: side === 'player' ? owner : own,
    ai: false,
  })
}
