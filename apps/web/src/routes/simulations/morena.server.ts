import { fail, redirect } from '@sveltejs/kit'
import { SimulationInputError, parseSimulationActionInput } from '@black-whale/simulation-engine'
import {
  ANSWER_CARDS,
  QUESTION_CARDS,
  TABLE_KINDS,
  type AnswerCard,
  type MorenaGame,
  type QuestionCard,
  type TableKind,
} from '@black-whale/ability-modules'
import { describeError, log } from '$lib/server/log'
import { rateLimit } from '$lib/server/rateLimit'
import { simulationStore } from '$lib/server/simulations'
import type { Actions } from './$types'

type BranchSnapshot = Awaited<ReturnType<typeof simulationStore.getBranchState>>['snapshot']
type BranchEffect = BranchSnapshot['effects'][string]

const ACTION_LIMIT = 30
const RATE_WINDOW_MS = 60_000
const VICTIM_STATUSES = ['ordinary', 'nen-user', 'prince']

function isNetworkEffect(effect: BranchEffect) {
  return (
    effect.abilityId === 'contagion' &&
    effect.attributes['cohortId'] === 'heil-ly-infected' &&
    Array.isArray(effect.attributes['memberIds'])
  )
}

function isGameEffect(effect: BranchEffect) {
  return effect.abilityId === 'contagion' && Boolean(effect.attributes['game'])
}

function memberFromEffect(snapshot: BranchSnapshot, effect: BranchEffect) {
  const memberId = effect.attributes['memberId']
  if (effect.abilityId !== 'contagion' || typeof memberId !== 'string') return null
  return {
    effectId: effect.id,
    memberId,
    label: snapshot.entities[memberId]?.label ?? memberId,
    level: Number(effect.attributes['level'] ?? 0),
    kills: Number(effect.attributes['kills'] ?? 0),
  }
}

function candidateIdOf(effect: BranchEffect | undefined) {
  const candidateId = effect?.attributes['candidateId']
  return typeof candidateId === 'string' ? candidateId : null
}

export function morenaState(snapshot: BranchSnapshot) {
  const effects = Object.values(snapshot.effects)
  const network = effects.find(isNetworkEffect)
  const gameEffect = effects
    .filter(isGameEffect)
    .sort((left, right) => right.startedAt.ordinal - left.startedAt.ordinal)[0]
  return {
    networkEffectId: network?.id ?? null,
    gameEffectId: gameEffect?.id ?? null,
    gameEffectState: gameEffect?.state ?? null,
    candidateId: candidateIdOf(gameEffect),
    witnessed: gameEffect?.attributes['witnessedMurder'] === true,
    game: (gameEffect?.attributes['game'] as MorenaGame | undefined) ?? null,
    members: effects.flatMap((effect) => {
      const member = memberFromEffect(snapshot, effect)
      return member ? [member] : []
    }),
    tableKinds: TABLE_KINDS,
  }
}

type MorenaState = ReturnType<typeof morenaState>

interface CommandContext {
  data: FormData
  snapshot: BranchSnapshot
  state: MorenaState
  targetId: string
  value: string
}

interface PreparedMutation {
  targets: string[]
  parameters: Record<string, unknown>
}

type PrepareCommand = (context: CommandContext) => PreparedMutation

function assertCommand(condition: boolean, message: string): asserts condition {
  if (!condition) throw new SimulationInputError(message)
}

function activeGame(context: CommandContext) {
  assertCommand(Boolean(context.state.game), 'No Morena game exists in this branch.')
  assertCommand(Boolean(context.state.gameEffectId), 'No Morena game exists in this branch.')
  return {
    game: context.state.game!,
    effectId: context.state.gameEffectId!,
    targets: context.state.candidateId ? [context.state.candidateId] : [],
  }
}

const openNetwork: PrepareCommand = ({ state }) => {
  assertCommand(!state.networkEffectId, 'The Contagion network is already open.')
  return { targets: [], parameters: {} }
}

const openGame: PrepareCommand = ({ data, state, targetId, value }) => {
  assertCommand(Boolean(targetId), 'Choose a candidate for the game.')
  assertCommand(!state.game || state.game.phase === 'over', 'A Morena game is already active.')
  assertCommand(!value || TABLE_KINDS.includes(value as TableKind), 'Unknown table technique.')
  const parameters: Record<string, unknown> = {}
  if (value) parameters.technique = value
  if (data.get('clean') === 'true') parameters.clean = 'true'
  return { targets: [targetId], parameters }
}

const ask: PrepareCommand = (context) => {
  const { game, effectId, targets } = activeGame(context)
  const question = context.value as QuestionCard
  assertCommand(game.phase === 'asking', 'That question cannot be asked now.')
  assertCommand(QUESTION_CARDS.includes(question), 'That question cannot be asked now.')
  assertCommand(game.questions.includes(question), 'That question cannot be asked now.')
  return { targets, parameters: { effectId, question } }
}

const stake: PrepareCommand = (context) => {
  const { game, effectId, targets } = activeGame(context)
  const card = context.value as AnswerCard
  assertCommand(game.phase === 'deal', 'That card cannot be recovered now.')
  assertCommand(ANSWER_CARDS.includes(card), 'That card cannot be recovered now.')
  assertCommand(game.graveyard.includes(card), 'That card cannot be recovered now.')
  return { targets, parameters: { effectId, card } }
}

const refuseStake: PrepareCommand = (context) => {
  const { game, effectId, targets } = activeGame(context)
  assertCommand(game.phase === 'deal', 'There is no kiss to refuse.')
  return { targets, parameters: { effectId } }
}

