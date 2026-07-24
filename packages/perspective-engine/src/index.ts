import type { Character, Fact, FactKnowledge } from '@black-whale/domain'
import type { WorldSnapshot } from '@black-whale/timeline-engine'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type PerspectiveMode = 'character' | 'omniscient' | 'body' | 'aura' | 'apparent'

export interface PerspectiveInput {
  observerId: string
  worldState: WorldSnapshot
  pointInTime: { eventId: string }
  mode?: PerspectiveMode
}

export interface PerspectiveResult {
  observerId: string
  eventId: string
  mode: PerspectiveMode
  visibleCharacters: Character[]
  believedPositions: Record<string, string>
  hiddenAbilities: string[]
  suspectedThreats: string[]
  /** Facts the observer believes to be true but are actually false */
  falseInformation: Fact[]
  knownDeaths: string[]
  knowledgeItems: FactKnowledge[]
}

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

export interface IPerspectiveEngine {
  /**
   * Build a filtered view of the world as seen from a specific character.
   *
   * Processing chain:
   *   Canonical reality
   *   → Active Nen effects
   *   → Physical perception
   *   → Character knowledge
   *   → Beliefs and false information
   *   → Displayed interface
   */
  buildPerspective(input: PerspectiveInput): Promise<PerspectiveResult>

  /**
   * Compare two perspectives and highlight divergences.
   */
  comparePerspectives(
    left: PerspectiveResult,
    right: PerspectiveResult,
  ): Promise<{
    divergingFacts: Fact[]
    divergingPositions: Record<string, { left?: string; right?: string }>
  }>
}

// ──────────────────────────────────────────────
// Stub
// ──────────────────────────────────────────────

export class PerspectiveEngine implements IPerspectiveEngine {
  async buildPerspective(input: PerspectiveInput): Promise<PerspectiveResult> {
    throw new Error(`PerspectiveEngine.buildPerspective not implemented — observerId: ${input.observerId}`)
  }

  async comparePerspectives(left: PerspectiveResult, right: PerspectiveResult): Promise<{
    divergingFacts: Fact[]
    divergingPositions: Record<string, { left?: string; right?: string }>
  }> {
    throw new Error(`PerspectiveEngine.comparePerspectives not implemented — ${left.observerId} vs ${right.observerId}`)
  }
}
