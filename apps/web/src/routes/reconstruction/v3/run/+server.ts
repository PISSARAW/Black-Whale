import { json, type Cookies } from '@sveltejs/kit'
import type { WorldState } from '@black-whale/canon-engine'
import {
  SimulationInputError,
  SimulationNotFoundError,
} from '@black-whale/simulation-engine'
import { compareWorldBranches } from '$lib/reconstruction/v3/comparison'
import { ScenarioInputError } from '$lib/reconstruction/v3/errors'
import { executeReconstructionScenario } from '$lib/reconstruction/v3/executor'
import type { BranchEpistemicState, BranchKnowledgeState } from '$lib/reconstruction/v3/knowledge'
import { buildReconstructionReport } from '$lib/reconstruction/v3/report'
import {
  defineReconstructionScenario,
  parseReconstructionScenarioDraft,
} from '$lib/reconstruction/v3/scenario'
import { prisma } from '$lib/server/db'
import { log, describeError } from '$lib/server/log'
import { rateLimit } from '$lib/server/rateLimit'
import { reconstructionExecutorPorts } from '$lib/server/reconstruction-v3'
import { readSpoilerLimit } from '$lib/server/spoiler'
import { messagesFor } from '$lib/i18n'
import { isLocale, type Locale } from '$lib/i18n/config'
import type { RequestHandler } from './$types'

const RUN_LIMIT = 12
const RATE_WINDOW_MS = 60_000

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const headerLocale = request.headers.get('x-locale')
  const locale: Locale = isLocale(headerLocale) ? headerLocale : 'en'
  const copy = messagesFor(locale).reconstruction.v3
  const throttle = rateLimit(`reconstruction:v3:${getClientAddress()}`, RUN_LIMIT, RATE_WINDOW_MS)
  if (!throttle.allowed) {
    return json(
      { error: copy.errors.rateLimited(throttle.retryAfterSeconds) },
      { status: 429, headers: { 'Retry-After': String(throttle.retryAfterSeconds) } },
    )
  }

  try {
    return await runScenario({ body: await request.json(), cookies, locale })
  } catch (error) {
    return failure(error, locale)
  }
}

/** Parses, checks and executes one scenario, answering with the replay. */
async function runScenario(input: { body: unknown; cookies: Cookies; locale: Locale }) {
  const draft = normalise(input.body)
  const requestedLocale = typeof draft.locale === 'string' ? draft.locale : null
  const locale: Locale = isLocale(requestedLocale) ? requestedLocale : input.locale
  const copy = messagesFor(locale).reconstruction.v3
  const scenario = defineReconstructionScenario(parseReconstructionScenarioDraft(draft.scenario))
  if (!(await visibleFork(scenario.forkEventId, readSpoilerLimit(input.cookies)))) {
    return json({ error: copy.errors.unknownFork }, { status: 404 })
  }

  const result = await executeReconstructionScenario(
    scenario,
    (state) => knowledgeFromWorldState(state as WorldState),
    reconstructionExecutorPorts(),
  )
  const differences = compareWorldBranches(
    result.initialState as WorldState,
    result.finalState as WorldState,
  )
  return json({
    branchId: result.branchId,
    replay: result.replay,
    report: buildReconstructionReport(result.replay, differences, locale),
  })
}

/** Whatever the client sent, as an object a draft can be read off of. */
function normalise(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
}

/**
 * Only scenario-level mistakes are echoed back verbatim. Any other failure
 * (Prisma, TypeError) keeps its message server-side and answers with a generic
 * copy, so internals never cross to the client.
 */
function failure(error: unknown, locale: Locale) {
  if (
    error instanceof ScenarioInputError ||
    error instanceof SimulationInputError ||
    error instanceof SimulationNotFoundError
  ) {
    return json({ error: error.message }, { status: 400 })
  }
  log.error('Reconstruction run failed', describeError(error))
  const copy = messagesFor(locale).reconstruction.v3
  return json({ error: copy.errors.invalidScenario }, { status: 500 })
}

async function visibleFork(eventId: string, spoilerLimit: number | undefined): Promise<boolean> {
  return Boolean(
    await prisma.narrativeEvent.findFirst({
      where: {
        id: eventId,
        occursOnBlackWhale: true,
        ...(spoilerLimit === undefined ? {} : { chapter: { number: { lte: spoilerLimit } } }),
      },
      select: { id: true },
    }),
  )
}

function knowledgeFromWorldState(state: WorldState): BranchKnowledgeState {
  return {
    byObserver: Object.fromEntries(
      Object.entries(state.knowledgeByObserver).map(([observerId, records]) => [
        observerId,
        Object.fromEntries(
          Object.entries(records)
            .filter(([, record]) => record.state !== 'UNKNOWN')
            .map(([factId, record]) => [
              factId,
              {
                factId,
                state: epistemicState(record.state),
                confidence: record.confidence ?? (record.state === 'KNOWN' ? 1 : 0.5),
                acquiredAtDecisionId: record.acquiredAt.eventId,
                sourceCharacterId: null,
                transmissionPath: [observerId],
              },
            ]),
        ),
      ]),
    ),
  }
}

function epistemicState(state: string): BranchEpistemicState {
  if (state === 'DOUBTED') return 'SUSPECTED'
  if (['KNOWN', 'BELIEVED', 'SUSPECTED', 'REJECTED'].includes(state)) {
    return state as BranchEpistemicState
  }
  return 'SUSPECTED'
}
