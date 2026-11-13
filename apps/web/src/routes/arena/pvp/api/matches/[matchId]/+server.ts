import { json } from '@sveltejs/kit'
import { arenaPvpRegistry, ArenaPvpRegistryError } from '$lib/server/arenaPvp'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ params, request }) => {
  try {
    return json(arenaPvpRegistry.view(params.matchId, bearer(request)), {
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    return registryFailure(error)
  }
}

function bearer(request: Request): string {
  const value = request.headers.get('authorization') ?? ''
  return value.startsWith('Bearer ') ? value.slice(7) : ''
}

function registryFailure(error: unknown) {
  if (!(error instanceof ArenaPvpRegistryError)) return json({ error: 'INTERNAL' }, { status: 500 })
  return json({ error: error.code }, { status: error.code === 'MATCH_NOT_FOUND' ? 404 : 401 })
}
