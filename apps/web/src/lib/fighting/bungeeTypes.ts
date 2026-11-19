import type { FightSide, FightProjectile } from './types'
import type { FightStageId } from './stages'
import type { GumSource } from './bungeeSource'

export const GUM_LIMBS = ['hand-right', 'hand-left', 'foot-right', 'foot-left'] as const
export type GumLimb = (typeof GUM_LIMBS)[number]
export type GumTarget =
  | { kind: 'fighter'; side: FightSide }
  | { kind: 'surface'; x: number; y: number; stage: FightStageId; surface: 'floor' | 'ceiling' }
  | { kind: 'entity'; id: string }
  | { kind: 'projectile'; id: number }

/** Limits and costs are duel tuning, not additional restrictions attributed to the manga. */
export const MAX_GUM_LINKS = 15
export const GUM_CAST_FRAMES = 18
export const GUM_ATTACH_COST = 12
export const GUM_RECALL_COST = 5

export interface GumLink extends GumSource {
  id: number
  owner: FightSide
  limb: GumLimb
  target: GumTarget
  hidden: boolean
  motion: 'idle' | 'recall' | 'rebound'
}
export interface GumNetwork {
  links: GumLink[]
  nextId: number
  selected: Partial<Record<FightSide, number>>
  limbs: Partial<Record<FightSide, GumLimb>>
  pending: Partial<
    Record<
      FightSide,
      GumSource & { target: GumTarget; limb: GumLimb; hidden: boolean; frames: number }
    >
  >
}
export interface GumFlight {
  mode: 'outbound' | 'returning' | 'resting' | 'held' | 'falling'
  struck: boolean
  clearBeforeHit?: boolean
  auraAge?: number
}

/** Compatibility projection for existing lessons, finishers and old replay snapshots. */
export interface BungeeGumAttachment {
  owner: FightSide
  target: FightSide
  hidden: boolean
  retracting: boolean
  rebounding?: boolean
}

declare module './types' {
  interface FightState {
    gumNetwork?: GumNetwork
  }
  interface ArcadeFighter {
    gumThrowReady?: GumSource & { limb: GumLimb; hidden: boolean }
  }
  interface FightProjectile {
    gumFlight?: GumFlight
    velocityY?: number
  }
}

export function fallingGumObject(shot: FightProjectile): FightProjectile {
  return {
    ...shot,
    gumFlight: { ...shot.gumFlight, mode: 'falling', struck: true },
    velocityY: 0,
    age: 0,
    lifetime: 120,
  }
}
