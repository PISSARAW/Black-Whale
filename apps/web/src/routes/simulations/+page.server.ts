import { localizedLoad } from '$lib/server/localized-load'
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
import {
  ANSWER_CARDS,
  QUESTION_CARDS,
  TABLE_KINDS,
  type AnswerCard,
  type MorenaGame,
  type QuestionCard,
  type TableKind,
} from '@black-whale/ability-modules'
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

/** Whether the event exists on the whale and sits within the reader's cap. */
async function visibleFork(eventId: string, spoilerLimit: number | undefined): Promise<boolean> {
  if (!eventId) return false
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

interface Selection {
  abilityId: string
  actionId: string | null
  actorId: string
  targetId: string | null
}

function morenaState(snapshot: BranchSnapshot) {
  const effects = Object.values(snapshot.effects)
  const network = effects.find(
    (entry) =>
      entry.abilityId === 'contagion' &&
      entry.attributes['cohortId'] === 'heil-ly-infected' &&
      Array.isArray(entry.attributes['memberIds']),
  )
  const gameEffect = effects
    .filter((entry) => entry.abilityId === 'contagion' && entry.attributes['game'])
    .sort((left, right) => right.startedAt.ordinal - left.startedAt.ordinal)[0]
  const game = (gameEffect?.attributes['game'] as MorenaGame | undefined) ?? null
  const members = effects.flatMap((entry) => {
    if (entry.abilityId !== 'contagion' || typeof entry.attributes['memberId'] !== 'string')
      return []
    return [
      {
        effectId: entry.id,
        memberId: entry.attributes['memberId'] as string,
        label:
          snapshot.entities[entry.attributes['memberId'] as string]?.label ??
          String(entry.attributes['memberId']),
        level: Number(entry.attributes['level'] ?? 0),
        kills: Number(entry.attributes['kills'] ?? 0),
      },
    ]
  })
  return {
    networkEffectId: network?.id ?? null,
    gameEffectId: gameEffect?.id ?? null,
    gameEffectState: gameEffect?.state ?? null,
    candidateId:
      typeof gameEffect?.attributes['candidateId'] === 'string'
        ? gameEffect.attributes['candidateId']
        : null,
    witnessed: gameEffect?.attributes['witnessedMurder'] === true,
    game,
    members,
    tableKinds: TABLE_KINDS,
  }
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

export const load: PageServerLoad = localizedLoad(
  async ({ url, cookies }: Parameters<PageServerLoad>[0]) => {
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
      morena: null as ReturnType<typeof morenaState> | null,
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

      return {
        ...base,
        branch,
        scene,
        plan,
        actions,
        markers,
        tier,
        selection: resolved,
        morena: morenaState(branch.snapshot),
      }
    } catch (error) {
      return { ...base, selection, branchError: message(error, 'Unable to load this branch.') }
    }
  },
)

export const actions: Actions = {
  create: async ({ request, cookies, getClientAddress }) => {
    const throttle = rateLimit(`sim:create:${getClientAddress()}`, CREATE_LIMIT, RATE_WINDOW_MS)
    if (!throttle.allowed) {
      return fail(429, {
        message: `Too many branches created. Try again in ${throttle.retryAfterSeconds}s.`,
      })
    }

    const data = await request.formData()
    const parentEventId = String(data.get('parentEventId') || '')
    // The lab only forks what the reader has already reached: the picker lists
    // capped events, but a hand-made post could name any chapter.
    if (!(await visibleFork(parentEventId, readSpoilerLimit(cookies)))) {
      return fail(404, { message: 'Unknown or hidden fork event.' })
    }

    let branchId: string
    try {
      const branch = await simulationStore.createBranch(
        parseCreateSimulationInput({
          parentEventId,
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

  morena: async ({ request, url, getClientAddress }) => {
    const throttle = rateLimit(`sim:action:${getClientAddress()}`, ACTION_LIMIT, RATE_WINDOW_MS)
    if (!throttle.allowed) return fail(429, { message: 'Too many simulation actions.' })
    const data = await request.formData()
    const branchId = String(data.get('branchId') || url.searchParams.get('branch') || '')
    const command = String(data.get('command') || '')
    const actorId = String(data.get('actorId') || 'morena-prudo')
    const targetId = String(data.get('targetId') || '')
    const value = String(data.get('value') || '')
    if (!branchId || !command || !actorId) return fail(400, { message: 'Missing Morena command.' })

    try {
      const branch = await simulationStore.getBranchState(branchId)
      const state = morenaState(branch.snapshot)
      const game = state.game
      let actionId = command
      let targets: string[] = targetId ? [targetId] : []
      let parameters: Record<string, unknown> = {}

      if (command === 'open-network') {
        if (state.networkEffectId)
          throw new SimulationInputError('The Contagion network is already open.')
      } else if (command === 'open-game') {
        if (!targetId) throw new SimulationInputError('Choose a candidate for the game.')
        if (game && game.phase !== 'over')
          throw new SimulationInputError('A Morena game is already active.')
        if (value && !TABLE_KINDS.includes(value as TableKind))
          throw new SimulationInputError('Unknown table technique.')
        parameters = {
          ...(value ? { technique: value } : {}),
          ...(data.get('clean') === 'true' ? { clean: 'true' } : {}),
        }
      } else {
        if (!game || !state.gameEffectId)
          throw new SimulationInputError('No Morena game exists in this branch.')
        targets = state.candidateId ? [state.candidateId] : targets
        if (command === 'ask') {
          if (
            game.phase !== 'asking' ||
            !QUESTION_CARDS.includes(value as QuestionCard) ||
            !game.questions.includes(value as QuestionCard)
          )
            throw new SimulationInputError('That question cannot be asked now.')
          parameters = { effectId: state.gameEffectId, question: value }
        } else if (command === 'stake') {
          if (
            game.phase !== 'deal' ||
            !ANSWER_CARDS.includes(value as AnswerCard) ||
            !game.graveyard.includes(value as AnswerCard)
          )
            throw new SimulationInputError('That card cannot be recovered now.')
          parameters = { effectId: state.gameEffectId, card: value }
        } else if (command === 'refuse-stake') {
          if (game.phase !== 'deal') throw new SimulationInputError('There is no kiss to refuse.')
          parameters = { effectId: state.gameEffectId }
        } else if (command === 'play-technique') {
          if (game.phase === 'over' || !game.technique)
            throw new SimulationInputError('No table technique can be played.')
          parameters = { effectId: state.gameEffectId }
        } else if (command === 'leave-table') {
          if (game.phase === 'over') throw new SimulationInputError('The game is already over.')
          parameters = { effectId: state.gameEffectId }
        } else if (command === 'settle') {
          if (game.phase !== 'settling')
            throw new SimulationInputError('The last card is not ready.')
          if (value && !ANSWER_CARDS.includes(value as AnswerCard))
            throw new SimulationInputError('Unknown final choice.')
          parameters = { effectId: state.gameEffectId, ...(value ? { choice: value } : {}) }
        } else if (command === 'close-game') {
          const eligible = game.kissed && (game.verdict === 'infected' || game.verdict === 'forced')
          if (
            game.phase !== 'over' ||
            state.gameEffectState === 'ENDED' ||
            (eligible && !state.witnessed)
          )
            throw new SimulationInputError('The game cannot be closed now.')
          parameters = { effectId: state.gameEffectId }
        } else if (command === 'witness-murder') {
          if (game.phase !== 'over' || state.witnessed || state.gameEffectState === 'ENDED')
            throw new SimulationInputError('The murder cannot be recorded now.')
          parameters = { gameEffectId: state.gameEffectId }
        } else if (command === 'infect') {
          if (!state.networkEffectId || !state.witnessed || !state.candidateId)
            throw new SimulationInputError('The three infection conditions are not complete.')
          if (state.members.some((member) => member.memberId === state.candidateId))
            throw new SimulationInputError('This candidate is already infected.')
          parameters = { effectId: state.networkEffectId, gameEffectId: state.gameEffectId }
          targets = [state.candidateId]
        } else if (command === 'record-kill') {
          const member = state.members.find(
            (entry) => entry.effectId === String(data.get('memberEffectId') || ''),
          )
          if (!member || !['ordinary', 'nen-user', 'prince'].includes(value))
            throw new SimulationInputError('Unknown member or victim status.')
          parameters = {
            effectId: member.effectId,
            victimStatus: value,
            victimId: String(
              data.get('victimId') || `simulated-${branch.snapshot.cursor.ordinal + 1}`,
            ),
          }
          targets = [member.memberId]
        } else {
          throw new SimulationInputError('Unknown Morena command.')
        }
      }

      await simulationStore.applyAction(
        branchId,
        parseSimulationActionInput({
          actionType: 'ACTIVATE_ABILITY',
          payload: {
            abilityId: 'contagion',
            actorId,
            interaction: actionId,
            actionId,
            targets,
            parameters,
          },
        }),
      )
    } catch (error) {
      return fail(400, { message: message(error, 'Morena action failed.') })
    }
    throw redirect(
      303,
      `/simulations?branch=${branchId}&ability=contagion&actor=${actorId}${targetId ? `&target=${targetId}` : ''}`,
    )
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
