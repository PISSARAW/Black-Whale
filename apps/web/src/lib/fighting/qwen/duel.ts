import { writable } from 'svelte/store'
import { EMPTY_INPUT, type FightSide, type FightState } from '../types'
import { observeCombat, supportsQwenDuel } from './observation'
import { createFastController } from './execution'
import { FALLBACK_PLAN, parseTacticalPlan, QWEN_DEADLINE_MS, QWEN_PLAN_TTL_MS } from './protocol'
import { createPerceptionHistory } from './perceptionHistory'
import type { CombatObservation, TacticalPlan, TacticalReply } from './protocol'
import { allowedNen } from './catalogue'

export interface QwenStatus {
  enabled: boolean
  control: 'both' | 'opponent'
  /** Model that produced the latest accepted plan of each seat. */
  models: Record<FightSide, string | null>
  pending: FightSide | null
  accepted: number
  failures: number
  stale: number
  plans: Record<FightSide, TacticalPlan | null>
  source: Record<FightSide, 'qwen' | 'local'>
}
export type QwenTransport = (
  observation: CombatObservation,
  signal: AbortSignal,
  seat: FightSide,
) => Promise<TacticalReply | null>
async function postPlan(observation: CombatObservation, signal: AbortSignal, seat: FightSide) {
  const response = await fetch(`/fighting/qwen?seat=${seat}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(observation),
    signal,
  })
  return response.ok ? response.json() : null
}

/** Async strategy never blocks a simulation tick. Seats may use different models, one executor. */
export function createQwenDuel(options: { clock?: () => number; transport?: QwenTransport } = {}) {
  const clock = options.clock ?? (() => performance.now())
  const transport = options.transport ?? postPlan
  const initial = (): QwenStatus => ({
    enabled: false,
    control: 'both',
    models: { player: null, opponent: null },
    pending: null,
    accepted: 0,
    failures: 0,
    stale: 0,
    plans: { player: null, opponent: null },
    source: { player: 'local', opponent: 'local' },
  })
  let status = initial()
  const view = writable(status)
  const createControllers = () => ({
    player: createFastController('player', 73),
    opponent: createFastController('opponent', 97),
  })
  let controllers = createControllers()
  const timestamps = { player: -Infinity, opponent: -Infinity }
  const history: { side: FightSide; frame: number; reply: TacticalReply }[] = []
  const perception = createPerceptionHistory()
  let epoch = 0
  let round = 0
  let due = 0
  let next: FightSide = 'player'
  let abort: AbortController | null = null
  const publish = () =>
    view.set({
      ...status,
      models: { ...status.models },
      plans: { ...status.plans },
      source: { ...status.source },
    })
  function cancel() {
    epoch++
    abort?.abort()
    abort = null
    status.pending = null
  }
  function setEnabled(enabled: boolean, control: QwenStatus['control'] = 'both') {
    cancel()
    status = { ...initial(), enabled, control }
    controllers = createControllers()
    timestamps.player = timestamps.opponent = -Infinity
    due = 0
    next = control === 'opponent' ? 'opponent' : 'player'
    round = 0
    history.length = 0
    perception.reset()
    publish()
  }
  function accept(
    reply: TacticalReply | null,
    request: { side: FightSide; epoch: number; at: number; observation: CombatObservation },
  ) {
    if (request.epoch !== epoch) return
    status.pending = null
    if (!reply) {
      status.failures++
      publish()
      return
    }
    const plan = parseTacticalPlan(
      reply.plan,
      [
        ...request.observation.moves.map((move) => move.slot),
        ...(request.observation.utilities ?? []).map((utility) => utility.key),
      ],
      allowedNen(request.observation.fighter),
    )
    if (!plan || typeof reply.model !== 'string' || typeof reply.requestId !== 'string') {
      status.failures++
      publish()
      return
    }
    if (clock() - request.at > QWEN_DEADLINE_MS) {
      status.stale++
      publish()
      return
    }
    status.plans[request.side] = plan
    timestamps[request.side] = clock()
    status.models[request.side] = reply.model
    status.accepted++
    history.push({
      side: request.side,
      frame: request.observation.frame,
      reply: { ...reply, plan },
    })
    if (history.length > 200) history.shift()
    publish()
  }
  function poll(state: FightState) {
    if (status.pending || clock() < due) return
    const side = next
    next = status.control === 'opponent' ? 'opponent' : side === 'player' ? 'opponent' : 'player'
    due = clock() + 1600
    abort = new AbortController()
    const observation = observeCombat(state, side)
    observation.recent = perception.read(side)
    const request = { side, epoch, at: clock(), observation }
    status.pending = side
    publish()
    const controller = abort
    const timeout = setTimeout(() => controller.abort(), QWEN_DEADLINE_MS)
    void transport(observation, abort.signal, side)
      .then(
        (reply) => accept(reply, request),
        () => accept(null, request),
      )
      .finally(() => clearTimeout(timeout))
  }
  function step(state: FightState) {
    if (!status.enabled || !supportsQwenDuel(state) || state.phase !== 'fighting') return null
    if (round !== state.roundNumber) {
      cancel()
      round = state.roundNumber
      due = 0
      status.plans = { player: null, opponent: null }
      timestamps.player = timestamps.opponent = -Infinity
      perception.reset()
    }
    perception.observe(state)
    poll(state)
    const decisions = (['player', 'opponent'] as const).map((side) => {
      if (status.control === 'opponent' && side === 'player')
        return { input: undefined, command: undefined, utility: undefined }
      if (status.control === 'both' && status.pending === side) return { input: EMPTY_INPUT }
      const fresh = clock() - timestamps[side] <= QWEN_PLAN_TTL_MS
      status.source[side] = fresh ? 'qwen' : 'local'
      return controllers[side](state, fresh ? status.plans[side]! : FALLBACK_PLAN)
    })
    publish()
    return {
      player: decisions[0].input,
      opponent: decisions[1].input,
      commands: decisions.flatMap((decision) => (decision.command ? [decision.command] : [])),
      utilities: decisions.flatMap((decision) => (decision.utility ? [decision.utility] : [])),
    }
  }
  return {
    subscribe: view.subscribe,
    setEnabled,
    step,
    get enabled() {
      return status.enabled
    },
    get evidence() {
      return [...history]
    },
    reset: () => setEnabled(false),
    dispose: () => setEnabled(false),
  }
}
export type QwenDuel = ReturnType<typeof createQwenDuel>
