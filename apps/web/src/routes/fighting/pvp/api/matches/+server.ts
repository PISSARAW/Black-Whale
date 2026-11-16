import { clashBody, clashThrottle, createClashLobby } from '$lib/server/clashPvpHttp'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, getClientAddress }) =>
  clashThrottle(`create:${getClientAddress()}`, 12) ??
  createClashLobby(await clashBody(request), request.headers.get('x-clash-profile') ?? '')
