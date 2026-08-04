import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import type { Space, Structure, Vec2 } from '$lib/tour/types'
import type { TourWorld } from '$lib/tour/hatsu'
import type { Ship } from '$lib/tour/blueprint'
import type { CastHand, NenHand } from '$lib/tour/pageCasting'

export type Pages = readonly [HatsuInteractionKind, HatsuInteractionKind] | null
export type Hands = Record<CastHand, NenHand>

export interface CastContext {
  world: TourWorld
  ship: Ship
  activeKind: HatsuInteractionKind | null
  pages: Pages
  hands: Hands
  currentSpace: Space | null
  aimedAt: Space | null
  aimedSolidAt: Structure | null
  position: Vec2
  heading: number
}

/**
 * What a cast without an explicit target aims at: whatever the reticle holds,
 * and failing that the space the body stands in.
 */
export const aimedTargetId = (context: CastContext): string | null =>
  context.aimedAt?.id ?? context.currentSpace?.id ?? null

export const aimedSolidId = (context: CastContext): string | null =>
  context.aimedSolidAt?.id ?? null

export const standingInId = (context: CastContext): string | null =>
  context.currentSpace?.id ?? null

/**
 * Judgment Chain is the only hatsu that needs its two rules spoken before the
 * cast resolves; every other kind is handed `undefined` and never asks.
 */
export const vowRulesFor = (
  kind: HatsuInteractionKind | null,
  subjectId: string | null,
  vowRules: (subjectId: string) => string[],
): string[] | undefined => (kind === 'heart-vow' ? vowRules(subjectId ?? 'self') : undefined)
