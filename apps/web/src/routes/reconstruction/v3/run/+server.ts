import { json } from '@sveltejs/kit'
import type { WorldState } from '@black-whale/world-engine'
import { compareWorldBranches } from '$lib/reconstruction/v3/comparison'
import { executeReconstructionScenario } from '$lib/reconstruction/v3/executor'
import type { BranchEpistemicState, BranchKnowledgeState } from '$lib/reconstruction/v3/knowledge'
import { buildReconstructionReport } from '$lib/reconstruction/v3/report'
import {
  defineReconstructionScenario,
  parseReconstructionScenarioDraft,
} from '$lib/reconstruction/v3/scenario'
import { prisma } from '$lib/server/db'
import { rateLimit } from '$lib/server/rateLimit'
import { reconstructionExecutorPorts } from '$lib/server/reconstruction-v3'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { RequestHandler } from './$types'

const RUN_LIMIT = 12
const RATE_WINDOW_MS = 60_000

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const throttle = rateLimit(`reconstruction:v3:${getClientAddress()}`, RUN_LIMIT, RATE_WINDOW_MS)
  if (!throttle.allowed) {
    return json(
      { error: `Trop de simulations. Réessayez dans ${throttle.retryAfterSeconds}s.` },
      { status: 429, headers: { 'Retry-After': String(throttle.retryAfterSeconds) } },
    )
  }

  try {
    const body: unknown = await request.json()
    const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const scenario = defineReconstructionScenario(parseReconstructionScenarioDraft(input.scenario))
    const spoilerLimit = readSpoilerLimit(cookies)
    if (!(await visibleFork(scenario.forkEventId, spoilerLimit))) {
      return json({ error: 'Point de divergence inconnu ou masqué.' }, { status: 404 })
    }

    const result = await executeReconstructionScenario(
      scenario,
      (state) => knowledgeFromWorldState(state as WorldState),
      reconstructionExecutorPorts(),
    )
    const canonical = result.initialState as WorldState
    const branch = result.finalState as WorldState
    const differences = compareWorldBranches(canonical, branch)
    const report = buildReconstructionReport(result.replay, differences)

    return json({
      branchId: result.branchId,
      replay: result.replay,
      report,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scénario invalide'
    return json({ error: message }, { status: 400 })
  }
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
