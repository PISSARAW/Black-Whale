import type { DeathMatchBeat, DeathMatchChapter } from './acts'
import { chapterCheckpoint, DEATH_MATCH_GALLERY } from './checkpoints'
import { frontierBeat } from './chrolloPlan/phases'
import type { DeathMatchWorld } from './chrolloPlan/world'
import type { DeathMatchOptions } from './scenario'

export type HistoricalStart = { chapter: DeathMatchChapter } | { sequence: string }

export interface HistoricalStartRequest {
  start: HistoricalStart
  options: DeathMatchOptions
}

export function historicalWindow(
  start: HistoricalStart,
): { from: DeathMatchBeat; to?: DeathMatchBeat } | null {
  if ('chapter' in start) {
    const from = frontierBeat(chapterCheckpoint(start.chapter))
    return from ? { from } : null
  }
  const sequence = DEATH_MATCH_GALLERY.find(({ id }) => id === start.sequence)
  return sequence ? { from: sequence.from, to: sequence.to } : null
}

export function historicalSequenceFinished(world: DeathMatchWorld | undefined): boolean {
  return Boolean(world?.sequenceEnd && world.scenario.done.includes(world.sequenceEnd))
}
