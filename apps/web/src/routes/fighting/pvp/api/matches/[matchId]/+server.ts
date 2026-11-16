import { json } from '@sveltejs/kit'
import { clashPvpRegistry } from '$lib/server/clashPvp'
import {
  clashBearer,
  clashBody,
  clashPvpFailure,
  clashThrottle,
  updateClashLobby,
} from '$lib/server/clashPvpHttp'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ params, request, getClientAddress }) => {
  const limited = clashThrottle(`poll:${getClientAddress()}`, 3000)
  if (limited) return limited
  try {
    return json(clashPvpRegistry.view(params.matchId, clashBearer(request)), {
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    return clashPvpFailure(error)
  }
}
export const POST: RequestHandler = async ({ params, request, getClientAddress }) =>
  clashThrottle(`input:${getClientAddress()}`, 3000) ??
  updateClashLobby(params.matchId, request, await clashBody(request))
