export interface CanonScene {
  event: string
  storyDate?: string
  charactersInvolved?: string[]
  location?: string
  locationId?: string
  certainty?: string
}

export interface ChapterWithScenes {
  number: number
  timeline?: CanonScene[]
}

export interface SharedCanonEvent {
  chapter: number
  sequence: number
  event: string
  storyDate: string | null
  location: string | null
  locationId: string | null
  certainty: string
}

/**
 * Return only attested physical co-presence.
 *
 * A chapter, a timestamp, a phone call or a ship cutaway is not enough: both
 * character ids must occur in the same atomic scene entry. The catalogue keeps
 * remote callers, people merely discussed and simultaneous rooms in separate
 * entries specifically so this predicate cannot manufacture a meeting.
 */
export function sharedCanonEvents(
  chapters: readonly ChapterWithScenes[],
  firstCharacterId: string,
  secondCharacterId: string,
): SharedCanonEvent[] {
  if (firstCharacterId === secondCharacterId) return []

  return chapters.flatMap((chapter) =>
    (chapter.timeline ?? []).flatMap((scene, index) => {
      const present = new Set(scene.charactersInvolved ?? [])
      if (!present.has(firstCharacterId) || !present.has(secondCharacterId)) return []
      return [
        {
          chapter: chapter.number,
          sequence: index + 1,
          event: scene.event,
          storyDate: scene.storyDate ?? null,
          location: scene.location ?? null,
          locationId: scene.locationId ?? null,
          certainty: scene.certainty ?? 'CONFIRMED',
        },
      ]
    }),
  )
}

export const wereCoPresent = (
  chapters: readonly ChapterWithScenes[],
  firstCharacterId: string,
  secondCharacterId: string,
) => sharedCanonEvents(chapters, firstCharacterId, secondCharacterId).length > 0
