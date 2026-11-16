import { get, writable } from 'svelte/store'
import { decodePvpView } from './clientView'
export { decodePvpView } from './clientView'
import { createPvpPrediction } from './prediction'
import { createSnapshotStream } from './snapshotStream'
import type { FightVisualPrediction } from '../fightVisualPrediction'
import {
  PVP_RULESET,
  pvpSessionKey,
  type PvpCommand,
  type PvpInputPacket,
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
  let pending: Array<{ command: PvpCommand; id: number }> = [],
    retry: PvpInputPacket | null = null,
    stopped = false
  let retryIds: number[] = []
  let acceptedAt = 0
  let lastSend = -Infinity
  let lastInput = 0
  let tokens = 3
  let tokenAt = clock()
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
  async function request(body?: unknown): Promise<unknown> {
    const start = clock()
    const response = await transport(options.endpoint, {
      method: body ? 'POST' : 'GET',
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        ...authHeaders(),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(2500),
    })
    const value = await response.json()
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
  function retireReceivedPacket(view: PvpView) {
    if (!retry || view.nextSequence <= retry.sequence) return
    retry = null
    retryIds = []
  }
  function reconcile(state: FightState, view: PvpView) {
    if (view.status === 'playing') {
      prediction.accept(state, view)
      return
    }
    prediction.clear()
    pending = []
    retry = null
    retryIds = []
  }
  function accept(view: PvpView) {
    if (stopped) return
    const current = get(store)
    const state = validatedState(view)
    if (!validEnvelope(view, current)) return
    acceptedAt = clock()
    retireReceivedPacket(view)
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
      pending = []
      retry = null
      retryIds = []
      stream.stop()
    }
    visuals.set(null)
    store.update((current) => ({ ...current, connection, error: message }))
  }
  function packetFor(view: PvpView, input: number) {
    const intents = pending.splice(0, 8)
    const packet = {
      sequence: view.nextSequence,
      input,
      commands: intents.map((intent) => intent.command),
    }
    retryIds = intents.map((intent) => intent.id)
    prediction.sent(packet, retryIds)
    return packet
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

  function urgentInput(input: number) {
    return pending.length > 0 || input !== lastInput
  }
  function transportBusy(current: ClientState) {
    return stopped || Boolean(inFlight) || !current.view || terminalConnection(current)
  }
  const api = {
    subscribe: store.subscribe,
    get visualPrediction() {
      return get(visuals)
    },
    queue(command: PvpCommand) {
      if (
        get(store).connection === 'connected' &&
        get(store).view?.status === 'playing' &&
        pending.length < 8
      )
        pending.push({ command, id: prediction.command(command) })
    },
    release() {
      pending = []
      retry = null
      retryIds = []
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
      if (transportBusy(current) || !current.view) return
      if (current.connection !== 'diverged') stream.start()
      const now = clock()
      tokens = Math.min(3, tokens + Math.max(0, now - tokenAt) * 0.02)
      tokenAt = now
      const urgent = urgentInput(input)
      const interval = current.view.status === 'playing' ? 50 : 250
      if (tokens < 1 || (!urgent && now - lastSend < interval)) return
      tokens--
      lastSend = now
      lastInput = input
      void api.step(input)
    },
    get predictionStats() {
      return { ...prediction.stats, streaming: stream.connected }
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
        if ((!retry && current.connection !== 'connected') || current.view?.status !== 'playing') {
          retry = null
          pending = []
          accept((await request()) as PvpView)
          return
        }
        retry ??= packetFor(current.view, input)
        try {
          accept((await request({ kind: 'input', packet: retry })) as PvpView)
          retry = null
        } catch (error) {
          if (
            error instanceof Error &&
            ['SEQUENCE', 'NOT_PLAYING', 'BUSY'].includes(error.message)
          ) {
            retry = null
            pending = []
            accept((await request()) as PvpView)
          } else throw error
        }
      })
    },
    leave() {
      return exclusive(async () => {
        await request({ kind: 'leave' })
        stopped = true
        stream.stop()
        prediction.clear()
        visuals.set(null)
        pending = []
        retry = null
        store.update((current) => ({
          ...current,
          view: current.view ? { ...current.view, status: 'abandoned' } : null,
        }))
      })
    },
    stop() {
      stopped = true
      pending = []
      retry = null
      retryIds = []
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
