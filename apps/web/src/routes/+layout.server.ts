import { readDataFile } from '$lib/server/data-files'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { LayoutServerLoad } from './$types'

interface CatalogChapter {
  number: number
}

/**
 * The spoiler cap is enforced by every loader, so the control that sets it has
 * to be reachable from every page — which means the root layout, and which means
 * the current cap has to be loaded here. Reading it server-side (the cookie is
 * `httpOnly`) also keeps the first render honest: the header states the cap the
 * page was actually filtered with, not one hydration corrects afterwards.
 *
 * It is deliberately not called `spoilerLimit`: several pages return a field of
 * that name, and layout data merged with page data would silently intersect the
 * two into a non-nullable number.
 */
export const load: LayoutServerLoad = async ({ cookies }) => {
  const chapters = await readDataFile<CatalogChapter[]>('chapters/chapters.json')
  const numbers = chapters.map((chapter) => chapter.number)

  return {
    spoilerFilter: {
      limit: readSpoilerLimit(cookies) ?? null,
      // Bounds for the chapter field. The catalogue is the only thing that knows
      // how far the archive goes, so the control cannot hard-code them.
      chapters: numbers.length
        ? { first: Math.min(...numbers), last: Math.max(...numbers) }
        : null,
    },
  }
}
