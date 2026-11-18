import { throwPerformanceFor } from './catalogue'
import type { FightSide, FightState } from '../types'
import type { ThrowCinematicFrame } from '../throwCinematic'

/** Equipment is borrowed only by the rendering layer, never conjured by a grab. */
export function selectThrowPerformance(
  state: FightState,
  attacker: FightSide,
): Pick<ThrowCinematicFrame, 'powered' | 'performance'> {
  const actor = state[attacker]
  const powered = Boolean(actor.attack?.superThrow)
  return { powered, performance: throwPerformanceFor(actor.id, powered)?.id }
}
