import { openClashPvpStream } from '$lib/server/clashPvpStream'
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

export const GET: RequestHandler = ({ params, request, getClientAddress, url }) => {
  if (url.searchParams.has('stream') && !url.searchParams.has('watch'))
    return (
      clashThrottle(`stream:${getClientAddress()}`, 30) ??
      openClashPvpStream({
        id: params.matchId,
        token: clashBearer(request),
        signal: request.signal,
      })
    )
  const limited = clashThrottle(`poll:${getClientAddress()}`, 3000)
  if (limited) return limited
  try {
    const epoch = url.searchParams.get('rollback')
    if (epoch !== null)
      return json(
        clashPvpRegistry.rollbackStart(params.matchId, clashBearer(request), Number(epoch)),
        {
          headers: { 'cache-control': 'no-store' },
        },
      )
    return json(
      url.searchParams.has('watch')
        ? clashPvpRegistry.watch(params.matchId, clashBearer(request))
        : clashPvpRegistry.view(params.matchId, clashBearer(request)),
      {
        headers: { 'cache-control': 'no-store' },
      },
    )
  } catch (error) {
    return clashPvpFailure(error)
  }
}
export const POST: RequestHandler = async ({ params, request, getClientAddress }) =>
  clashThrottle(`input:${getClientAddress()}`, 3000) ??
  updateClashLobby(params.matchId, request, await clashBody(request))
