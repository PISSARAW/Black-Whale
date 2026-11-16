import { activeHitbox, hurtboxes, type FightBox } from './frameData'
import { interpolatedPosition } from './fightInterpolation'
import { perceivesProjectile } from './nenPerception'
import type { FightSide, FightState } from './types'

export interface FightCollisionBox {
  kind: 'hurt' | 'hit' | 'projectile'
  side: FightSide
  box: FightBox
}

/** The engine owns the bounds; the same interpolation as the body owns their drawn position. */
export function fightCollisionBoxes(state: FightState): FightCollisionBox[] {
  const boxes: FightCollisionBox[] = []
  for (const side of ['player', 'opponent'] as const) {
    const fighter = state[side]
    const drawn = interpolatedPosition(state, side)
    const dx = fighter.hanzoProjection ? 0 : drawn.x - fighter.x
    const dy = fighter.hanzoProjection ? 0 : drawn.y - fighter.y
    const shifted = (box: FightBox): FightBox => ({
      left: box.left + dx,
      right: box.right + dx,
      bottom: box.bottom + dy,
      top: box.top + dy,
    })
    for (const box of hurtboxes(fighter)) boxes.push({ kind: 'hurt', side, box: shifted(box) })
    const hit = activeHitbox(fighter)
    if (hit) boxes.push({ kind: 'hit', side, box: shifted(hit) })
  }
  for (const projectile of state.projectiles) {
    if (projectile.owner !== 'player' && !perceivesProjectile(state.player, projectile)) continue
    boxes.push({
      kind: 'projectile',
      side: projectile.owner,
      box: {
        left: projectile.x - projectile.width,
        right: projectile.x + projectile.width,
        bottom: projectile.y - projectile.height,
        top: projectile.y + projectile.height,
      },
    })
  }
  return boxes
}
