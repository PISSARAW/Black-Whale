import { get, writable } from 'svelte/store'
import { createReplayRecorder, type FightReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { loadFightReplays, saveFightReplay, deleteFightReplay } from './fightReplayStorage'
import type { FightReplay, ReplayPacket, SavedFightReplay } from './fightReplayTypes'
import type { FightState } from './types'
import { canPracticeReplay, practiceReplay } from './fightReplayPractice'

export interface ReplayView {
  library: SavedFightReplay[]
  recording: boolean
  packets: number
  captureIssue: string
  status: string
  practice: { id: string; packet: number } | null
  playback: {
    id: string
    elapsed: number
    duration: number
    running: boolean
    speed: number
    finished: boolean
    error: string
    packet: number
    packets: number
    seeking: boolean
    canPractice: boolean
  } | null
}
const initial: ReplayView = {
  library: [],
  recording: false,
  packets: 0,
  captureIssue: '',
  status: '',
  practice: null,
  playback: null,
}
export function createFightReplayController() {
  const view = writable<ReplayView>({ ...initial })
  let recorder: FightReplayRecorder | null = null
  let player: ReturnType<typeof createReplayPlayer> | null = null
  let source: SavedFightReplay | null = null
  let suspended: FightState | null = null
  let sequence = 0
  let rehearsal = false
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
    if (rehearsal) {
      status('practice')
      return null
    }
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
    rehearsal = false
    view.update((value) => ({
      ...value,
      recording: Boolean(recorder),
      packets: 0,
      captureIssue: '',
      playback: null,
      practice: null,
      status: '',
    }))
  }
  return {
    subscribe: view.subscribe,
    begin,
    get active() {
      return player !== null && !rehearsal
    },
    get practicing() {
      return rehearsal
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
      rehearsal = false
      player = next
      source = entry
      view.update((value) => ({
        ...value,
        status: '',
        practice: null,
        playback: {
          id,
          elapsed: 0,
          duration: entry.replay.duration,
          running: true,
          speed: 1,
          finished: false,
          error: '',
          packet: 0,
          packets: entry.replay.packets.length,
          seeking: false,
          canPractice: canPracticeReplay(player!.state),
        },
      }))
      return player.state
    },
    advance(dt: number): FightState | null {
      const playback = get(view).playback
      if (!player || !playback) return null
      const state =
        playback.running || player.seeking ? player.advance(dt, playback.speed) : player.state
      view.update((value) => ({
        ...value,
        playback: {
          ...playback,
          elapsed: player!.elapsed,
          finished: player!.done,
          running: playback.running && !player!.done,
          error: player!.error,
          packet: player!.cursor,
          seeking: player!.seeking,
          canPractice: !player!.error && !player!.seeking && canPracticeReplay(state),
        },
      }))
      return state
    },
    toggle() {
      view.update((value) => ({
        ...value,
        playback: value.playback
          ? {
              ...value.playback,
              running:
                !value.playback.running && !value.playback.finished && !value.playback.seeking,
            }
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
    seek(packet: number): FightState | null {
      if (!player || rehearsal || !player.seek(packet)) return null
      view.update((value) => ({
        ...value,
        playback: value.playback ? { ...value.playback, running: false } : null,
      }))
      return this.advance(0)
    },
    takeover(): FightState | null {
      if (!player || !source || player.error || player.seeking || rehearsal) return null
      const state = practiceReplay(player.state, source.id, player.cursor)
      if (!state) return null
      rehearsal = true
      view.update((value) => ({
        ...value,
        playback: null,
        practice: { id: source!.id, packet: player!.cursor },
      }))
      return state
    },
    repeatPractice(): FightState | null {
      return rehearsal && player && source
        ? practiceReplay(player.state, source.id, player.cursor)
        : null
    },
    returnToReplay(): FightState | null {
      if (!rehearsal || !source || !player) return null
      rehearsal = false
      view.update((value) => ({
        ...value,
        practice: null,
        playback: {
          id: source!.id,
          elapsed: player!.elapsed,
          duration: source!.replay.duration,
          running: false,
          speed: 1,
          finished: player!.done,
          error: player!.error,
          packet: player!.cursor,
          packets: source!.replay.packets.length,
          seeking: false,
          canPractice: canPracticeReplay(player!.state),
        },
      }))
      return player.state
    },
    restart(): FightState | null {
      if (!source || !player || rehearsal) return null
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
              packet: 0,
              seeking: false,
              canPractice: canPracticeReplay(player!.state),
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
      rehearsal = false
      view.update((value) => ({ ...value, playback: null, practice: null }))
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
