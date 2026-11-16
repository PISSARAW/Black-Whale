import { performParallelFutureAction } from './parallelFutureAbility'
import type { ArcadeFighter, FightState } from './types'

export function parallelFutureAiAction(state: FightState): FightState | null {
  if (state.opponent.id !== 'tserriednich' || state.forecastSimulation) return null
  if (state.parallelFuture?.owner === 'opponent') {
    return state.parallelFuture.phase === 'diverging' ? null : state
  }
  if (state.parallelFuture || Math.abs(state.player.x - state.opponent.x) < 24) return null
  return performParallelFutureAction({
    state,
    side: 'opponent',
    kind: 'special',
    auraCharged: false,
  })
}

/** The prince may anticipate a predicted hit, but must physically move to avoid it. */
export function steerFutureAi(state: FightState, fighter: ArcadeFighter): ArcadeFighter | null {
  const future = state.parallelFuture
  if (future?.owner !== 'opponent' || future.phase !== 'diverging') return null
  if (fighter.attack || fighter.hitStun > 0 || fighter.knockdownFrames > 0) return null
  const current = future.frames[future.cursor].opponent.health
  const danger = future.frames
    .slice(future.cursor, future.cursor + 60)
    .some((frame) => frame.opponent.health < current)
  if (!danger) return null
  const direction = fighter.x < state.player.x ? -1 : 1
  return {
    ...fighter,
    x: Math.max(7, Math.min(93, fighter.x + direction * 0.3)),
    blocking: false,
    pose: 'walk',
  }
}
