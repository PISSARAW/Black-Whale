import { fineControlEase } from './fineControlAnchors'
import { hasPlantedPaper, paperAvailable, paperZonePoint } from './kallutoPaper'
import type { FightProjectile, FightState } from './types'

export const PAPER_STREAM_PIECES = 48
export const PAPER_SCATTER_PIECES = 6

/** Pure, replay-stable ribbon around the live projectile, with its tip on the real hitbox.
 * The helix is presentation only: every fragment belongs to one existing physical shot.
 */
export function paperRibbonFragment(options: {
  shot: FightProjectile
  index: number
  reduced: boolean
  direction: { x: number; y: number }
}) {
  const { shot, index, reduced, direction } = options
  const serpent = shot.kallutoPaper === 'serpent'
  const count = serpent ? PAPER_STREAM_PIECES : PAPER_SCATTER_PIECES
  const t = index / (count - 1)
  const gather = fineControlEase(shot.age / 12)
  const phase = (reduced ? 0 : shot.age * 0.16) - t * Math.PI * 5
  const length = t * (serpent ? 1.25 : 0.32) * (0.3 + gather * 0.7)
  const radius = serpent ? Math.sin(t * Math.PI * 0.8) * 0.16 : t * 0.12
  const wave = Math.sin(phase) * radius
  return {
    x: -direction.x * length - direction.y * wave,
    y: -direction.y * length + direction.x * wave,
    z: Math.cos(phase) * radius * 0.6,
    rotation: Math.atan2(direction.y, direction.x) + phase,
    scale: serpent ? 0.75 + Math.sin(t * Math.PI) * 0.5 : 0.65,
  }
}

/** Follow a marked zone only while its owner can actually steer the paper. */
export function paperRibbonDirection(state: FightState, shot: FightProjectile) {
  const straight = { x: Math.sign(shot.velocityX) || state[shot.owner].facing, y: 0 }
  if (shot.kallutoPaper !== 'serpent' || !paperAvailable(state[shot.owner])) return straight
  if (!hasPlantedPaper(state, shot.owner, shot.targetZone)) return straight
  const target = shot.owner === 'player' ? state.opponent : state.player
  const point = paperZonePoint(target, shot.targetZone)
  const dx = point.x - shot.x
  const dy = point.y - shot.y
  const length = Math.hypot(dx, dy)
  return length > 0.001 ? { x: dx / length, y: dy / length } : straight
}
