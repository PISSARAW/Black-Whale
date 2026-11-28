import type { CombatState, FighterState } from '../combat/types'
import { pointInPolygon } from '../tour/geometry'
import { resolveMovement, wallsNear } from '../tour/navigation'
import type { Vec2 } from '../tour/types'
import { distance } from './sceneGeometry'

const RUSH_SPEED = 18
export const RUSH_STOP_DISTANCE = 1.55
export const RUSH_DURATION = 1.4

export function arenaFootworkAvailable(fighter: FighterState): boolean {
  return fighter.condition === 'ready' && fighter.bound <= 0 && !fighter.intent && !fighter.jump
}

/** Advance on the ground using the same collision geometry as the duel. */
export function arenaRushStep(state: CombatState, dt: number): Vec2 | null {
  if (state.hitstop > 0 || !arenaFootworkAvailable(state.player)) return null
  const from = state.player.position
  const target = state.opponent.position
  const gap = distance(from, target)
  const advance = Math.min(gap - RUSH_STOP_DISTANCE, RUSH_SPEED * dt)
  if (advance <= 0.001) return null
  const goal: Vec2 = [
    from[0] + (target[0] - from[0]) * (advance / gap),
    from[1] + (target[1] - from[1]) * (advance / gap),
  ]
  const position = resolveMovement(from, goal, {
    walls: wallsNear(state.terrain.walls, from, advance + 1),
    radius: 0.45,
  })
  if (
    !pointInPolygon(position, state.terrain.footprint) ||
    distance(position, target) >= gap - 0.001
  )
    return null
  return position
}
