import type { FightSide } from '../types'
import {
  BEAT_REQUIRES,
  DEATH_MATCH_BEATS,
  beatIndex,
  beatSpec,
  isDeathMatchBeat,
  type DeathMatchBeat,
  type DeathMatchChapter,
} from './acts'
import {
  INITIAL_SURVIVAL,
  applyVerdictBeat,
  beatTimingAllowed,
  type MatchVerdict,
  type SurvivalState,
} from './verdict'

/** scripted: replay the canon; semi-free: some beats may be changed; free: any order. */
export type DeathMatchPlayMode = 'scripted' | 'semi-free' | 'free'
export type DeathMatchDifficulty = 'normal' | 'canonical' | 'free'

export interface DeathMatchOptions {
  playMode: DeathMatchPlayMode
  difficulty: DeathMatchDifficulty
  /** Chrollo stays P2 by default; the player may take either side. */
  chrolloSide: FightSide
  /** Hisoka's deduction fragments; off hides them entirely. */
  deductionAssists: boolean
}

export const DEFAULT_DEATH_MATCH_OPTIONS: DeathMatchOptions = {
  playMode: 'scripted',
  difficulty: 'canonical',
  chrolloSide: 'opponent',
  deductionAssists: true,
}

export interface DeathMatchLogEntry {
  beat: DeathMatchBeat
  frame: number
}

export interface DeathMatchState {
  options: DeathMatchOptions
  chapter: DeathMatchChapter
  frame: number
  done: readonly DeathMatchBeat[]
  /** Beats the semi-free player chose to change: skipped and never replayed. */
  divergences: readonly DeathMatchBeat[]
  log: readonly DeathMatchLogEntry[]
  verdict: MatchVerdict | null
  survival: SurvivalState
}

export interface DeathMatchEvent {
  beat: string
  frame: number
}

export function createDeathMatch(options: Partial<DeathMatchOptions> = {}): DeathMatchState {
  return {
    options: { ...DEFAULT_DEATH_MATCH_OPTIONS, ...options },
    chapter: 351,
    frame: 0,
    done: [],
    divergences: [],
    log: [],
    verdict: null,
    survival: INITIAL_SURVIVAL,
  }
}

/** The next canonical beat neither done nor diverged from, or null when the fight is over. */
export function nextCanonicalBeat(state: DeathMatchState): DeathMatchBeat | null {
  const settled = new Set<DeathMatchBeat>([...state.done, ...state.divergences])
  return DEATH_MATCH_BEATS.find((spec) => !settled.has(spec.id))?.id ?? null
}

export function deathMatchComplete(state: DeathMatchState): boolean {
  return nextCanonicalBeat(state) === null
}

/** Accepts one beat, or returns the very same state when the mode or causality refuses it. */
export function advanceDeathMatch(state: DeathMatchState, event: DeathMatchEvent): DeathMatchState {
  if (!isDeathMatchBeat(event.beat) || event.frame < state.frame) return state
  const beat = event.beat
  if (state.done.includes(beat) || state.divergences.includes(beat)) return state
  if (!requirementsMet(state, beat)) return state
  const skipped = skippedBeats(state, beat)
  if (skipped === null) return state
  const context = {
    verdict: state.verdict,
    survival: state.survival,
    chrolloSide: chrolloOf(state),
  }
  const timed = { beat, frame: event.frame }
  if (!beatTimingAllowed(context, timed)) return state
  const settled = applyVerdictBeat(context, timed)
  return {
    ...state,
    chapter: laterChapter(state.chapter, beatSpec(beat).chapter),
    frame: event.frame,
    done: [...state.done, beat],
    divergences: [...state.divergences, ...skipped],
    log: [...state.log, timed],
    verdict: settled.verdict,
    survival: settled.survival,
  }
}

function chrolloOf(state: DeathMatchState): FightSide {
  return state.options.chrolloSide
}

function requirementsMet(state: DeathMatchState, beat: DeathMatchBeat): boolean {
  return (BEAT_REQUIRES[beat] ?? []).every((required) => state.done.includes(required))
}

/** Beats jumped over by accepting `beat`; null refuses it for the current play mode. */
function skippedBeats(state: DeathMatchState, beat: DeathMatchBeat): DeathMatchBeat[] | null {
  const expected = nextCanonicalBeat(state)
  if (beat === expected) return []
  const mode = state.options.playMode
  if (mode === 'free') return []
  if (mode === 'scripted' || expected === null) return null
  const settled = new Set<DeathMatchBeat>([...state.done, ...state.divergences])
  const between = DEATH_MATCH_BEATS.slice(beatIndex(expected), beatIndex(beat))
    .map((spec) => spec.id)
    .filter((id) => !settled.has(id))
  if (between.length === 0) return null
  return between.every((id) => beatSpec(id).branchable) ? between : null
}

function laterChapter(current: DeathMatchChapter, next: DeathMatchChapter): DeathMatchChapter {
  return next > current ? next : current
}
