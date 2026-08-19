import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/server/db'
import { log, describeError } from '$lib/server/log'

/**
 * Liveness *and* readiness: every page of this site is a database read, so a web
 * process that cannot reach Postgres serves nothing. Answering `ok` without
 * asking the database — which is what this endpoint used to do — tells a load
 * balancer to keep routing traffic to a process that can only 500.
 * apps/admin already checks it this way.
 */
export const GET: RequestHandler = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return new Response(JSON.stringify({ status: 'ok', database: 'up' }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })
  } catch (error) {
    log.error('[health] database unreachable', describeError(error))
    return new Response(JSON.stringify({ status: 'unavailable', database: 'down' }), {
      status: 503,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })
  }
}
