import type { Handle, HandleFetch } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Read spoiler limit from cookies (default to Infinity or a very high number if none)
  const spoilerLimitCookie = event.cookies.get('spoiler_limit');
  const maxChapter = spoilerLimitCookie ? parseInt(spoilerLimitCookie, 10) : 1000;
  
  event.locals.maxChapter = maxChapter;

  const response = await resolve(event);
  return response;
};

// Intercept fetch requests made from the SvelteKit server to the backend API
// and inject the x-spoiler-limit header.
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  if (request.url.startsWith(import.meta.env.VITE_API_URL || 'http://api:3001')) {
    request.headers.set('x-spoiler-limit', event.locals.maxChapter.toString());
  }
  return fetch(request);
};
