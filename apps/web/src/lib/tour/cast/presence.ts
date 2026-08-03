/**
 * When somebody is in the walk at all, and how the walk says so.
 *
 * The bounds themselves are not decided here: the world state the server reads
 * is already capped at the reader's spoiler limit, already stops at
 * `mapPresenceFromChapterId`, and already carries a managed identity under the
 * face that was valid at the cap. That is the point of consuming `/ship`'s own
 * projection rather than re-deriving one — the hard temporal rules exist once.
 *
 * What is left is what the walk has to do with them: read the chapter a
 * position started at, so aiming at a silhouette can answer *here since when*,
 * and refuse to draw a body the payload cannot place. Both are pure, and both
 * are tested without a canvas or a database in sight.
 */
import type { CastMember } from './types'

/** `ch-358` and `ch-359.4` alike, as a number. Null for anything else. */
export function chapterNumberOf(reference: string | null | undefined): number | null {
  const match = /^ch-(\d+)(?:\.(\d+))?$/.exec(reference ?? '')
  if (!match) return null
  return Number(match[1]) + Number(match[2] ?? 0) / 1000
}

/**
 * Whether the walk may draw this body.
 *
 * Three refusals, and none of them is a judgement about the person: no role
 * means nothing to dress them in, no location means nowhere to stand, and the
 * ship's own id means aboard-with-no-room — the announcers, whom the panels
 * never put in a place. A body the archive cannot place is not drawn at all,
 * because drawing them somewhere plausible is the one thing ADR-003 forbids.
 */
export function isDrawable(member: CastMember): boolean {
  return member.locations.length > 0 && member.role.trim().length > 0
}

/** The chapter number a position starts at, for the provenance card. */
export function sinceChapter(member: CastMember): number | null {
  return chapterNumberOf(member.since)
}

/**
 * Everyone the walk may draw, in a fixed order.
 *
 * Sorted by character id rather than left in payload order: the payload's order
 * is a query plan, and two loads of the same event have to produce the same
 * scene down to the identity of each figure — which is what lets a screenshot
 * at a fixed cap be a test.
 */
export function drawable(members: readonly CastMember[]): CastMember[] {
  return members
    .filter(isDrawable)
    .sort((left, right) => left.characterId.localeCompare(right.characterId))
}
