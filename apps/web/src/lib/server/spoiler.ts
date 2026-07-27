import type { Cookies } from '@sveltejs/kit'

export const SPOILER_COOKIE = 'userSpoilerLimit'
/** Older sessions carry the previous cookie name; honour it until they rotate. */
const LEGACY_SPOILER_COOKIE = 'spoiler_limit'

/**
 * The reader's spoiler cap, or undefined when it is unset.
 *
 * Cookies are client-controlled, so anything that is not a plain non-negative
 * integer is treated as unset. Parsing it inline is what let `NaN` reach Prisma
 * `lte` clauses, where the resulting filter is undefined behaviour rather than
 * a refusal.
 */
export function readSpoilerLimit(cookies: Cookies): number | undefined {
  const raw = cookies.get(SPOILER_COOKIE) ?? cookies.get(LEGACY_SPOILER_COOKIE)
  if (!raw) return undefined

  const parsed = Number.parseInt(raw, 10)
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined
}

/** The same cap shaped as a spoiler-engine profile, or undefined when unset. */
export function readSpoilerProfile(cookies: Cookies): { maxChapter: number } | undefined {
  const maxChapter = readSpoilerLimit(cookies)
  return maxChapter === undefined ? undefined : { maxChapter }
}
