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

/** A year: the cap is a reading position, not a session preference. */
const SPOILER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Store the reader's cap. Only the server reads it, so it is set `httpOnly` and
 * surfaced to the interface through the root layout's load rather than by
 * letting the page parse `document.cookie`.
 */
export function writeSpoilerLimit(cookies: Cookies, maxChapter: number): void {
  cookies.set(SPOILER_COOKIE, String(maxChapter), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SPOILER_COOKIE_MAX_AGE,
  })
  // A stale legacy cookie is never read while the current one is set, but it
  // would come back into force the moment the reader clears their cap.
  cookies.delete(LEGACY_SPOILER_COOKIE, { path: '/' })
}

/** Drop the cap: the reader asks for the whole canon again. */
export function clearSpoilerLimit(cookies: Cookies): void {
  cookies.delete(SPOILER_COOKIE, { path: '/' })
  cookies.delete(LEGACY_SPOILER_COOKIE, { path: '/' })
}
