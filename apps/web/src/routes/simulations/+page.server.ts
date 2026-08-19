import { fail, redirect } from '@sveltejs/kit'
import { listCanonicalEvents } from '@black-whale/canon-engine'
import {
  SimulationInputError,
  SimulationNotFoundError,
  parseCreateSimulationInput,
  parseSimulationActionInput,
} from '@black-whale/simulation-engine'
import { parseNenActionRequest, type AbilityActionPlan } from '@black-whale/nen-engine'
import type { Location } from '@black-whale/domain'
import { calculatePresencePosition } from '$lib/components/map/markerProjection'
import { prisma } from '$lib/server/db'
import { nenRuntime } from '$lib/server/nen'
import { simulationStore } from '$lib/server/simulations'
import { readSpoilerLimit } from '$lib/server/spoiler'
import { rateLimit } from '$lib/server/rateLimit'
import { log, describeError } from '$lib/server/log'
import type { Actions, PageServerLoad } from './$types'

/** Where the lab opens; every other runnable ability is one select away. */
const DEFAULT_ABILITY = 'bungee-gum'

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
  log.error('[simulations]', describeError(error))
  return fallback
}

interface Selection {
  abilityId: string
  actionId: string | null
  actorId: string
  targetId: string | null
}

/**
 * The plan the server would follow if the form were submitted as it stands.
 * It is the same call `activate` makes, so what the panel lists is what the
 * branch will receive — the page no longer merely claims that it is.
 */
async function planFor(
  snapshot: BranchSnapshot,
  selection: Selection,
): Promise<AbilityActionPlan | null> {
  if (!selection.actionId || !selection.actorId) return null
  try {
    return await nenRuntime.planInState(
      selection.abilityId,
      parseNenActionRequest({
        actorId: selection.actorId,
        interaction: selection.actionId,
        actionId: selection.actionId,
        targets: selection.targetId ? [selection.targetId] : [],
        eventId: snapshot.cursor.eventId,
      }),
      snapshot,
    )
  } catch (error) {
    // A malformed selection must not cost the visitor the whole branch view.
    log.error('[simulations] plan', describeError(error))
    return null
  }
}

/** The actions the selected ability offers in this branch, with their visibility. */
async function actionsFor(snapshot: BranchSnapshot, selection: Selection) {
  if (!selection.actorId) return []
  try {
    return await nenRuntime.actionsInState(
      selection.abilityId,
      parseNenActionRequest({
        actorId: selection.actorId,
        interaction: 'activate',
        targets: selection.targetId ? [selection.targetId] : [],
        eventId: snapshot.cursor.eventId,
      }),
      snapshot,
    )
  } catch (error) {
    log.error('[simulations] actions', describeError(error))
    return []
  }
}

/**
 * The branch drawn on the deck plan rather than counted.
 *
 * The scene panel used to report three numbers — markers, effect links, aura
 * layers — which is a summary of a map, not a map. The projection that places a
 * canonical presence on the ship SVG reads the same fields a branch marker
 * carries, so the branch is placed with it.
 */
