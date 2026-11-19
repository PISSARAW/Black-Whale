import { bonolenovMusicPhrase } from '../../src/lib/fighting/audio/bonolenov'
import type { FightState } from '../../src/lib/fighting/types'

/**
 * Sound the game itself makes from the hero's body, sampled per output frame for the
 * soundtrack: Bonolenov's body-instrument phrase (same function, same gating as the live
 * mixer) and the beat of an existing Jupiter (one cue per 15 simulated frames).
 */
export function bodyVoice(state: FightState): [number, number, number] | null {
  if (state.phase !== 'fighting' || state.hitstop > 0) return null
  const phrase = bonolenovMusicPhrase(state.player)
  if (!phrase) return null
  const pan = Math.max(-1, Math.min(1, (state.player.x - 50) / 75))
  return [+phrase.hz.toFixed(2), +phrase.level.toFixed(4), +pan.toFixed(3)]
}

/** The Jupiter beat index while the hero's Jupiter sounds, otherwise null. */
export function jupiterBeat(state: FightState): number | null {
  const sounding = state.projectiles.some((shot) => shot.jupiter && shot.owner === 'player')
  return sounding ? Math.floor(state.frame / 15) : null
}
