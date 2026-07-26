import { redirect, type Handle } from '@sveltejs/kit';
import { ADMIN_SESSION_COOKIE, verifySession } from '$lib/server/session';

const publicPaths = new Set(['/login', '/health']);

export const handle: Handle = async ({ event, resolve }) => {
  const authenticated = verifySession(event.cookies.get(ADMIN_SESSION_COOKIE));
  event.locals.authenticated = authenticated;

  if (!authenticated && !publicPaths.has(event.url.pathname)) {
    if (event.url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    throw redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
  }

  const response = await resolve(event);
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('referrer-policy', 'same-origin');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  return response;
};
