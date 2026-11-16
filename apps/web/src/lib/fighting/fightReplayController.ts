import { get, writable } from 'svelte/store'
import { createReplayRecorder, type FightReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { loadFightReplays, saveFightReplay, deleteFightReplay } from './fightReplayStorage'
import type { FightReplay, ReplayPacket, SavedFightReplay } from './fightReplayTypes'
import type { FightState } from './types'

export interface ReplayView {
  library: SavedFightReplay[]
  recording: boolean
  packets: number
  captureIssue: string
  status: string
  playback: {
    id: string
    elapsed: number
    duration: number
    running: boolean
    speed: number
    finished: boolean
    error: string
  } | null
}
const initial: ReplayView = {
  library: [],
  recording: false,
  packets: 0,
  captureIssue: '',
  status: '',
  playback: null,
}
export function createFightReplayController() {
  const view = writable<ReplayView>({ ...initial })
  let recorder: FightReplayRecorder | null = null
  let player: ReturnType<typeof createReplayPlayer> | null = null
  let source: SavedFightReplay | null = null
  let suspended: FightState | null = null
  let sequence = 0
  const status = (message: string) => view.update((value) => ({ ...value, status: message }))
  async function remember(replay: FightReplay): Promise<SavedFightReplay> {
    const entry = { id: `${Date.now().toString(36)}-${++sequence}`, createdAt: Date.now(), replay }
    view.update((value) => ({
      ...value,
      library: [entry, ...value.library].slice(0, 5),
      status: 'saved',
    }))
    try {
      await saveFightReplay(entry)
    } catch {
      status('storage')
    }
    return entry
  }
  async function save() {
    const replay = recorder?.snapshot()
    if (!replay) {
      status('empty')
      return null
    }
    return remember(replay)
  }
  function begin(state: FightState | null) {
    recorder = state ? createReplayRecorder(state) : null
    player = null
    source = null
    suspended = null
    view.update((value) => ({
      ...value,
      recording: Boolean(recorder),
      packets: 0,
      captureIssue: '',
      playback: null,
      status: '',
    }))
  }
  return {
    subscribe: view.subscribe,
    begin,
    get active() {
      return player !== null
    },
    async load() {
      try {
        const entries = await loadFightReplays()
        view.update((value) => ({
          ...value,
          library: [
            ...new Map([...entries, ...value.library].map((entry) => [entry.id, entry])).values(),
          ]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5),
        }))
      } catch {
        status('storage')
      }
    },
    append(before: FightState, packet: ReplayPacket, after: FightState) {
      if (!recorder || player) return
      recorder.append(before, packet, after)
      if (recorder.error || recorder.count % 30 === 0)
        view.update((value) => ({
          ...value,
          recording: !recorder!.error,
          packets: recorder!.count,
          captureIssue: recorder!.error,
        }))
      if (after.matchWinner && !before.matchWinner) void save()
    },
    invalidate() {
      recorder?.invalidate()
      if (recorder)
        view.update((value) => ({ ...value, recording: false, captureIssue: 'untracked' }))
    },
    save,
    open(id: string, current: FightState | null): FightState | null {
      const entry = get(view).library.find((item) => item.id === id)
      if (!entry) return current
      let next: ReturnType<typeof createReplayPlayer>
      try {
        next = createReplayPlayer(entry.replay)
      } catch {
        status('invalid')
        return current
      }
      if (next.error) {
        status('divergence')
        return current
      }
      if (!player) suspended = current
      player = next
      source = entry
      view.update((value) => ({
        ...value,
        status: '',
        playback: {
          id,
          elapsed: 0,
          duration: entry.replay.duration,
          running: true,
          speed: 1,
          finished: false,
          error: '',
        },
      }))
      return player.state
    },
    advance(dt: number): FightState | null {
      const playback = get(view).playback
      if (!player || !playback) return null
      const state = playback.running ? player.advance(dt, playback.speed) : player.state
      view.update((value) => ({
        ...value,
        playback: {
          ...playback,
          elapsed: player!.elapsed,
          finished: player!.done,
          running: playback.running && !player!.done,
          error: player!.error,
        },
      }))
      return state
    },
    toggle() {
      view.update((value) => ({
        ...value,
        playback: value.playback
          ? { ...value.playback, running: !value.playback.running && !value.playback.finished }
          : null,
      }))
    },
    speed(value: number) {
      if (![0.5, 1, 2].includes(value)) return
      view.update((current) => ({
        ...current,
        playback: current.playback ? { ...current.playback, speed: value } : null,
      }))
    },
    restart(): FightState | null {
      if (!source || !player) return null
      player = createReplayPlayer(source.replay)
      view.update((value) => ({
        ...value,
        playback: value.playback
          ? {
              ...value.playback,
              elapsed: 0,
              finished: false,
              error: player!.error,
              running: !player!.error,
            }
          : null,
      }))
      return player.state
    },
    close(): FightState | null {
      const restored = suspended
      player = null
      source = null
      suspended = null
      view.update((value) => ({ ...value, playback: null }))
      return restored
    },
    async import(text: string) {
      try {
        return await remember(decodeFightReplay(text))
      } catch (error) {
        status(error instanceof Error && error.message === 'replay-version' ? 'version' : 'invalid')
        return null
      }
    },
    async remove(id: string) {
      try {
        await deleteFightReplay(id)
      } catch {
        status('storage')
      }
      view.update((value) => ({
        ...value,
        library: value.library.filter((entry) => entry.id !== id),
      }))
    },
  }
}
export type FightReplayController = ReturnType<typeof createFightReplayController>
