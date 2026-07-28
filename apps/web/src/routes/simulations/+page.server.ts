import { fail, redirect } from '@sveltejs/kit'
import { listCanonicalEvents } from '@black-whale/timeline-engine'
import {
  SimulationInputError,
  SimulationNotFoundError,
  parseCreateSimulationInput,
  parseSimulationActionInput,
} from '@black-whale/simulation-engine'
import { parseNenActionRequest, type AbilityActionPlan } from '@black-whale/nen-engine'
import { prisma } from '$lib/server/db'
import { nenRuntime } from '$lib/server/nen'
import { simulationStore } from '$lib/server/simulations'
import { readSpoilerLimit } from '$lib/server/spoiler'
import { rateLimit } from '$lib/server/rateLimit'
import type { Actions, PageServerLoad } from './$types'

/** The one ability this lab exposes, and the action its form triggers. */
const ABILITY_ID = 'bungee-gum'
const ACTION_ID = 'attach'
const DEFAULT_ACTOR = 'hisoka'

/** The branch snapshot, taken from the store rather than re-declared here. */
type BranchSnapshot = Awaited<ReturnType<typeof simulationStore.getBranchState>>['snapshot']

// Both actions persist rows for an anonymous visitor, so they carry their own
// per-address budget: branch creation is the expensive one, individual actions
// within an existing branch are cheaper.
const CREATE_LIMIT = 10
const ACTION_LIMIT = 30
const RATE_WINDOW_MS = 60_000

/**
 * Only errors this code raised deliberately are safe to show. Anything else
 * (Prisma failures, connection strings in stack messages) is logged for the
 * operator and replaced with the caller-supplied fallback.
 */
function message(error: unknown, fallback: string): string {
  if (error instanceof SimulationInputError || error instanceof SimulationNotFoundError)
    return error.message
  console.error('[simulations]', error)
  return fallback
}

/**
 * The plan the server would follow if the form were submitted as it stands.
 * It is the same call `execute` makes, so what the panel lists is what the
 * branch will receive — the page no longer merely claims that it is.
 */
async function planFor(
  snapshot: BranchSnapshot,
  actorId: string,
  targetId: string | null,
): Promise<AbilityActionPlan | null> {
  try {
    return await nenRuntime.planInState(
      ABILITY_ID,
      parseNenActionRequest({
        actorId,
        interaction: ACTION_ID,
        actionId: ACTION_ID,
        targets: targetId ? [targetId] : [],
        eventId: snapshot.cursor.eventId,
      }),
      snapshot,
    )
  } catch (error) {
    // A malformed selection must not cost the visitor the whole branch view.
    console.error('[simulations] plan', error)
    return null
  }
}

export const load: PageServerLoad = async ({ url, cookies }) => {
  const events = await listCanonicalEvents(prisma, readSpoilerLimit(cookies))

  const branchId = url.searchParams.get('branch')
  const selection = {
    actorId: url.searchParams.get('actor') || DEFAULT_ACTOR,
    targetId: url.searchParams.get('target'),
  }
  if (!branchId) {
    return { events, branch: null, scene: null, plan: null, selection, branchError: null }
  }

  try {
    const [branch, scene] = await Promise.all([
      simulationStore.getBranchState(branchId),
      simulationStore.getMapScene(branchId, 'black-whale-overview'),
    ])
    const plan = await planFor(branch.snapshot, selection.actorId, selection.targetId)
    return { events, branch, scene, plan, selection, branchError: null }
  } catch (error) {
    return {
      events,
      branch: null,
      scene: null,
      plan: null,
      selection,
      branchError: message(error, 'Unable to load this branch.'),
    }
  }
}

export const actions: Actions = {
  create: async ({ request, getClientAddress }) => {
    const throttle = rateLimit(`sim:create:${getClientAddress()}`, CREATE_LIMIT, RATE_WINDOW_MS)
    if (!throttle.allowed) {
      return fail(429, {
        message: `Too many branches created. Try again in ${throttle.retryAfterSeconds}s.`,
      })
    }

    const data = await request.formData()
    let branchId: string
    try {
      const branch = await simulationStore.createBranch(
        parseCreateSimulationInput({
          parentEventId: data.get('parentEventId'),
          mode: data.get('mode') ?? 'rule-compatible',
        }),
      )
      branchId = branch.id
    } catch (error) {
      return fail(400, { message: message(error, 'Unable to create branch.') })
    }
    throw redirect(303, `/simulations?branch=${branchId}`)
  },

  activateBungee: async ({ request, url, getClientAddress }) => {
    const throttle = rateLimit(`sim:action:${getClientAddress()}`, ACTION_LIMIT, RATE_WINDOW_MS)
    if (!throttle.allowed) {
      return fail(429, {
        message: `Too many simulation actions. Try again in ${throttle.retryAfterSeconds}s.`,
      })
    }

    const data = await request.formData()
    const branchId = String(data.get('branchId') || url.searchParams.get('branch') || '')
    const targetId = String(data.get('targetId') || '')
    const actorId = String(data.get('actorId') || DEFAULT_ACTOR)
    if (!branchId || !targetId) return fail(400, { message: 'A branch and target are required.' })

    try {
      await simulationStore.applyAction(
        branchId,
        parseSimulationActionInput({
          actionType: 'ACTIVATE_ABILITY',
          payload: {
            abilityId: ABILITY_ID,
            actorId,
            interaction: ACTION_ID,
            actionId: ACTION_ID,
            targets: [targetId],
          },
        }),
      )
    } catch (error) {
      return fail(400, { message: message(error, 'Ability activation failed.') })
    }
    // The selection rides along so the panel re-plans against the new state
    // rather than resetting to "no target chosen".
    const query = new URLSearchParams({ branch: branchId, actor: actorId, target: targetId })
    throw redirect(303, `/simulations?${query}`)
  },
}
