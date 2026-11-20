import { PREDATOR_ANALYSIS_FRAMES } from './predatorTuning'
import type { ArcadeFighter } from './types'

/**
 * Rihan's investigation sheet. Each line is filled only by something Rihan himself saw this
 * frame: no ally report, no witnessed-Hatsu flag, no input buffer, no hidden state. Behaviour
 * is the accumulated `observedFrames` of the analysis; the four other lines live here.
 */
export type PredatorFacet = 'trigger' | 'target' | 'range' | 'conditions' | 'behaviour'

export const PREDATOR_FACETS: readonly PredatorFacet[] = [
  'trigger',
  'target',
  'range',
  'conditions',
  'behaviour',
]

/** Spacing change (world units) over which the manifestation must be seen to hold. */
export const PREDATOR_RANGE_SPREAD = 6

export type OwnerPosture = 'neutral' | 'acting' | 'airborne' | 'guarding' | 'hurt'

/** Whose state the manifestation was seen surviving: its user's, or the investigator's own. */
export type PostureSample = `${'owner' | 'self'}:${OwnerPosture}`

export interface PredatorSheet {
  /** The onset itself was seen: the manifestation appeared under Rihan's eyes. */
  trigger: boolean
  /** Manifestation and its user were both in sight: who sends it, onto whom. */
  target: boolean
  /** Closest and farthest fighter spacing at which it was seen holding. */
  spacing: { min: number; max: number } | null
  /** Distinct fighter states it was seen surviving. */
  postures: readonly PostureSample[]
}

export interface SheetObservation {
  viewer: ArcadeFighter
  owner: ArcadeFighter
  /** The manifestation was not live on the previous watched frame. */
  onset: boolean
}

export function emptyPredatorSheet(): PredatorSheet {
  return { trigger: false, target: false, spacing: null, postures: [] }
}

/** Fixture for fully documented manifestations (tests and scripted presentations). */
export function completePredatorSheet(): PredatorSheet {
  return {
    trigger: true,
    target: true,
    spacing: { min: 0, max: PREDATOR_RANGE_SPREAD },
    postures: ['owner:neutral', 'self:neutral', 'owner:acting'],
  }
}

export function ownerPosture(owner: ArcadeFighter): OwnerPosture {
  if (owner.hitStun > 0 || owner.knockdownFrames > 0) return 'hurt'
  if (owner.attack) return 'acting'
  if (owner.y > 0) return 'airborne'
  if (owner.blocking) return 'guarding'
  return 'neutral'
}

function ownerInSight(viewer: ArcadeFighter, owner: ArcadeFighter): boolean {
  const dx = owner.x - viewer.x
  return Math.abs(dx) <= 80 && dx * viewer.facing >= -2
}

/** Adds one frame of personal sight of the manifestation to the sheet. */
export function observeSheet(sheet: PredatorSheet, seen: SheetObservation): PredatorSheet {
  const { viewer, owner } = seen
  const gap = Math.abs(owner.x - viewer.x)
  const samples: PostureSample[] = [`owner:${ownerPosture(owner)}`, `self:${ownerPosture(viewer)}`]
  return {
    trigger: sheet.trigger || seen.onset,
    target: sheet.target || ownerInSight(viewer, owner),
    spacing: sheet.spacing
      ? { min: Math.min(sheet.spacing.min, gap), max: Math.max(sheet.spacing.max, gap) }
      : { min: gap, max: gap },
    postures: [...new Set([...sheet.postures, ...samples])],
  }
}

export interface SheetProgress {
  sheet: PredatorSheet
  observedFrames: number
}

export function facetsFilled(progress: SheetProgress): readonly PredatorFacet[] {
  const { sheet } = progress
  const filled: Record<PredatorFacet, boolean> = {
    trigger: sheet.trigger,
    target: sheet.target,
    range: Boolean(sheet.spacing && sheet.spacing.max - sheet.spacing.min >= PREDATOR_RANGE_SPREAD),
    conditions: sheet.postures.length >= 3,
    behaviour: progress.observedFrames >= PREDATOR_ANALYSIS_FRAMES,
  }
  return PREDATOR_FACETS.filter((facet) => filled[facet])
}

export function sheetComplete(progress: SheetProgress): boolean {
  return facetsFilled(progress).length === PREDATOR_FACETS.length
}
