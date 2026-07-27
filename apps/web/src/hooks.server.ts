import { error, type Handle, type HandleFetch } from '@sveltejs/kit';
import { rateLimit } from '$lib/server/rateLimit';

const DEFAULT_MAX_CHAPTER = 1000;

// Simulation branches are created and mutated by unauthenticated visitors and
// persist rows. These actions used to be throttled by the API; they are served
// in-process now, so the budget has to be enforced here.
const WRITE_RATE_LIMITED_PATHS = new Set(['/simulations']);
const WRITE_LIMIT = 10;
const WRITE_WINDOW_MS = 60_000;

/** Cookies are client-controlled: coerce to a sane integer before it reaches the API. */
function parseMaxChapter(raw: string | undefined): number {
  if (!raw) return DEFAULT_MAX_CHAPTER;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_MAX_CHAPTER;
  return Math.min(parsed, DEFAULT_MAX_CHAPTER);
}

export const handle: Handle = async ({ event, resolve }) => {
  // The settings UI uses userSpoilerLimit. Keep the legacy name as a fallback
  // while existing sessions naturally rotate to the canonical cookie.
  const spoilerLimitCookie =
    event.cookies.get('userSpoilerLimit') ?? event.cookies.get('spoiler_limit');
  event.locals.maxChapter = parseMaxChapter(spoilerLimitCookie);

  if (event.request.method === 'POST' && WRITE_RATE_LIMITED_PATHS.has(event.url.pathname)) {
    const verdict = rateLimit(event.getClientAddress(), WRITE_LIMIT, WRITE_WINDOW_MS);
    if (!verdict.allowed) {
      throw error(429, `Too many requests. Try again in ${verdict.retryAfterSeconds}s.`);
    }
  }

  const response = await resolve(event);
  // Set here as well as at the proxy, so the guarantees still hold in a
  // deployment that terminates TLS somewhere other than the bundled Caddy.
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
  }
  return response;
};

// The x-spoiler-limit header is only ever attached to the backend API. The
// prefix check is anchored on a trailing slash so a look-alike host such as
// `http://api:3001.evil.test` cannot collect it.
const API_ORIGINS = [process.env['API_URL'], process.env['VITE_API_URL'], 'http://api:3001']
  .filter((value): value is string => Boolean(value))
  .map((value) => value.replace(/\/+$/, ''));

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  if (API_ORIGINS.some((origin) => request.url === origin || request.url.startsWith(`${origin}/`))) {
    request.headers.set('x-spoiler-limit', String(event.locals.maxChapter));
  }
  return fetch(request);
};
