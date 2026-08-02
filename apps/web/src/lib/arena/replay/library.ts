import { parseReplay, serializeReplay } from './codec'
import { eventsFromReplay } from './player'
import type { ArenaReplay } from './types'

export const REPLAY_LIBRARY_KEY = 'black-whale:arena-replay-library-v3'
export const REPLAY_LIBRARY_LIMIT = 20

export interface ReplayStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface ReplayComparison {
  durationDelta: number
  commandDelta: number
  hitDelta: number
  auraDelta: number
}

export function loadReplayLibrary(storage: ReplayStorage): ArenaReplay[] {
  try {
    const entries = JSON.parse(storage.getItem(REPLAY_LIBRARY_KEY) ?? '[]') as string[]
    return entries.map(parseReplay)
  } catch {
    return []
  }
}

export function saveReplayToLibrary(storage: ReplayStorage, replay: ArenaReplay): ArenaReplay[] {
  const next = [
    replay,
    ...loadReplayLibrary(storage).filter(({ checksum }) => checksum !== replay.checksum),
  ].slice(0, REPLAY_LIBRARY_LIMIT)
  storage.setItem(REPLAY_LIBRARY_KEY, JSON.stringify(next.map(serializeReplay)))
  return next
}

export function compareReplays(reference: ArenaReplay, challenger: ArenaReplay): ReplayComparison {
  const hits = (replay: ArenaReplay) =>
    eventsFromReplay(replay).filter(
      (event) => event.attacker === 'player' && !['miss', 'blocked'].includes(event.impact),
    ).length
  const auraSpent = (replay: ArenaReplay) =>
    replay.commands.filter(({ action }) => action.type === 'HATSU' || action.type === 'KO').length
  return {
    durationDelta: (challenger.ticks - reference.ticks) / reference.tickRate,
    commandDelta: challenger.commands.length - reference.commands.length,
    hitDelta: hits(challenger) - hits(reference),
    auraDelta: auraSpent(challenger) - auraSpent(reference),
  }
}

export function challengeSeed(replay: ArenaReplay): number {
  return Number.parseInt(replay.checksum.slice(0, 8), 16) >>> 0
}
