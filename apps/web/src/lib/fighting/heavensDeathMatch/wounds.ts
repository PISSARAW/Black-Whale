import { FIGHT_FPS } from '../fightClock'

/** Where a wound lands on Hisoka. */
export type WoundSite = 'left-hand' | 'right-hand' | 'right-leg' | 'face-neck' | 'torso'

/**
 * Hisoka's wounds, tracked one by one rather than as a health bar: they decide what his
 * gum can still do, and they stay after he is revived.
 */
export interface HisokaWounds {
  /** Fingers of the left hand destroyed, from 0 to 4 (the thumb is kept). */
  leftFingers: number
  /** The lower right leg is gone: he stands on one leg. */
  rightLowerLeg: boolean
  /** 0 untouched, 1 fully burnt. */
  burns: number
  /** 0 untouched, 1 the face and neck torn open. */
  faceNeck: number
  /** Blood lost per second. */
  bleeding: number
  /** 1 breathing freely, 0 no oxygen left. */
  oxygen: number
  /** Bodies pressing on him right now. */
  compression: number
  /** Frames since his heart stopped; null while alive. */
  deadFor: number | null
  cause: 'trauma' | 'asphyxia' | null
}

export const HEALTHY: HisokaWounds = {
  leftFingers: 0,
  rightLowerLeg: false,
  burns: 0,
  faceNeck: 0,
  bleeding: 0,
  oxygen: 1,
  compression: 0,
  deadFor: null,
  cause: null,
}

/** What remains of his grip with the left hand: the thumb alone holds little. */
export function grip(wounds: HisokaWounds): number {
  return 1 - wounds.leftFingers * 0.22
}

/** How precisely Bungee Gum lands: fingers and balance both count. */
export function gumPrecision(wounds: HisokaWounds): number {
  return Math.max(0.2, 1 - wounds.leftFingers * 0.12 - (wounds.rightLowerLeg ? 0.15 : 0))
}

/** How well he stands: one leg halves his footing. */
export function footing(wounds: HisokaWounds): number {
  return wounds.rightLowerLeg ? 0.5 : 1
}

export interface WoundingBlast {
  power: number
  distance: number
  site: WoundSite
}

/** A blast close enough to a part destroys it; the rest of him burns. */
export function woundByBlast(wounds: HisokaWounds, blast: WoundingBlast): HisokaWounds {
  if (blast.distance > 1.2 + blast.power * 0.6) return wounds
  const close = blast.distance <= 0.6
  const burns = Math.min(1, wounds.burns + 0.08 * blast.power)
  const next = { ...wounds, burns, bleeding: wounds.bleeding + (close ? 0.6 : 0.1) }
  if (close && blast.site === 'left-hand') return { ...next, leftFingers: 4 }
  if (close && blast.site === 'right-leg' && blast.power >= 2)
    return { ...next, rightLowerLeg: true, bleeding: next.bleeding + 1.2 }
  if (blast.site === 'face-neck') return { ...next, faceNeck: Math.min(1, next.faceNeck + 0.3) }
  return next
}

/** Bodies on top of him that stop his breath. */
export const SMOTHERING = 6
/** Bodies that cover him entirely: he is buried. */
export const BURIED = 8
const OXYGEN_LOSS = 1 / (40 * FIGHT_FPS)
const OXYGEN_GAIN = 1 / (8 * FIGHT_FPS)

/** One frame of breathing under `compression` bodies; no oxygen stops the heart. */
export function breathe(wounds: HisokaWounds, compression: number): HisokaWounds {
  if (wounds.deadFor !== null) return { ...wounds, compression, deadFor: wounds.deadFor + 1 }
  const smothered = compression >= SMOTHERING
  const oxygen = Math.max(
    0,
    Math.min(
      1,
      wounds.oxygen + (smothered ? -OXYGEN_LOSS * (compression / SMOTHERING) : OXYGEN_GAIN),
    ),
  )
  if (oxygen > 0) return { ...wounds, compression, oxygen }
  return { ...wounds, compression, oxygen, deadFor: 0, cause: 'asphyxia' }
}

/** Asphyxia leaves a viable body; trauma does not. A knock-out is neither. */
export function outcome(wounds: HisokaWounds): 'fighting' | 'asphyxia' | 'trauma' {
  return wounds.cause ?? 'fighting'
}

/** Revival restarts the heart and the lungs, never the lost hand or leg. */
export function revive(wounds: HisokaWounds): HisokaWounds {
  return { ...wounds, oxygen: 1, compression: 0, deadFor: null, cause: null }
}
