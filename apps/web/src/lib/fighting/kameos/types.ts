import type { ArcadeFighter, FightSide } from '../types'

/** Ship characters outside the playable forty, with a support Hatsu (KAMEOS.md). */
export type KameoId = 'tubeppa' | 'marayam' | 'zhanglei' | 'morena' | 'luzurus' | 'salesale'

/**
 * `reserve`: off stage, ready once the cooldown is spent. `entering` / `acting` /
 * `leaving`: on stage, a real target. `eliminated`: died, out for the whole match.
 */
export type KameoPhase = 'reserve' | 'entering' | 'acting' | 'leaving' | 'eliminated'

/** Call chosen with the call button plus a direction, relative to the leader's facing. */
export type KameoCallId = 'neutral' | 'forward' | 'back'

/** A materialized trap left on the floor; it outlives the kameo's stay on stage. */
export interface KameoTrap {
  x: number
  remainingFrames: number
}

export interface KameoSlot {
  /** A real body on stage: it can be struck and can die. Never shared with the leader. */
  fighter: ArcadeFighter
  phase: KameoPhase
  call: KameoCallId | null
  /** Frames before the next call is allowed; 0 means ready. */
  cooldownFrames: number
  /** Frames spent in the current phase. */
  phaseFrames: number
  trap?: KameoTrap
}

export type FightKameos = Partial<Record<FightSide, KameoSlot>>
