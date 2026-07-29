import { BEYOND_CURSE_REVEAL_CHAPTER } from '@black-whale/ability-modules'

/**
 * Who descends from Beyond, and when the reader is allowed to know it.
 *
 * The catalogue records two very different claims under one field. `confirmed`
 * is a birthmark the manga shows — Furykov carries it and says so. `suspected`
 * is Longhi's hypothesis that one of the fourteen princes was fathered by
 * Beyond: an open investigation, not a fact, so the filter never presents the
 * two as the same thing.
 *
 * Both are spoilers, and they land in different chapters. Gating happens on the
 * server, where the catalogue is read: a reader capped below the reveal must not
 * receive the field at all, because a filter that merely hides the chip still
 * ships the answer in the page payload.
 */
export type BeyondLineageStatus = 'confirmed' | 'suspected'

export interface BeyondLineage {
  status: BeyondLineageStatus
  revealedInChapterId: string
  evidence: string
}

/** The birthmarks become readable — and lethal — in the reveal chapter. */
export const BEYOND_LINEAGE_CONFIRMED_CHAPTER = BEYOND_CURSE_REVEAL_CHAPTER
/** Longhi puts the paternity hypothesis to Kurapika alongside the Moonlight Act. */
export const BEYOND_LINEAGE_SUSPECTED_CHAPTER = 401

export function lineageRevealChapter(status: BeyondLineageStatus): number {
  return status === 'confirmed'
    ? BEYOND_LINEAGE_CONFIRMED_CHAPTER
    : BEYOND_LINEAGE_SUSPECTED_CHAPTER
}

/** An unset cap means the reader has opted out of spoiler protection entirely. */
export function isLineageVisible(lineage: BeyondLineage, spoilerLimit?: number): boolean {
  if (spoilerLimit === undefined) return true
  return lineageRevealChapter(lineage.status) <= spoilerLimit
}

/** The lineage a reader may see, or undefined — never a censored placeholder. */
export function visibleLineage(
  lineage: BeyondLineage | null | undefined,
  spoilerLimit?: number,
): BeyondLineage | undefined {
  if (!lineage) return undefined
  return isLineageVisible(lineage, spoilerLimit) ? lineage : undefined
}
