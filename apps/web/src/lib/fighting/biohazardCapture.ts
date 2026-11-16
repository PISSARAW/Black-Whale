import { BIOHAZARD_CAPTURE, BIOHAZARD_GRACE, type BiohazardObject } from './biohazard'
import { boxesOverlap, hurtboxes, type FightBox } from './frameData'
import { sleepingBody, wakeHanzoBody } from './hanzoProjection'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function biohazardBox(object: BiohazardObject): FightBox {
  return { left: object.x - 1.3, right: object.x + 1.3, bottom: object.y - 1, top: object.y + 1 }
}

/** A visible, physical grab: guard, airborne evasion and wake-up protection defeat it. */
export function pigeonCanCapture(target: ArcadeFighter, object: BiohazardObject): boolean {
  const body = sleepingBody(target)
  if (!captureBodyAvailable(target) || body.y > 0) return false
  return hurtboxes(body).some((box) => boxesOverlap(biohazardBox(object), box))
}

function captureBodyAvailable(target: ArcadeFighter): boolean {
  return (
    target.health > 0 &&
    !target.blocking &&
    !target.biohazardRestraint &&
    (target.biohazardGraceFrames ?? 0) === 0 &&
    target.wakeupInvulnerableFrames === 0 &&
    target.knockdownFrames === 0 &&
    target.hitStun === 0 &&
    target.blockStun === 0
  )
}

export function bindBiohazard(
  state: FightState,
  owner: FightSide,
  object: BiohazardObject,
): FightState {
  const side = owner === 'player' ? 'opponent' : 'player'
  const fighter = wakeHanzoBody(state[side])
  return {
    ...state,
    [side]: {
      ...fighter,
      attack: null,
      bufferedAttack: null,
      blocking: false,
      guardFrames: 0,
      velocityY: 0,
      motion: undefined,
      pose: 'hit',
      biohazardRestraint: {
        owner,
        objectId: object.id,
        frames: BIOHAZARD_CAPTURE,
        healthAtCapture: fighter.health,
        x: fighter.x,
      },
    },
  }
}

/** A damaging follow-up opens the restraint; two pigeons cannot extend it into a loop. */
export function tickBiohazardRestraint(fighter: ArcadeFighter): ArcadeFighter {
  const grace = Math.max(0, (fighter.biohazardGraceFrames ?? 0) - 1)
  const restraint = fighter.biohazardRestraint
  if (!restraint) return { ...fighter, biohazardGraceFrames: grace }
  const broken = fighter.health < restraint.healthAtCapture || fighter.health <= 0
  if (broken || restraint.frames <= 1)
    return { ...fighter, biohazardRestraint: undefined, biohazardGraceFrames: BIOHAZARD_GRACE }
  return {
    ...fighter,
    x: restraint.x,
    motion: undefined,
    velocityY: 0,
    blocking: false,
    pose: 'hit',
    attack: null,
    bufferedAttack: null,
    guardFrames: 0,
    biohazardRestraint: { ...restraint, frames: restraint.frames - 1 },
  }
}
