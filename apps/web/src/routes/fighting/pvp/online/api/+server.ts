import { competitionHttp } from '$lib/server/competition/http'
import { clashCompetition } from '$lib/server/competition/runtime'
import type { RequestHandler } from './$types'
const handle: RequestHandler = ({ request, getClientAddress }) =>
  competitionHttp(request, { service: clashCompetition, ip: getClientAddress() })
export const GET = handle
export const POST = handle
