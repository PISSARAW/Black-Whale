import type { Apparition } from '../apparitions'
import type { MangaView } from '../mangaViewModel'

/** Explicit guardian blocking never creates a beast or bypasses its spoiler/visibility rules. */
export function stageBeastsForMangaView(
  beasts: Apparition[],
  view: MangaView | null,
): Apparition[] {
  if (!view?.beastStaging) return beasts
  const staging = new Map(view.beastStaging.map((entry) => [`cast-beast:${entry.ownerId}`, entry]))
  return beasts.map((beast) => {
    const placement = staging.get(beast.id)
    if (!placement || beast.spaceId !== view.spaceId) return beast
    return { ...beast, at: placement.at, heading: placement.heading ?? beast.heading }
  })
}
