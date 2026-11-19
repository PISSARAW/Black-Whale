import { selectVictory } from '../../src/lib/fighting/victory/catalogue'
import { VICTORY_DURATION } from '../../src/lib/fighting/victory/catalogue'
import type { VictoryFrame } from '../../src/lib/fighting/victory/playback'
import type { Segment } from './reel'

/**
 * The victory film a segment asks for at simulation frame `sim`. The selection comes from
 * the engine's own verdict on the KO frame, so the cinematic keeps one identity while its
 * clock follows the shot's keys instead of wall time.
 */
export function filmAt(
  segment: Pick<Segment, 'victory' | 'states'>,
  sim: number,
): VictoryFrame | null {
  const keys = segment.victory
  if (!keys?.length) return null
  const key = keys.findLast((entry) => entry.at <= sim)
  if (!key) return null
  const selection = selectVictory(segment.states[Math.max(0, keys[0].at)])
  if (!selection) return null
  const duration = selection.duration ?? VICTORY_DURATION
  const elapsed = Math.min(duration - 1e-3, key.elapsed + (sim - key.at) / 60)
  return { ...selection, elapsed, active: true }
}