function sceneMarkers(
  scene: Awaited<ReturnType<typeof simulationStore.getMapScene>>,
  snapshot: BranchSnapshot,
  locations: Location[],
) {
  const presences = scene.markers.map((marker) => ({
    id: marker.entity.id,
    entityType: 'BODY' as const,
    entityId: marker.entity.id,
    locationId: marker.locationId,
    fromEventId: snapshot.cursor.eventId,
    precision: marker.precision,
    certainty: marker.certainty,
  }))

  /** Entities an effect of this branch starts from or lands on. */
  const touched = new Set(
    Object.values(snapshot.effects)
      .filter((effect) => effect.state !== 'ENDED')
      .flatMap((effect) => [effect.source.id, ...effect.targets.map((target) => target.id)]),
  )

  const markers = presences.map((presence, index) => {
    const placement = calculatePresencePosition(presence, presences, locations)
    const marker = scene.markers[index]
    return {
      id: presence.entityId,
      label: marker.label,
      x: placement.x,
      y: placement.y,
      tier: placement.tierId,
      locationLabel: placement.loc?.name ?? null,
      state:
        marker.certainty === 'CONFIRMED'
          ? ('confirmed' as const)
          : marker.certainty === 'PROBABLE'
            ? ('believed' as const)
            : ('outdated' as const),
      // Highlighted rather than "the observer": on this map the entities worth
      // picking out are the ones the branch's own effects reach. An effect names
      // the character, while a marker is usually their body, so the body's owner
      // counts too — otherwise the entity an ability just hit is not marked.
      isObserver:
        touched.has(presence.entityId) ||
        touched.has(snapshot.entities[presence.entityId]?.originalCharacterId ?? ''),
    }
  })

  // The deck most of the scene stands on is the one worth drawing.
  const counts = new Map<string, number>()
  for (const marker of markers) {
    if (marker.tier) counts.set(marker.tier, (counts.get(marker.tier) ?? 0) + 1)
  }
  const tier = [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null

  return { markers, tier }
}

export const load: PageServerLoad = async ({ url, cookies }) => {
  const [events, locationRows] = await Promise.all([
    listCanonicalEvents(prisma, readSpoilerLimit(cookies)),
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
  ])
  // Prisma rows carry their own nullability; the projection reads the domain
  // shape, the same way the timeline engine bridges it.
  const locations = locationRows as unknown as Location[]

  const abilities = nenRuntime
    .listRunnableAbilities()
    .sort((left, right) => left.name.localeCompare(right.name))
  const requestedAbility = url.searchParams.get('ability')
  const ability =
    abilities.find((entry) => entry.id === requestedAbility) ??
    abilities.find((entry) => entry.id === DEFAULT_ABILITY) ??
    abilities[0]

  const base = {
    events,
    abilities,
    locations: locations.map((location) => ({ id: location.id, name: location.name })),
    branch: null,
    scene: null,
    plan: null,
    actions: [] as Awaited<ReturnType<typeof actionsFor>>,
    markers: [] as ReturnType<typeof sceneMarkers>['markers'],
    tier: null as string | null,
    branchError: null as string | null,
  }

  const selection: Selection = {
    abilityId: ability?.id ?? DEFAULT_ABILITY,
    actionId: url.searchParams.get('action'),
    // Each ability opens on its canonical owner, so a visitor switching ability
    // is not left holding an actor who cannot use it.
    actorId: url.searchParams.get('actor') || ability?.owner || '',
    targetId: url.searchParams.get('target'),
  }

  const branchId = url.searchParams.get('branch')
  if (!branchId) return { ...base, selection }

  try {
    const [branch, scene] = await Promise.all([
      simulationStore.getBranchState(branchId),
      simulationStore.getMapScene(branchId, 'black-whale-overview'),
    ])

    const actions = await actionsFor(branch.snapshot, selection)
    // A visitor who has not picked an action gets the ability's first one, so the
    // panel explains something rather than waiting to be told what to explain.
    const resolved: Selection = {
      ...selection,
      actionId:
        actions.find((action) => action.id === selection.actionId)?.id ?? actions[0]?.id ?? null,
    }
    const plan = await planFor(branch.snapshot, resolved)
    const { markers, tier } = sceneMarkers(scene, branch.snapshot, locations)

    return { ...base, branch, scene, plan, actions, markers, tier, selection: resolved }
  } catch (error) {
    return { ...base, selection, branchError: message(error, 'Unable to load this branch.') }
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

  /**
   * Any action of any ability the engine can run, rather than one hard-coded
   * pair. The ids are the ones the panel planned with, so a visitor executes
   * what they were shown.
   */
  activate: async ({ request, url, getClientAddress }) => {
    const throttle = rateLimit(`sim:action:${getClientAddress()}`, ACTION_LIMIT, RATE_WINDOW_MS)
    if (!throttle.allowed) {
      return fail(429, {
        message: `Too many simulation actions. Try again in ${throttle.retryAfterSeconds}s.`,
      })
    }

    const data = await request.formData()
    const branchId = String(data.get('branchId') || url.searchParams.get('branch') || '')
    const abilityId = String(data.get('abilityId') || '')
    const actionId = String(data.get('actionId') || '')
    const actorId = String(data.get('actorId') || '')
    const targetId = String(data.get('targetId') || '')
    if (!branchId || !abilityId || !actionId || !actorId) {
      return fail(400, { message: 'A branch, an ability, an action and an actor are required.' })
    }

    try {
      await simulationStore.applyAction(
        branchId,
        parseSimulationActionInput({
          actionType: 'ACTIVATE_ABILITY',
          payload: {
            abilityId,
            actorId,
            interaction: actionId,
            actionId,
            targets: targetId ? [targetId] : [],
          },
        }),
      )
    } catch (error) {
      return fail(400, { message: message(error, 'Ability activation failed.') })
    }
    // The selection rides along so the panel re-plans against the new state
    // rather than resetting to "no target chosen".
    const query = new URLSearchParams({
      branch: branchId,
      ability: abilityId,
      action: actionId,
      actor: actorId,
      ...(targetId ? { target: targetId } : {}),
    })
    throw redirect(303, `/simulations?${query}`)
  },

  /**
   * The kernel's other action: moving an entity. It was reachable through the
   * store and through no interface, which left a branch unable to answer "what
   * if he had been somewhere else" — half of what a branch is for.
   */
  move: async ({ request, url, getClientAddress }) => {
    const throttle = rateLimit(`sim:action:${getClientAddress()}`, ACTION_LIMIT, RATE_WINDOW_MS)
    if (!throttle.allowed) {
      return fail(429, {
        message: `Too many simulation actions. Try again in ${throttle.retryAfterSeconds}s.`,
      })
    }

    const data = await request.formData()
    const branchId = String(data.get('branchId') || url.searchParams.get('branch') || '')
    const entityId = String(data.get('entityId') || '')
    const locationId = String(data.get('locationId') || '')
    if (!branchId || !entityId || !locationId) {
      return fail(400, { message: 'A branch, an entity and a destination are required.' })
    }

    // The kernel checks the entity but takes the destination on trust, so a
    // hand-made request could park someone in a room that does not exist.
    if (!(await prisma.location.findUnique({ where: { id: locationId }, select: { id: true } }))) {
      return fail(400, { message: 'Unknown destination.' })
    }

    try {
      await simulationStore.applyAction(
        branchId,
        parseSimulationActionInput({
          actionType: 'MOVE_ENTITY',
          payload: { entityId, locationId },
        }),
      )
    } catch (error) {
      return fail(400, { message: message(error, 'Move failed.') })
    }
    throw redirect(303, `/simulations?branch=${branchId}`)
  },
}
