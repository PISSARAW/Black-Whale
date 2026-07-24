import type { Character, Body, Consciousness, AuraIdentity } from '@black-whale/domain'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

/** All possible "tracking" modes for following an entity */
export type TrackingMode = 'consciousness' | 'body' | 'aura' | 'apparent'

export interface IdentityResolutionResult {
  characterId: string
  body: Body
  consciousness: Consciousness
  aura: AuraIdentity
  /** Which character witnesses believe this to be */
  perceivedAs: string
  isDissonant: boolean
}

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

export interface IIdentityEngine {
  /**
   * Given a body ID at a specific event, resolve the full identity stack:
   * who is in this body, what aura is emitted, what witnesses believe.
   */
  resolveIdentity(bodyId: string, eventId: string): Promise<IdentityResolutionResult>

  /**
   * Find the body currently occupied by a consciousness at a given event.
   */
  findBodyOf(consciousnessId: string, eventId: string): Promise<Body | null>

  /**
   * Track an entity by different modes (follow the consciousness vs the body).
   */
  track(entityId: string, mode: TrackingMode, eventId: string): Promise<IdentityResolutionResult>
}

// ──────────────────────────────────────────────
// Stub implementation
// ──────────────────────────────────────────────

export class IdentityEngine implements IIdentityEngine {
  async resolveIdentity(bodyId: string, eventId: string): Promise<IdentityResolutionResult> {
    throw new Error(`IdentityEngine.resolveIdentity not implemented — bodyId: ${bodyId}, eventId: ${eventId}`)
  }

  async findBodyOf(consciousnessId: string, eventId: string): Promise<Body | null> {
    throw new Error(`IdentityEngine.findBodyOf not implemented — consciousnessId: ${consciousnessId}, eventId: ${eventId}`)
  }

  async track(entityId: string, mode: TrackingMode, eventId: string): Promise<IdentityResolutionResult> {
    throw new Error(`IdentityEngine.track not implemented — entityId: ${entityId}, mode: ${mode}, eventId: ${eventId}`)
  }
}