const playTechnique: PrepareCommand = (context) => {
  const { game, effectId, targets } = activeGame(context)
  assertCommand(game.phase !== 'over', 'No table technique can be played.')
  assertCommand(Boolean(game.technique), 'No table technique can be played.')
  return { targets, parameters: { effectId } }
}

const leaveTable: PrepareCommand = (context) => {
  const { game, effectId, targets } = activeGame(context)
  assertCommand(game.phase !== 'over', 'The game is already over.')
  return { targets, parameters: { effectId } }
}

const settle: PrepareCommand = (context) => {
  const { game, effectId, targets } = activeGame(context)
  const choice = context.value as AnswerCard
  assertCommand(game.phase === 'settling', 'The last card is not ready.')
  assertCommand(!context.value || ANSWER_CARDS.includes(choice), 'Unknown final choice.')
  const parameters: Record<string, unknown> = { effectId }
  if (context.value) parameters.choice = context.value
  return { targets, parameters }
}

const closeGame: PrepareCommand = (context) => {
  const { game, effectId, targets } = activeGame(context)
  const saidYes = game.verdict === 'infected' || game.verdict === 'forced'
  const awaitingWitness = game.kissed && saidYes && !context.state.witnessed
  assertCommand(game.phase === 'over', 'The game cannot be closed now.')
  assertCommand(context.state.gameEffectState !== 'ENDED', 'The game cannot be closed now.')
  assertCommand(!awaitingWitness, 'The game cannot be closed now.')
  return { targets, parameters: { effectId } }
}

const witnessMurder: PrepareCommand = (context) => {
  const { game, effectId, targets } = activeGame(context)
  assertCommand(game.phase === 'over', 'The murder cannot be recorded now.')
  assertCommand(!context.state.witnessed, 'The murder cannot be recorded now.')
  assertCommand(context.state.gameEffectState !== 'ENDED', 'The murder cannot be recorded now.')
  return { targets, parameters: { gameEffectId: effectId } }
}

const infect: PrepareCommand = (context) => {
  const { effectId } = activeGame(context)
  const { candidateId, members, networkEffectId, witnessed } = context.state
  assertCommand(Boolean(networkEffectId), 'The three infection conditions are not complete.')
  assertCommand(witnessed, 'The three infection conditions are not complete.')
  assertCommand(Boolean(candidateId), 'The three infection conditions are not complete.')
  assertCommand(
    !members.some((member) => member.memberId === candidateId),
    'This candidate is already infected.',
  )
  return {
    targets: [candidateId!],
    parameters: { effectId: networkEffectId!, gameEffectId: effectId },
  }
}

const recordKill: PrepareCommand = (context) => {
  const memberEffectId = String(context.data.get('memberEffectId') || '')
  const member = context.state.members.find((entry) => entry.effectId === memberEffectId)
  assertCommand(Boolean(member), 'Unknown member or victim status.')
  assertCommand(VICTIM_STATUSES.includes(context.value), 'Unknown member or victim status.')
  return {
    targets: [member!.memberId],
    parameters: {
      effectId: member!.effectId,
      victimStatus: context.value,
      victimId: String(
        context.data.get('victimId') || `simulated-${context.snapshot.cursor.ordinal + 1}`,
      ),
    },
  }
}

const COMMANDS: Record<string, PrepareCommand> = {
  'open-network': openNetwork,
  'open-game': openGame,
  ask,
  stake,
  'refuse-stake': refuseStake,
  'play-technique': playTechnique,
  'leave-table': leaveTable,
  settle,
  'close-game': closeGame,
  'witness-murder': witnessMurder,
  infect,
  'record-kill': recordKill,
}

function prepareCommand(command: string, context: CommandContext) {
  const prepare = COMMANDS[command]
  assertCommand(Boolean(prepare), 'Unknown Morena command.')
  return prepare!(context)
}

function requestFields(data: FormData, url: URL) {
  return {
    branchId: String(data.get('branchId') ?? url.searchParams.get('branch') ?? ''),
    command: String(data.get('command') ?? ''),
    targetId: String(data.get('targetId') ?? ''),
    value: String(data.get('value') ?? ''),
  }
}

function commandFailure(error: unknown) {
  if (error instanceof SimulationInputError) return fail(400, { message: error.message })
  log.error('[simulations:morena]', describeError(error))
  return fail(400, { message: 'Morena action failed.' })
}

function branchLocation(branchId: string, targetId: string) {
  const target = targetId ? `&target=${targetId}` : ''
  return `/simulations?branch=${branchId}&ability=contagion&actor=morena-prudo${target}`
}

const morenaAction: Actions['morena'] = async ({ request, url, getClientAddress }) => {
  const throttle = rateLimit(`sim:action:${getClientAddress()}`, ACTION_LIMIT, RATE_WINDOW_MS)
  if (!throttle.allowed) return fail(429, { message: 'Too many simulation actions.' })
  const data = await request.formData()
  const { branchId, command, targetId, value } = requestFields(data, url)
  const actorId = 'morena-prudo'
  if (!branchId || !command) return fail(400, { message: 'Missing Morena command.' })

  try {
    const branch = await simulationStore.getBranchState(branchId)
    const prepared = prepareCommand(command, {
      data,
      snapshot: branch.snapshot,
      state: morenaState(branch.snapshot),
      targetId,
      value,
    })
    await simulationStore.applyAction(
      branchId,
      parseSimulationActionInput({
        actionType: 'ACTIVATE_ABILITY',
        payload: {
          abilityId: 'contagion',
          actorId,
          interaction: command,
          actionId: command,
          targets: prepared.targets,
          parameters: prepared.parameters,
        },
      }),
    )
  } catch (error) {
    return commandFailure(error)
  }
  throw redirect(303, branchLocation(branchId, targetId))
}

export default morenaAction
