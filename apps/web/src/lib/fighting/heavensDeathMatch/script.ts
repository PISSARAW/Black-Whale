import { FIGHT_FPS } from '../fightClock'
import { DEATH_MATCH_BEATS, type DeathMatchBeat } from './acts'
import {
  advanceDeathMatch,
  createDeathMatch,
  type DeathMatchLogEntry,
  type DeathMatchOptions,
  type DeathMatchState,
} from './scenario'
import { RESCUE_DELAY_FRAMES } from './verdict'

/** Default narrative gap before a beat; the longer pauses are named below. */
const DEFAULT_GAP_SECONDS = 8
const GAP_SECONDS: Partial<Record<DeathMatchBeat, number>> = {
  'floor-masters-enter': 0,
  'gallery-fake-copies': 20,
  'puppet-wave': 15,
  'max-charge-during-feint': 5,
}

function gapFrames(beat: DeathMatchBeat): number {
  if (beat === 'rescue-arrives') return RESCUE_DELAY_FRAMES
  return (GAP_SECONDS[beat] ?? DEFAULT_GAP_SECONDS) * FIGHT_FPS
}

function buildCanonicalScript(): readonly DeathMatchLogEntry[] {
  let frame = 0
  return DEATH_MATCH_BEATS.map(({ id }) => {
    frame += gapFrames(id)
    return { beat: id, frame }
  })
}

/** The deterministic reference replay: every beat, in canonical order, at a fixed frame. */
export const CANONICAL_SCRIPT: readonly DeathMatchLogEntry[] = buildCanonicalScript()

export function replayDeathMatch(
  events: readonly DeathMatchLogEntry[],
  options: Partial<DeathMatchOptions> = {},
): DeathMatchState {
  return events.reduce(advanceDeathMatch, createDeathMatch(options))
}

/** Canonical events strictly before `beat` (the whole script when it is not found). */
export function scriptBefore(beat: DeathMatchBeat): readonly DeathMatchLogEntry[] {
  const index = CANONICAL_SCRIPT.findIndex((entry) => entry.beat === beat)
  return index < 0 ? CANONICAL_SCRIPT : CANONICAL_SCRIPT.slice(0, index)
}

/** Canonical events from `from` to `to`, both included. */
export function scriptBetween(from: DeathMatchBeat, to: DeathMatchBeat): DeathMatchLogEntry[] {
  const start = CANONICAL_SCRIPT.findIndex((entry) => entry.beat === from)
  const end = CANONICAL_SCRIPT.findIndex((entry) => entry.beat === to)
  return start < 0 || end < start ? [] : CANONICAL_SCRIPT.slice(start, end + 1)
}

/** FNV-1a over the accepted log: two identical runs must produce the same digest. */
export function deathMatchDigest(state: DeathMatchState): string {
  let hash = 0x811c9dc5
  const text = state.log.map((entry) => `${entry.beat}@${entry.frame}`).join('|')
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}
