import type { ArcadeFighter, FightSide } from '../types'

/**
 * `reserve`: off stage, ready once the cooldown is spent. `entering` / `acting` /
 * `leaving`: on stage, a real target. `eliminated`: died, out for the whole match.
 */
export type KameoPhase = 'reserve' | 'entering' | 'acting' | 'leaving' | 'eliminated'

/** Call chosen with the call button plus a direction, relative to the leader's facing. */
export type KameoCallId = 'neutral' | 'forward' | 'back'

export interface KameoSlot {
  /** A complete body: its own health, aura, Nen and Hatsu. Never shared with the leader. */
  fighter: ArcadeFighter
  phase: KameoPhase
  call: KameoCallId | null
  /** Frames before the next call is allowed; 0 means ready. */
  cooldownFrames: number
  /** Frames spent in the current phase. */
  phaseFrames: number
}

export type FightKameos = Partial<Record<FightSide, KameoSlot>>
