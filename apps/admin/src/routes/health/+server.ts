import type { RequestHandler } from '@sveltejs/kit'
import { getPrisma } from '$lib/server/db'

export const GET: RequestHandler = async () => {
  try {
    await (
      await getPrisma()
    ).$queryRaw`SELECT 1`
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })
  } catch {
    return new Response(JSON.stringify({ status: 'unavailable' }), {
      status: 503,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })
  }
}
