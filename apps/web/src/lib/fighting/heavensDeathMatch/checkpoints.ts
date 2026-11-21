import {
  DEATH_MATCH_BEATS,
  DEATH_MATCH_CHAPTERS,
  isDeathMatchBeat,
  type DeathMatchBeat,
  type DeathMatchChapter,
} from './acts'
import type { DeathMatchOptions, DeathMatchState } from './scenario'
import { replayDeathMatch, scriptBefore, scriptBetween } from './script'

/** A checkpoint is the accepted log and the options: the state is always replayed from it. */
export interface DeathMatchCheckpoint {
  version: 1
  chapter: DeathMatchChapter
  options: DeathMatchOptions
  log: DeathMatchState['log']
}

export function checkpointOf(state: DeathMatchState): DeathMatchCheckpoint {
  return { version: 1, chapter: state.chapter, options: state.options, log: state.log }
}

export function encodeCheckpoint(state: DeathMatchState): string {
  return JSON.stringify(checkpointOf(state))
}

/** Replays a saved log; a damaged or foreign save gives null, never a partial state. */
export function decodeCheckpoint(text: string): DeathMatchState | null {
  const value = parse(text)
  if (!validCheckpoint(value)) return null
  const state = replayDeathMatch(value.log, value.options)
  return state.log.length === value.log.length ? state : null
}

function parse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function validCheckpoint(value: unknown): value is DeathMatchCheckpoint {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<DeathMatchCheckpoint>
  if (record.version !== 1 || !Array.isArray(record.log) || !record.options) return false
  return record.log.every(
    (entry) => isDeathMatchBeat(entry?.beat) && Number.isInteger(entry?.frame),
  )
}

/** The canonical state at the very start of a chapter, for "restart from chapter". */
export function chapterCheckpoint(
  chapter: DeathMatchChapter,
  options: Partial<DeathMatchOptions> = {},
): DeathMatchState {
  const first = DEATH_MATCH_BEATS.find((spec) => spec.chapter === chapter)?.id as DeathMatchBeat
  return replayDeathMatch(scriptBefore(first), { ...options, playMode: 'scripted' })
}

export const DEATH_MATCH_CHECKPOINTS = DEATH_MATCH_CHAPTERS

export interface GallerySequence {
  id: string
  titleFr: string
  titleEn: string
  from: DeathMatchBeat
  to: DeathMatchBeat
}

/** Short sequences the gallery can replay on their own. */
export const DEATH_MATCH_GALLERY: readonly GallerySequence[] = [
  {
    id: 'referee',
    titleFr: 'L’arbitre',
    titleEn: 'The referee',
    from: 'referee-marked-black-voice',
    to: 'first-explosion',
  },
  {
    id: 'heads',
    titleFr: 'Les têtes',
    titleEn: 'The heads',
    from: 'puppets-decapitated',
    to: 'double-head-counter',
  },
  {
    id: 'false-chrollo',
    titleFr: 'Le faux Chrollo',
    titleEn: 'The false Chrollo',
    from: 'fake-chrollo-decoy',
    to: 'true-face-revealed',
  },
  {
    id: 'hammer',
    titleFr: 'Le marteau de cinq corps',
    titleEn: 'The five-body hammer',
    from: 'five-body-hammer',
    to: 'hammer-breaks',
  },
  {
    id: 'net',
    titleFr: 'La nasse',
    titleEn: 'The net',
    from: 'puppet-wave',
    to: 'hisoka-asphyxiated',
  },
  {
    id: 'revival',
    titleFr: 'Le cœur repart',
    titleEn: 'The heart restarts',
    from: 'troupe-gathers',
    to: 'machi-bound',
  },
]

/** The state just before the sequence and the events that play it. */
export function gallerySequence(id: string) {
  const sequence = DEATH_MATCH_GALLERY.find((entry) => entry.id === id)
  if (!sequence) return null
  return {
    sequence,
    start: replayDeathMatch(scriptBefore(sequence.from), { playMode: 'scripted' }),
    events: scriptBetween(sequence.from, sequence.to),
  }
}
