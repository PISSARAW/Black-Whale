import type { SimulationSelection } from '$lib/server/simulation-presentation'
import { prisma } from '$lib/server/db'
import { localizedLoad } from '$lib/server/localized-load'
import { describeError, log } from '$lib/server/log'
import { nenRuntime } from '$lib/server/nen'
import { rateLimit } from '$lib/server/rateLimit'
import { actionsFor, morenaState, planFor, sceneMarkers } from '$lib/server/simulation-presentation'
import { simulationStore } from '$lib/server/simulations'
import { readSpoilerLimit } from '$lib/server/spoiler'
import {
  ANSWER_CARDS,
  QUESTION_CARDS,
  TABLE_KINDS,
  type AnswerCard,
  type QuestionCard,
  type TableKind,
} from '@black-whale/ability-modules'
import { listCanonicalEvents } from '@black-whale/canon-engine'
import type { Location } from '@black-whale/domain'
import {
  SimulationInputError,
  SimulationNotFoundError,
  parseCreateSimulationInput,
  parseSimulationActionInput,
} from '@black-whale/simulation-engine'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

/** Where the lab opens; every other runnable ability is one select away. */
const DEFAULT_ABILITY = 'bungee-gum'

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

    const selection: SimulationSelection = {
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
      const resolved: SimulationSelection = {
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
      const actionId = command
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
