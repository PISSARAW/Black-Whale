import { get, writable } from 'svelte/store'
import { decodeFightSnapshot } from '../fightReplaySnapshot'
import { fightReplayHash } from '../fightReplayHash'
import { pvpConfigHash } from './config'
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
export function decodePvpView(view: PvpView): FightState {
  if (view.ruleset !== PVP_RULESET) throw Error('VERSION')
  if (view.configHash !== pvpConfigHash(view.setup)) throw Error('DIVERGED')
  const local = view.side === 'player'
  const state = decodeFightSnapshot(view.snapshot, {
    ...view.setup,
    mode: 'versus-ai',
    player: local ? view.setup.player : view.setup.opponent,
    opponent: local ? view.setup.opponent : view.setup.player,
  })
  if (fightReplayHash(state) !== view.snapshotHash) throw Error('DIVERGED')
  return state
}
export function createPvpClient(options: ClientOptions) {
  const store = writable<ClientState>({
    view: null,
    state: null,
    connection: 'connecting',
    ping: null,
    error: '',
  })
  const clock = options.now ?? (() => performance.now())
  const transport = options.fetch
  let token = options.storage?.getItem(pvpSessionKey(options.matchId)) ?? ''
  let pending: PvpCommand[] = [],
    retry: PvpInputPacket | null = null,
    stopped = false
  async function request(body?: unknown): Promise<unknown> {
    const start = clock()
    const response = await transport(options.endpoint, {
      method: body ? 'POST' : 'GET',
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'x-clash-profile': rankingToken(),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(2500),
    })
    const value = await response.json()
    if (!response.ok) throw Error(value.error ?? `HTTP_${response.status}`)
    store.update((current) => ({ ...current, ping: Math.round(clock() - start) }))
    return value
  }
  function accept(view: PvpView) {
    const state = decodePvpView(view)
    store.update((current) => ({ ...current, view, state, connection: 'connected', error: '' }))
    recordOnlineCareer(view)
  }
  function failure(error: unknown) {
    const message = error instanceof Error ? error.message : 'NETWORK'
    const connection = errorConnection(message)
    if (['diverged', 'version'].includes(connection)) {
      pending = []
      retry = null
    }
    store.update((current) => ({ ...current, connection, error: message }))
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

  return {
    subscribe: store.subscribe,
    queue(command: PvpCommand) {
      if (
        get(store).connection === 'connected' &&
        get(store).view?.status === 'playing' &&
        pending.length < 8
      )
        pending.push(command)
    },
    release() {
      pending = []
      retry = null
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
        retry ??= { sequence: current.view.nextSequence, input, commands: pending.splice(0, 8) }
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
    },
  }
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
