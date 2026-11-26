import type { MoveTuning } from './movesetTypes'
import type { ArcadeFighter } from './types'

export interface FollowUpPhysicsSpec {
  /** Override partial frame / hitbox / knockback tuning for this contextual follow-up. */
  tuning?: Partial<MoveTuning>
  /** Upward launch velocity imparted to the opponent on a clean hit (launcher). */
  launchVelocityY?: number
  /** Upward hop velocity imparted to the attacker on start (aerial pursuit / leap). */
  selfLiftVelocityY?: number
  /** Allows the attacker to slip past pushboxes while active, without any invulnerability. */
  crossesPushbox?: true
  /** Overrides guard requirement (e.g. low strike on shadowless blade). */
  guard?: 'mid' | 'low' | 'overhead' | 'throw'
}

/**
 * Physical tuning for contextual MoveFollowUp variants of the five priority fighters.
 * Purely martial / kinetic parameters — no invented Hatsu, no invulnerability, no teleport.
 */
export const FOLLOW_UP_PHYSICS: Readonly<Record<string, FollowUpPhysicsSpec>> = {
  // Signature-route launchers. These are ordinary authored strikes, so their
  // launch is keyed by the same move id used by the combat simulation.
  'saiyu:forwardHeavy': {
    launchVelocityY: 34,
  },
  'bonolenov:standingHeavy': {
    launchVelocityY: 32,
  },

  // Feitan — traversées et ascension aérienne
  'feitan:pain-stairway': {
    launchVelocityY: 42,
    selfLiftVelocityY: 22,
    tuning: {
      startup: 7,
      active: 4,
      recovery: 14,
      damage: 11,
      hitstun: 26,
      knockback: 2.2,
      lunge: 2.0,
      reach: 12.5,
      bottom: 2,
      top: 15,
    },
  },
  'feitan:execution-rain': {
    selfLiftVelocityY: 14,
    guard: 'overhead',
    tuning: {
      startup: 6,
      active: 4,
      recovery: 13,
      damage: 12,
      hitstun: 22,
      knockback: 4.2,
      lunge: 2.4,
      reach: 11.5,
      bottom: -4,
      top: 10,
    },
  },
  'feitan:shadowless-blade': {
    crossesPushbox: true,
    guard: 'low',
    tuning: {
      startup: 6,
      active: 3,
      recovery: 12,
      damage: 10,
      hitstun: 20,
      knockback: 1.4,
      lunge: 3.4,
      reach: 10.5,
      bottom: 0,
      top: 5,
      targetZone: 'feet',
    },
  },

  // Machi — positionnement millimétrique
  'machi:seam-cross': {
    tuning: {
      startup: 8,
      active: 4,
      recovery: 15,
      damage: 12,
      hitstun: 22,
      knockback: 1.2,
      lunge: 1.6,
      reach: 14,
    },
  },
  'machi:broken-puppet': {
    tuning: {
      startup: 7,
      active: 3,
      recovery: 12,
      damage: 8,
      hitstun: 18,
      blockstun: 10,
      knockback: 2.8,
      lunge: -1.4,
      reach: 12.5,
    },
  },

  // Hisoka — physique imprévisible
  'hisoka:deadly-trapeze': {
    selfLiftVelocityY: 26,
    guard: 'overhead',
    tuning: {
      startup: 8,
      active: 4,
      recovery: 14,
      damage: 13,
      hitstun: 22,
      knockback: 3.6,
      lunge: 2.8,
      reach: 13,
      bottom: -4,
      top: 11,
    },
  },
  'hisoka:elastic-embrace': {
    tuning: {
      startup: 7,
      active: 3,
      recovery: 18,
      damage: 13,
      hitstun: 24,
      knockback: 1.8,
      lunge: 1.8,
      reach: 11,
    },
  },

  // Kalluto — érosion distante et spirale ascendante
  'kalluto:ascending-serpent': {
    launchVelocityY: 36,
    selfLiftVelocityY: 16,
    tuning: {
      startup: 7,
      active: 4,
      recovery: 14,
      damage: 10,
      hitstun: 24,
      knockback: 2.4,
      lunge: 1.8,
      reach: 14.5,
      bottom: 1,
      top: 15,
    },
  },
  'kalluto:hundred-scale-bite': {
    tuning: {
      startup: 8,
      active: 4,
      recovery: 16,
      damage: 12,
      hitstun: 22,
      knockback: 3.8,
      lunge: 1.4,
      reach: 15,
    },
  },

  // Saiyu — changements permanents d'axe
  'saiyu:pilgrim-leap': {
    selfLiftVelocityY: 28,
    crossesPushbox: true,
    guard: 'overhead',
    tuning: {
      startup: 8,
      active: 4,
      recovery: 14,
      damage: 12,
      hitstun: 22,
      knockback: 3.2,
      lunge: 3.2,
      reach: 13.5,
      bottom: -3,
      top: 12,
    },
  },
  'saiyu:three-monkeys-cage': {
    tuning: {
      startup: 7,
      active: 4,
      recovery: 16,
      damage: 12,
      hitstun: 24,
      knockback: 2.6,
      lunge: 1.8,
      reach: 14,
    },
  },
}

export function followUpPhysicsFor(moveId?: string): FollowUpPhysicsSpec | undefined {
  return moveId ? FOLLOW_UP_PHYSICS[moveId] : undefined
}

export function followUpLaunchVelocity(attacker: ArcadeFighter): number | undefined {
  return followUpPhysicsFor(attacker.attack?.moveId)?.launchVelocityY
}

export function followUpCrossesPushbox(fighter: ArcadeFighter): boolean {
  return Boolean(followUpPhysicsFor(fighter.attack?.moveId)?.crossesPushbox)
}
