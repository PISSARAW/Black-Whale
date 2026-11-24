import { FIXED_STEP } from '../../fightClock'
import { decodeFightSnapshot } from '../../fightReplaySnapshot'
import type { FightState } from '../../types'
import type { PvpCommand, PvpView } from '../types'
import { privatePvpState } from '../view'
import {
  CLASH_SOCKET_PATH,
  CLASH_SOCKET_PROTOCOL,
  EXPERIMENTAL_INPUT_DELAY,
  EXPERIMENTAL_MAX_ROLLBACK,
  type ExperimentalRollbackStart,
} from './experimental'
import { RollbackSocketClient, type RollbackSocketLike } from './socketClient'

interface BrowserRollbackOptions {
  start: (epoch: number) => Promise<ExperimentalRollbackStart>
  connect: (epoch: number) => WebSocket
  now: () => number
}

export function createBrowserRollback(options: BrowserRollbackOptions) {
  let client: RollbackSocketClient | null = null
  let epoch: number | undefined
  let starting = false
  let retryAt = 0
  let elapsed = 0
  let pending: PvpCommand[] = []

  function close() {
    epoch = undefined
    starting = false
    client?.close()
    client = null
    elapsed = 0
    retryAt = 0
    pending = []
  }

  async function open(view: PvpView, generation: number) {
    starting = true
    try {
      const seed = await options.start(generation)
      if (epoch !== generation) return
      if (seed.epoch !== generation) throw Error('DIVERGED')
      const initial = decodeFightSnapshot(seed.snapshot, { ...view.setup, mode: 'versus-local' })
      client = new RollbackSocketClient(options.connect(generation) as RollbackSocketLike, {
        initial,
        local: view.side,
        inputDelay: EXPERIMENTAL_INPUT_DELAY,
        maxRollback: EXPERIMENTAL_MAX_ROLLBACK,
        clock: options.now,
      })
      retryAt = options.now() + 750
    } catch {
      retryAt = options.now() + 750
    } finally {
      if (epoch === generation) starting = false
    }
  }

  return {
    synchronize(view: PvpView) {
      const next = view.status === 'playing' ? view.rollback?.epoch : undefined
      if (epoch !== next) {
        close()
        epoch = next
      }
      if (next === undefined || starting || options.now() < retryAt) return
      if (!client || client.status.closeCode !== null) void open(view, next)
    },
    queue(command: PvpCommand) {
      pending.push(command)
    },
    release() {
      pending = []
      client?.release()
    },
    close,
    advance(dt: number, input: number): FightState | null {
      if (!client?.status.open || !client.status.peerConnected) return null
      elapsed += Math.min(dt, FIXED_STEP * 3)
      let advanced = false
      while (elapsed + 1e-8 >= FIXED_STEP) {
        elapsed = Math.max(0, elapsed - FIXED_STEP)
        advanced = client.tick({ input, commands: pending }) || advanced
        pending = []
      }
      if (client.session.desyncFrame !== null) {
        client.close()
        return null
      }
      const { state, side } = client.session
      // Round and match ceremonies use the server's terminal view.
      return advanced && state.phase === 'fighting' ? privatePvpState(state, side) : null
    },
  }
}

export function openBrowserRollback(matchId: string, token: string, epoch: number): WebSocket {
  const url = new URL(CLASH_SOCKET_PATH + encodeURIComponent(matchId), location.origin)
  url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('epoch', String(epoch))
  return new WebSocket(url, [CLASH_SOCKET_PROTOCOL, token])
}
