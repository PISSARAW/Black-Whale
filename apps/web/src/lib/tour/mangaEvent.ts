import type { MangaView } from './mangaViewModel'

export interface MangaEventCandidate {
  id: string
  chapter: { number: number }
  sequence: number
}

/** Resolves only an event that the requested manga view actually names. */
export function mangaEventFor<E extends MangaEventCandidate>(
  events: readonly E[],
  view: MangaView | null,
): E | null {
  if (!view) return null
  return (
    events.find(
      (candidate) =>
        candidate.chapter.number === view.chapter &&
        (view.eventSequence === undefined || candidate.sequence === view.eventSequence),
    ) ?? null
  )
}
