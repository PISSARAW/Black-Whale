import type { RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = () =>
  new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
