/** One chapter-level ability claim, reduced to what the tour needs. */
export interface EventHatsuUse {
  chapter: number
  eventTitle?: string
  abilityId: string
  userId: string
  status: string
  occursOnBlackWhale: boolean
}

const VISIBLE_USE = new Set(['ACTIVATED', 'MAINTAINED'])

/**
 * Techniques visibly active in one exact event.
 *
 * A chapter-only claim is deliberately insufficient: a chapter can contain
 * several simultaneous scenes, and entering Kurapika's room must not manifest
 * an ability used elsewhere on the ship during that chapter.
 */
export function eventHatsuFor(
  uses: readonly EventHatsuUse[],
  event: { chapter: number; title: string },
  kindFor: (abilityId: string) => string | null,
  carried: ReadonlySet<string>,
): Record<string, string[]> {
  const found: Record<string, string[]> = {}
  for (const use of uses) {
    if (
      !use.occursOnBlackWhale ||
      !VISIBLE_USE.has(use.status) ||
      use.chapter !== event.chapter ||
      use.eventTitle !== event.title
    )
      continue
    const kind = kindFor(use.abilityId)
    if (!kind || !carried.has(kind)) continue
    found[use.userId] = [...new Set([...(found[use.userId] ?? []), kind])]
  }
  return found
}
