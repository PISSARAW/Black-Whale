import type { Handle, HandleServerError } from '@sveltejs/kit'
import { ADMIN_SESSION_COOKIE, verifySession } from '$lib/server/session'
import { describeError, errorReference, log } from '$lib/server/log'

const publicPaths = new Set(['/login', '/health'])

function harden(response: Response): Response {
  response.headers.set('x-content-type-options', 'nosniff')
  response.headers.set('x-frame-options', 'DENY')
  response.headers.set('referrer-policy', 'same-origin')
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()')
  // The back-office must never be indexed, and its responses must never sit in a
  // shared cache: they carry unpublished editorial data.
  response.headers.set('x-robots-tag', 'noindex, nofollow, noarchive')
  response.headers.set('cache-control', 'no-store, private')
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains')
  }
  return response
}

export const handle: Handle = async ({ event, resolve }) => {
  const authenticated = verifySession(event.cookies.get(ADMIN_SESSION_COOKIE))
  event.locals.authenticated = authenticated

  if (!authenticated && !publicPaths.has(event.url.pathname)) {
    if (event.url.pathname.startsWith('/api/')) {
      return harden(
        new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      )
    }
    // Built by hand rather than `throw redirect(...)`: a thrown redirect is
    // rendered by the framework and would skip the hardened headers.
    return harden(
      new Response(null, {
        status: 303,
        headers: { location: `/login?next=${encodeURIComponent(event.url.pathname)}` },
      }),
    )
  }

  return harden(await resolve(event))
}

/** Same contract as the public app: one JSON line, one reference, shown once. */
export const handleError: HandleServerError = ({ error: thrown, event, status, message }) => {
  const reference = errorReference()

  log.error('admin request failed', {
    reference,
    status,
    method: event.request.method,
    path: event.url.pathname,
    authenticated: event.locals.authenticated,
    ...describeError(thrown),
  })

  return { message, reference }
}
