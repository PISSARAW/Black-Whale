import { json } from '@sveltejs/kit'
import { clashBearer, clashBody, clashThrottle, clashPvpFailure } from '../clashPvpHttpShared'
import { readOnlineCommand, type OnlineCommand } from '$lib/fighting/online/protocol'
import { PVP_RULESET } from '$lib/fighting/pvp/types'
import type { ClashCompetition } from './service'
import { CompetitionError } from './error'
import type { RankedProfile } from '../clashSeasons'
const headers = { 'cache-control': 'no-store' }
export async function competitionHttp(
  request: Request,
  options: { service: ClashCompetition; ip: string },
): Promise<Response> {
  const limited = clashThrottle(`competition:${options.ip}`, 180)
  if (limited) return limited
  try {
    if (request.method === 'GET') return get(request, options.service)
    if (request.method !== 'POST') return json({ error: 'METHOD' }, { status: 405, headers })
    return await post(request, options)
  } catch (error) {
    return failure(error)
  }
}
async function post(request: Request, options: { service: ClashCompetition; ip: string }) {
  const body = await clashBody(request)
  if (!body || typeof body !== 'object' || !('ruleset' in body) || body.ruleset !== PVP_RULESET)
    return json({ error: 'VERSION' }, { status: 426, headers })
  const command = readOnlineCommand(body)
  if (!command) return json({ error: 'INVALID_COMMAND' }, { status: 400, headers })
  const profile = options.service.profile(clashBearer(request))
  const throttled = clashThrottle(
    `competition:${profile.id}:${command.kind}`,
    command.kind === 'probe' ? 30 : 60,
  )
  if (throttled) return throttled
  return json(dispatch(options.service, profile, command), { headers })
}
function get(request: Request, service: ClashCompetition) {
  const id = new URL(request.url).searchParams.get('tournament')
  if (id) {
    const tournament = service.tournament(id)
    return json(tournament ?? { error: 'NOT_FOUND' }, { status: tournament ? 200 : 404, headers })
  }
  return json(
    { ...service.view(service.profile(clashBearer(request))), ruleset: PVP_RULESET },
    { headers },
  )
}
function dispatch(
  service: ClashCompetition,
  profile: RankedProfile,
  command: OnlineCommand,
): unknown {
  const simple: Partial<Record<OnlineCommand['kind'], () => unknown>> = {
    probe: () => service.probe(profile),
    cancel: () => {
      service.cancel(profile)
      return service.view(profile)
    },
    continue: () => service.continue(profile),
    withdraw: () => service.withdraw(profile),
  }
  if (simple[command.kind]) return simple[command.kind]!()
  return detailed(service, profile, command)
}
function detailed(
  service: ClashCompetition,
  profile: RankedProfile,
  command: OnlineCommand,
): unknown {
  if (command.kind === 'queue') return service.enqueue(profile, command)
  if (command.kind === 'refresh') {
    service.refreshProbe(profile, command.nonce)
    return service.view(profile)
  }
  if (command.kind === 'report') return service.report(profile, command)
  if (command.kind === 'tournament-create') return service.createTournament(profile, command)
  if (command.kind === 'tournament-join') service.joinTournament(profile, command)
  else return tournamentAction(service, profile, command)
  return service.view(profile)
}
function tournamentAction(
  service: ClashCompetition,
  profile: RankedProfile,
  command: OnlineCommand,
) {
  if (command.kind === 'tournament-start') service.startTournament(profile, command.id)
  else if (command.kind === 'tournament-cancel') service.cancelTournament(profile, command.id)
  else if (command.kind === 'tournament-play') return service.playTournament(profile, command.id)
  else throw new CompetitionError('INVALID_COMMAND')
  return service.view(profile)
}
function failure(error: unknown) {
  if (!(error instanceof CompetitionError)) return clashPvpFailure(error)
  const statuses: Record<string, number> = {
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    BUSY: 409,
    NOT_READY: 409,
    TOURNAMENT: 409,
    ALREADY_REPORTED: 409,
    COMPETITION_STORAGE: 503,
    CAPACITY: 503,
    RATE_LIMITED: 429,
    CONNECTION: 422,
    INVALID_PROBE: 422,
  }
  return json({ error: error.code }, { status: statuses[error.code] ?? 400, headers })
}
