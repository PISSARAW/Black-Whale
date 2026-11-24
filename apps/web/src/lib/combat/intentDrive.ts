import { resolveMovement, wallsNear } from '../tour/navigation'
import type { Vec2, WallSegment } from '../tour/types'
import { distance, MIN_SEPARATION } from './fighter'
import { lungeAdvance } from './locomotion'
import type { FighterState } from './types'

interface IntentDriveStep {
  fighter: FighterState
  rival: FighterState
  walls: WallSegment[]
  dt: number
}

/** Advances an authored Clash lunge during startup without crossing bodies or walls. */
export function advanceIntentDrive({ fighter, rival, walls, dt }: IntentDriveStep): FighterState {
  const intent = fighter.intent
  const drive = intent?.drive
  if (!drive || drive.applied === drive.total) return fighter
  const duration = Math.max(Number.EPSILON, drive.duration)
  const elapsed = Math.min(duration, duration - intent.remaining + dt)
  const applied = lungeAdvance(drive.total, elapsed / duration)
  const step = applied - drive.applied
  const proposed: Vec2 = [
    fighter.position[0] + drive.direction[0] * step,
    fighter.position[1] + drive.direction[1] * step,
  ]
  const position = resolveMovement(fighter.position, proposed, {
    walls: wallsNear(walls, fighter.position, Math.abs(step) + 1),
    radius: 0.45,
  })
  const separated = distance(position, rival.position) >= MIN_SEPARATION
  return {
    ...fighter,
    position: separated ? position : fighter.position,
    intent: { ...intent, drive: { ...drive, applied } },
  }
}
