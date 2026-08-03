import { error, type Handle, type HandleServerError } from '@sveltejs/kit'
import { rateLimit } from '$lib/server/rateLimit'
import { cachePolicyFor } from '$lib/server/httpCache'
import { describeError, errorReference, log } from '$lib/server/log'
import { LOCALE_TAGS, parsePathname } from '$lib/i18n/config'

// Simulation branches are created and mutated by unauthenticated visitors and
// persist rows. These actions used to be throttled by the API; they are served
// in-process now, so the budget has to be enforced here.
const WRITE_RATE_LIMITED_PATHS = new Set(['/simulations'])
const WRITE_LIMIT = 10
const WRITE_WINDOW_MS = 60_000

export const handle: Handle = async ({ event, resolve }) => {
  // The locale prefix is not part of the route, so the budget has to be keyed
  // on the stripped path — otherwise `/fr/simulations` would sidestep it.
  const { locale, path } = parsePathname(event.url.pathname)

  if (event.request.method === 'POST' && WRITE_RATE_LIMITED_PATHS.has(path)) {
    const verdict = rateLimit(event.getClientAddress(), WRITE_LIMIT, WRITE_WINDOW_MS)
    if (!verdict.allowed) {
      throw error(429, `Too many requests. Try again in ${verdict.retryAfterSeconds}s.`)
    }
  }

  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', LOCALE_TAGS[locale].html),
  })
  // Cacheability, decided once for the whole app. A route that already said
  // something for itself keeps it: `/sitemap.xml` and `/robots.txt` know their
  // own lifetimes, and `/health` must never be stored at all.
  if (!response.headers.has('cache-control')) {
    const policy = cachePolicyFor({ method: event.request.method, path })
    response.headers.set('cache-control', policy.cacheControl)
    // The reader's spoiler cap travels in a cookie, so it has to be part of
    // any shared cache's key or a capped reader could be served someone
    // else's canon. See `lib/server/httpCache.ts`.
    if (policy.vary) response.headers.append('vary', policy.vary)
  }
  // Set here as well as at the proxy, so the guarantees still hold in a
  // deployment that terminates TLS somewhere other than the bundled Caddy.
  response.headers.set('x-content-type-options', 'nosniff')
  response.headers.set('x-frame-options', 'DENY')
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()')
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains')
  }
  return response
}

/**
 * Every unhandled failure in a load or an endpoint passes here. Without it a
 * 500 was a line of prose in the container log and a blank page for the
 * visitor, with nothing linking the two.
 *
 * The reference is the link: it is written to the log line and shown on the
 * error page, so a reported failure can be found without asking the reader to
 * retrace their steps.
 */
export const handleError: HandleServerError = ({ error: thrown, event, status, message }) => {
  const reference = errorReference()

  log.error('request failed', {
    reference,
    status,
    method: event.request.method,
    // The path, never the query: it carries whatever the visitor typed.
    path: event.url.pathname,
    ...describeError(thrown),
  })

  // What SvelteKit puts in `$page.error`. It reaches the browser, so it says
  // only what the reader needs to report it.
  return { message, reference }
}
