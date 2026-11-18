import type {
  ArcadeFighter,
  AttackKind,
  AttackVariant,
  FightInput,
  FightSide,
  FightState,
} from './types'

export const FUTURE_WINDOW_FRAMES = 600
/** Duel tuning for completing Zetsu, not ten seconds spent vulnerable in real time. */
export const FUTURE_PREPARATION_FRAMES = 30

export interface FutureControls {
  player: FightInput
  opponent?: FightInput
  ai: boolean
}

export interface FutureCommand {
  arsenal?: import('./retrospectiveTypes').ArsenalCommand
  rngBefore?: number
  kind: AttackKind
  variant?: AttackVariant
  moveId?: string
  auraCharged: boolean
}

export interface FutureFrame {
  /** Presentation snapshot only; the real branch never consumes these fields. */
  scene?: Pick<
    FightState,
    | 'rosterGuests'
    | 'bungeeGum'
    | 'gumNetwork'
    | 'catsName'
    | 'catsNameConsumed'
    | 'moonlight'
    | 'lsdf'
    | 'expulsion'
    | 'score'
    | 'knockdowns'
    | 'winner'
    | 'finishReason'
    | 'hitstop'
  >
  arena?: FightState['arena']
  voconteDoors?: FightState['voconteDoors']
  battlefield?: FightState['battlefield']
  player: ArcadeFighter
  opponent: ArcadeFighter
  projectiles: FightState['projectiles']
  impact: FightState['impact']
  phase: FightState['phase']
  time: number
  rng: number
  aiCooldown?: number
  command: FutureCommand | null
}

export interface ParallelFutureState {
  owner: FightSide
  sourceMoveId?: string
  phase: 'preparing' | 'vision' | 'diverging'
  preparation: number
  cursor: number
  previewCursor: number
  frames: readonly FutureFrame[]
  controls: FutureControls | null
  /** Only the engine may dispatch the opponent's already predicted commands. */
  replaying?: boolean
}

export type SimulateFutureFrame = (state: FightState, controls: FutureControls) => FightState
export type ReplayFutureCommand = (state: FightState, command: FutureCommand) => FightState
