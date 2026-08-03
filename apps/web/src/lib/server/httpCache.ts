/**
 * What may be cached, and by whom.
 *
 * Almost every page here is derived from `data/` and changes only when a
 * release does, so recomputing it per visit is waste — that is the whole point
 * of chantier 4 of ADR-001. The catch is the one thing that makes this site
 * what it is: the reader's spoiler cap. Two readers asking for the same URL are
 * shown different canon, and the cap travels in a cookie. A shared cache that
 * keyed on the URL alone would eventually hand a reader stopped at chapter 100
 * a page built for someone who has read everything — a spoiler served by
 * infrastructure, which is the worst way to break that promise.
 *
 * So the rule is narrow and stated once here rather than per route:
 *
 *   - anything that writes, or that carries visitor state, is never stored;
 *   - everything else may be cached, and always with `Vary: Cookie`, so the
 *     cap is part of the cache key by construction.
 *
 * `Vary: Cookie` is conservative — it splits the cache per distinct cookie
 * header, not per cap — and it is the only version of this that cannot leak.
 * A finer key belongs with a cache that can compute one (a CDN function), and
 * the day one exists it changes here and nowhere else.
 */

/** How long a shared cache may serve a canon page without asking again. */
export const CANON_SHARED_MAX_AGE = 600

/**
 * How long it may keep serving a stale one while it refreshes in the
 * background. A release is what invalidates these pages, and a reader landing
 * on a ten-minute-old page during a deploy is not a fault worth a slow request.
 */
export const CANON_STALE_WHILE_REVALIDATE = 86_400

/**
 * Paths that carry visitor state rather than canon.
 *
 * `/simulations` persists branches per visitor, `/spoiler-limit` is the cap
 * itself, and `/health` must report the state of *this* process. Matching is by
 * prefix on the locale-stripped path, so `/fr/simulations/…` is covered too.
 */
const NEVER_STORED = ['/simulations', '/spoiler-limit', '/health']

export interface CacheRequest {
  method: string
  /** The pathname with its locale prefix already stripped. */
  path: string
}

export interface CachePolicy {
  cacheControl: string
  /** Absent when nothing is stored: there is no key to vary. */
  vary?: string
}

export function cachePolicyFor({ method, path }: CacheRequest): CachePolicy {
  // A write is never a cacheable thing, and neither is the response to one:
  // it reflects what the visitor just did.
  if (method !== 'GET' && method !== 'HEAD') {
    return { cacheControl: 'no-store' }
  }

  if (NEVER_STORED.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return { cacheControl: 'no-store' }
  }

  return {
    cacheControl: `public, s-maxage=${CANON_SHARED_MAX_AGE}, stale-while-revalidate=${CANON_STALE_WHILE_REVALIDATE}, must-revalidate`,
    vary: 'Cookie',
  }
}

/**
 * Whether a policy is safe for a page whose content depends on the cap.
 *
 * Stated as a predicate so the test can assert the property over every route
 * rather than over the handful somebody thought to list: either nothing is
 * stored, or the cookie is part of the key.
 */
export function cannotLeakAcrossReaders(policy: CachePolicy): boolean {
  return policy.cacheControl === 'no-store' || policy.vary === 'Cookie'
}
