import { json } from '@sveltejs/kit'
import { clashPvpRegistry } from './clashPvp'
import { parsePvpSetup, record } from '$lib/fighting/pvp/protocol'
import { parsePvpControlUpload } from '$lib/fighting/pvp/controlUpload'
import { PVP_RULESET } from '$lib/fighting/pvp/types'
import { clashSeasons } from './clashSeasons'
import './competition/runtime'
import { clashPvpFailure, clashBearer } from './clashPvpHttpShared'
export { clashPvpFailure, clashBearer, clashBody, clashThrottle } from './clashPvpHttpShared'

const headers = { 'cache-control': 'no-store' }
export function createClashLobby(body: unknown, profileToken = ''): Response {
  if (!record(body) || body.ruleset !== PVP_RULESET)
    return json({ error: 'VERSION' }, { status: 426, headers })
  const setup = parsePvpSetup(body.setup)
  if (!setup) return json({ error: 'INVALID_SETUP' }, { status: 400, headers })
  try {
    return json(
      clashPvpRegistry.create(
        setup,
        clashSeasons.identify(profileToken) ?? undefined,
        body.rollback === true,
      ),
      { status: 201, headers },
    )
  } catch (error) {
    return clashPvpFailure(error)
  }
}
export function updateClashLobby(id: string, request: Request, body: unknown): Response {
  if (!record(body)) return invalid()
  try {
    if (
      body.kind === 'join' &&
      typeof body.ruleset === 'string' &&
      typeof body.invitation === 'string'
    )
      return json(
        clashPvpRegistry.join(id, body.ruleset, {
          invitation: body.invitation,
          profile: clashSeasons.identify(request.headers.get('x-clash-profile') ?? '') ?? undefined,
        }),
        { status: 201, headers },
      )
    return authenticatedUpdate(id, request, body)
  } catch (error) {
    return clashPvpFailure(error)
  }
}
function authenticatedUpdate(
  id: string,
  request: Request,
  body: Record<string, unknown>,
): Response {
  const token = clashBearer(request)
  if (body.kind === 'inputs' || body.kind === 'input') return inputUpdate(id, token, body)
  if (body.kind === 'leave') {
    clashPvpRegistry.leave(id, token)
    return json({ left: true }, { headers })
  }
  if (
    body.kind === 'ready' &&
    typeof body.ruleset === 'string' &&
    typeof body.configHash === 'string'
  )
    return json(
      clashPvpRegistry.ready(id, { token, ruleset: body.ruleset, configHash: body.configHash }),
      { headers },
    )
  return invalid()
}
function inputUpdate(id: string, token: string, body: Record<string, unknown>) {
  const upload = parsePvpControlUpload(body)
  if (!upload) return invalid()
  const result =
    body.kind === 'input'
      ? clashPvpRegistry.submit(id, { token, ...upload, packet: upload.packets[0] })
      : clashPvpRegistry.receiveInputs(id, { token, ...upload })
  return json(result, { headers })
}
function invalid() {
  return json({ error: 'INVALID_COMMAND' }, { status: 400, headers })
}
