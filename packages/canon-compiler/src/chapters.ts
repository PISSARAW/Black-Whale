/**
 * Chapter references, and the two orders a chapter reference can be read in.
 *
 * `ch-383` names a chapter; `ch-383.3` names one event of it. The distinction
 * matters everywhere a bound is set, because a chapter holds several events and
 * a victim rarely falls in the first one.
 */

export interface ChapterReference {
  number: number
  /** The event pinned inside the chapter, or null for "the first one". */
  sequence: number | null
}

export function parseChapterReference(value: string | null | undefined): ChapterReference | null {
  const match = /^ch-(\d+)(?:\.(\d+))?$/.exec(value ?? '')
  if (!match) return null
  return { number: Number(match[1]), sequence: match[2] ? Number(match[2]) : null }
}

export function chapterNumber(value: string | null | undefined): number | null {
  return parseChapterReference(value)?.number ?? null
}

/**
 * A reference as one sortable number, the sequence as a fraction of the chapter.
 *
 * Keeps `ch-359.4` after `ch-359` and before `ch-361`, which a two-part
 * comparison spread over call sites kept getting wrong.
 */
export function chapterPosition(value: string | null | undefined): number | null {
  const reference = parseChapterReference(value)
  if (!reference) return null
  return reference.number + (reference.sequence ?? 0) / 1000
}
