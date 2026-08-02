import { readAura, type AuraReading } from '../../combat/perception'
import type { CombatSide, CombatState, FighterState } from '../../combat/types'

export type ReplayPerspective = 'reality' | CombatSide

export interface FighterProjection {
  position: FighterState['position']
  condition: FighterState['condition']
  score: number
  aura: number | null
  mode: FighterState['mode'] | null
  reading: AuraReading | null
}

export interface ArenaFrameProjection {
  at: number
  perspective: ReplayPerspective
  player: FighterProjection
  opponent: FighterProjection
  outcome: CombatState['outcome']
  event: CombatState['lastEvent']
}

export function projectFrame(
  state: CombatState,
  perspective: ReplayPerspective,
): ArenaFrameProjection {
  if (perspective === 'reality') {
    return {
      at: state.clock,
      perspective,
      player: omniscient(state.player),
      opponent: omniscient(state.opponent),
      outcome: state.outcome,
      event: state.lastEvent,
    }
  }
  const observer = state[perspective]
  const targetSide = perspective === 'player' ? 'opponent' : 'player'
  return {
    at: state.clock,
    perspective,
    [perspective]: omniscient(observer),
    [targetSide]: subjective(observer, state[targetSide]),
    outcome: state.outcome,
    event: state.lastEvent,
  } as ArenaFrameProjection
}

function omniscient(fighter: FighterState): FighterProjection {
  return {
    position: fighter.position,
    condition: fighter.condition,
    score: fighter.score,
    aura: fighter.aura,
    mode: fighter.mode,
    reading: null,
  }
}

function subjective(observer: FighterState, target: FighterState): FighterProjection {
  const reading = readAura(observer, target)
  return {
    position: target.position,
    condition: target.condition,
    score: target.score,
    aura: observer.gyo ? target.aura : null,
    mode: reading.concealed ? null : target.mode,
    reading,
  }
}
