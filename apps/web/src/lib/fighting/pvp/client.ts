import { get, writable } from 'svelte/store'
import { decodePvpView } from './clientView'
export { decodePvpView } from './clientView'
import { createPvpPrediction } from './prediction'
import { createSnapshotStream } from './snapshotStream'
import { createInputPipeline } from './inputPipeline'
import { record, boundedInteger } from './protocol'
import type { FightVisualPrediction } from '../fightVisualPrediction'
import {
  PVP_RULESET,
  pvpSessionKey,
  type PvpCommand,
  type PvpInputReceipt,
  type PvpSession,
  type PvpView,
} from './types'
import type { FightState } from '../types'
import { rankingToken } from '../career/ranking'
import { recordOnlineCareer } from '../career/online'

interface ClientState {
  view: PvpView | null
  state: FightState | null
  connection: 'connecting' | 'connected' | 'reconnecting' | 'diverged' | 'error' | 'version'
  ping: number | null
  error: string
}
interface ClientOptions {
  matchId: string
  endpoint: string
  invitation?: string
  fetch: typeof fetch
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  now?: () => number
}
export function createPvpClient(options: ClientOptions) {
  const store = writable<ClientState>({
    view: null,
    state: null,
    connection: 'connecting',
    ping: null,
    error: '',
  })
  const visuals = writable<FightVisualPrediction | null>(null)
  const clock = options.now ?? (() => performance.now())
  const transport = options.fetch
  let token = options.storage?.getItem(pvpSessionKey(options.matchId)) ?? ''
  const prediction = createPvpPrediction(clock)
  let stopped = false
  let acceptedAt = 0
  let polledAt = -Infinity
  const pipeline = createInputPipeline({
    now: clock,
    send: async (packets, signal) => {
      const receipt = await request(
        { kind: 'inputs', round: get(store).state?.roundNumber, packets },
        signal,
      )
      acceptReceipt(receipt)
    },
    sent: (packet, ids) => prediction.sent(packet, ids),
    failed: inputFailure,
  })
  const authHeaders = () => ({
    authorization: `Bearer ${token}`,
    'x-clash-profile': rankingToken(),
  })
  const stream = createSnapshotStream({
    endpoint: options.endpoint,
    fetch: transport,
    headers: authHeaders,
    accept,
    failed: streamFailure,
    now: clock,
  })
  async function request(body?: unknown, signal?: AbortSignal): Promise<unknown> {
    const start = clock()
    const response = await transport(options.endpoint, {
      method: body ? 'POST' : 'GET',
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        ...authHeaders(),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(2500)])
        : AbortSignal.timeout(2500),
    })
    const value = await response.json()
    signal?.throwIfAborted()
    if (!response.ok) throw Error(value.error ?? `HTTP_${response.status}`)
    if (!stopped) store.update((current) => ({ ...current, ping: Math.round(clock() - start) }))
    return value
  }
  function validEnvelope(view: PvpView, current: ClientState) {
    if (view.matchId !== options.matchId) throw Error('DIVERGED')
    if (!current.view) return true
    if (view.revision <= current.view.revision) return false
    if (view.side !== current.view.side || view.tick < current.view.tick) throw Error('DIVERGED')
    return true
  }
  function acceptReceipt(value: unknown) {
    const view = get(store).view
    if (!record(value) || !view || value.matchId !== options.matchId || value.side !== view.side)
      throw Error('DIVERGED')
    if (!boundedInteger(value.nextSequence, pipeline.stats.nextSequence)) throw Error('DIVERGED')
    if (value.round !== get(store).state?.roundNumber) throw Error('DIVERGED')
    pipeline.acknowledge((value as unknown as PvpInputReceipt).nextSequence)
  }
  function reconcile(state: FightState, view: PvpView) {
    if (view.status === 'playing') {
      if (get(store).state?.roundNumber !== state.roundNumber) pipeline.reset(view.nextSequence)
      pipeline.acknowledge(view.nextSequence)
      prediction.accept(state, view)
      return
    }
    prediction.clear()
    pipeline.reset(view.nextSequence)
  }
  function accept(view: PvpView) {
    if (stopped) return
    const current = get(store)
    const state = validatedState(view)
    if (!validEnvelope(view, current)) return
    acceptedAt = clock()
    reconcile(state, view)
    visuals.set(prediction.current)
    store.update((value) => ({
      ...value,
      view,
      state,
      connection: 'connected',
      error: '',
    }))
    recordOnlineCareer(view)
    if (['finished', 'abandoned'].includes(view.status)) stream.stop()
  }
  function streamFailure(error: unknown) {
    const code = error instanceof Error ? error.message : 'NETWORK'
    if (['DIVERGED', 'VERSION'].includes(code) || clock() - acceptedAt > 250) failure(error)
  }
  function failure(error: unknown) {
    if (stopped) return
    const message = error instanceof Error ? error.message : 'NETWORK'
    const connection = errorConnection(message)
    if (connection === 'reconnecting' && stream.connected && clock() - acceptedAt < 250) return
    prediction.clear()
    if (['diverged', 'version', 'error'].includes(connection)) {
      pipeline.reset(get(store).view?.nextSequence ?? 0)
      stream.stop()
    }
    visuals.set(null)
    store.update((current) => ({ ...current, connection, error: message }))
  }
  function inputFailure(error: unknown) {
    const code = error instanceof Error ? error.message : ''
    if (['SEQUENCE', 'NOT_PLAYING', 'BUSY'].includes(code)) {
      // Keep immutable unreceived commands: a view reconciles any accepted prefix.
      void refresh()
      return
    }
    failure(error)
  }
  function refresh() {
    if (inFlight) return inFlight
    polledAt = clock()
    return exclusive(async () => accept((await request()) as PvpView))
  }
  function needsPolling(current: ClientState) {
    return !stream.connected || current.connection !== 'connected' || clock() - acceptedAt > 250
  }
  let inFlight: Promise<void> | null = null
  function exclusive(action: () => Promise<void>): Promise<void> {
    if (stopped) return Promise.resolve()
    if (inFlight) return inFlight.then(() => exclusive(action))
    inFlight = action()
      .catch(failure)
      .finally(() => {
        inFlight = null
      })
    return inFlight
  }

  const api = {
    subscribe: store.subscribe,
    get visualPrediction() {
      return get(visuals)
    },
    queue(command: PvpCommand) {
      const intent = { ...command }
      if (get(store).connection === 'connected' && get(store).view?.status === 'playing')
        pipeline.queue(intent, () => prediction.command(intent))
    },
    release() {
      pipeline.release()
      prediction.clear()
      visuals.set(null)
    },
    advance(dt: number, input: number) {
      const current = get(store)
      if (stopped || current.connection !== 'connected' || current.view?.status !== 'playing')
        return
      visuals.set(prediction.advance(dt, input))
    },
    pump(input: number) {
      const current = get(store)
      if (stopped || terminalConnection(current) || !current.view) return
      if (current.connection !== 'diverged') stream.start()
      if (current.connection === 'connected' && current.view.status === 'playing')
        void pipeline.send(input)
      const interval = current.view.status === 'playing' ? 100 : 250
      if (needsPolling(current) && clock() - polledAt >= interval) void refresh()
    },
    get predictionStats() {
      return { ...prediction.stats, streaming: stream.connected, transport: pipeline.stats }
    },
    join() {
      return exclusive(async () => {
        if (!token) {
          const session = (await request({
            kind: 'join',
            ruleset: PVP_RULESET,
            invitation: options.invitation ?? '',
          })) as PvpSession
          token = session.token
          options.storage?.setItem(pvpSessionKey(options.matchId), token)
        }
        accept((await request()) as PvpView)
      })
    },
    ready() {
      return exclusive(async () => {
        const view = get(store).view
        if (view)
          accept(
            (await request({
              kind: 'ready',
              ruleset: PVP_RULESET,
              configHash: view.configHash,
            })) as PvpView,
          )
      })
    },
    step(input: number) {
      return exclusive(async () => {
        const current = get(store)
        if (terminalConnection(current)) return
        if (current.view?.status === 'playing' && current.connection !== 'diverged')
          await pipeline.send(input, true)
        if (!stream.connected || current.connection !== 'connected')
          accept((await request()) as PvpView)
      })
    },
    leave() {
      return exclusive(async () => {
        await request({ kind: 'leave' })
        stopped = true
        stream.stop()
        prediction.clear()
        visuals.set(null)
        pipeline.stop()
        store.update((current) => ({
          ...current,
          view: current.view ? { ...current.view, status: 'abandoned' } : null,
        }))
      })
    },
    stop() {
      stopped = true
      pipeline.stop()
      prediction.clear()
      visuals.set(null)
      stream.stop()
    },
  }
  return api
}
function terminalConnection(current: ClientState) {
  return (
    ['version', 'error'].includes(current.connection) ||
    ['finished', 'abandoned'].includes(current.view?.status ?? '')
  )
}
function errorConnection(message: string): ClientState['connection'] {
  if (message === 'VERSION') return 'version'
  if (message === 'DIVERGED') return 'diverged'
  if (['FULL', 'UNAUTHORIZED', 'NOT_FOUND', 'INVITATION'].includes(message)) return 'error'
  return 'reconnecting'
}
export type PvpClient = ReturnType<typeof createPvpClient>

function validatedState(view: PvpView) {
  try {
    return decodePvpView(view)
  } catch (error) {
    if (error instanceof Error && error.message === 'VERSION') throw error
    throw Error('DIVERGED')
  }
}
