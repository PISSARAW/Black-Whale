import { FIXED_STEP } from './fightClock'
import { boxesOverlap, hurtboxes } from './frameData'
import { advanceAirborne, motionOf, steerFighter } from './fighterMovement'
import { canMove, playerCanJump } from './fightActorState'
import { EMPTY_INPUT, type ArcadeFighter, type FightInput, type FightProjectile } from './types'

export const PROJECTILE_LOOKAHEAD = 72
export interface ProjectileThreat {
  shot: FightProjectile
  impactFrames: number
}

/** Reuse the real three-frame prejump, locked jump arc, walk speed and hurtboxes. */
export function forecastProjectileBody(fighter: ArcadeFighter, input: FightInput): ArcadeFighter[] {
  if (stationaryPosture(fighter, input))
    return Array(PROJECTILE_LOOKAHEAD).fill({
      ...fighter,
      crouching: input.down,
      blocking: input.guard,
    })
  let body = fighter
  let launched = fighter.y > 0
  const path: ArcadeFighter[] = []
  for (let frame = 0; frame < PROJECTILE_LOOKAHEAD; frame++) {
    if (frame > 0) body = { ...body, ...advanceAirborne(body) }
    const command = { ...input, jump: input.jump && !launched }
    const prepared = {
      ...body,
      blocking: command.guard && body.y === 0,
      crouching: input.down && body.y === 0,
    }
    body = steerFighter(prepared, {
      input: command,
      mobile: canMove(prepared),
      jumpable: playerCanJump(prepared, command),
    })
    if (body.velocityY > 0) launched = true
    path.push(body)
  }
  return path
}

function stationaryPosture(fighter: ArcadeFighter, input: FightInput): boolean {
  const motion = motionOf(fighter)
  return (
    fighter.y === 0 &&
    !motion.prejumpFrames &&
    !motion.dash &&
    !input.jump &&
    !input.left &&
    !input.right
  )
}

function projectileAt(shot: FightProjectile, frame: number) {
  const before = shot.x + shot.velocityX * FIXED_STEP * (frame - 1)
  const after = shot.x + shot.velocityX * FIXED_STEP * frame
  return {
    left: Math.min(before, after) - shot.width,
    right: Math.max(before, after) + shot.width,
    bottom: shot.y - shot.height,
    top: shot.y + shot.height,
  }
}

export function projectedImpact(
  shot: FightProjectile,
  path: readonly ArcadeFighter[],
): number | null {
  if (path.length > 0 && path[0] === path[path.length - 1])
    return stationaryImpact(shot, path[0], path.length)
  for (let i = 0; i < path.length && shot.age + i <= shot.lifetime; i++) {
    const box = projectileAt(shot, i + 1)
    if (hurtboxes(path[i]).some((hurt) => boxesOverlap(box, hurt))) return i + 1
  }
  return null
}

/** Exact swept entry time for a stationary posture; volleys need no repeated body simulation. */
function stationaryImpact(
  shot: FightProjectile,
  fighter: ArcadeFighter,
  frames: number,
): number | null {
  const speed = shot.velocityX * FIXED_STEP
  let first = Infinity
  for (const box of hurtboxes(fighter)) {
    if (shot.y + shot.height < box.bottom || shot.y - shot.height > box.top) continue
    if (speed === 0) {
      if (shot.x + shot.width >= box.left && shot.x - shot.width <= box.right) first = 1
      continue
    }
    const left = (box.left - shot.width - shot.x) / speed
    const right = (box.right + shot.width - shot.x) / speed
    const entry = Math.max(1, Math.ceil(Math.min(left, right)))
    if (Math.max(left, right) >= 0 && entry <= Math.min(frames, shot.lifetime - shot.age + 1))
      first = Math.min(first, entry)
  }
  return Number.isFinite(first) ? first : null
}

/** Rank by collision time with the moving body, rather than distance to the muzzle. */
export function rankProjectileThreats(
  fighter: ArcadeFighter,
  shots: readonly FightProjectile[],
): ProjectileThreat[] {
  if (shots.length === 0) return []
  const direction = motionOf(fighter).heldDirection
  const path = forecastProjectileBody(
    { ...fighter, crouching: false },
    {
      ...EMPTY_INPUT,
      left: direction < 0,
      right: direction > 0,
      guard: fighter.blocking,
    },
  )
  return shots
    .flatMap((shot) => {
      const impactFrames = projectedImpact(shot, path)
      return impactFrames === null ? [] : [{ shot, impactFrames }]
    })
    .sort((a, b) => a.impactFrames - b.impactFrames || a.shot.id - b.shot.id)
}

/** Homing, rising and returning manifestations are reconsidered as they move. */
export function predictableProjectile(shot: FightProjectile): boolean {
  return !shot.jupiter && !shot.remotePunch && !shot.kallutoPaper && !shot.gumFlight
}
