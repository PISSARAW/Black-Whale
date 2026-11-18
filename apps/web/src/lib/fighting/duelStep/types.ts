import type { AuraAttackOptions } from '../auraAttackAction'
import type { FightInput, FightState } from '../types'

/** Commands read during one simulated frame; no opponent input means the AI drives it. */
export interface DuelInputs {
  player: FightInput
  opponent?: FightInput
}

/** The engine's attack entry point, injected to keep these modules free of engine.ts. */
export type DuelAttack = (options: AuraAttackOptions) => FightState

/** `pending` ends the frame early: a verdict or a frozen world replaces the remaining phases. */
export interface DuelPhaseResult {
  state: FightState
  pending: boolean
}

/** Both bodies after their own step, before any contact between them is resolved. */
export type DuelBodies = Pick<FightState, 'player' | 'opponent'>
