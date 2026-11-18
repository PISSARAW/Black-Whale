import { bonolenovBodyMoving, bonolenovInstrumentExposed } from '../bonolenovInstrument'
import type { ArcadeFighter, FightState } from '../types'
import { continuousVoice, type FightMix } from './mixer'

/** Authored body-instrument phrase, not an anime soundtrack recording. */
export function bonolenovMusicPhrase(fighter: ArcadeFighter) {
  if (!bonolenovInstrumentExposed(fighter) || !bonolenovBodyMoving(fighter)) return null
  const preparation = fighter.battleCantabile?.preparation
  const dash = fighter.motion?.dash
  const beat = preparation
    ? (preparation.total - preparation.remaining) / 8
    : dash
      ? dash.frame / 3
      : fighter.attack
        ? fighter.attack.frame / 5
        : Math.abs(fighter.x * 0.8) + fighter.y * 0.3
  const note = [0, 7, 10, 5, 12, 10, 7, 5][Math.floor(beat) % 8]
  const pulse = 0.65 + 0.35 * Math.sin((beat % 1) * Math.PI)
  return { hz: 220 * 2 ** (note / 12), level: (preparation ? 0.045 : 0.032) * pulse }
}

/** Air and differently sized openings resonate only while the body is moving. */
export function createBonolenovVoices(mix: FightMix) {
  const performers = (['player', 'opponent'] as const).map((side) => ({
    side,
    voices: [
      continuousVoice(mix, { target: mix.effects, hz: 220, level: 0 }),
      continuousVoice(mix, { target: mix.effects, hz: 440, level: 0 }),
      continuousVoice(mix, { target: mix.effects, hz: 660, level: 0 }),
      continuousVoice(mix, { target: mix.effects, hz: 1200, noise: true, level: 0 }),
    ],
  }))
  return {
    update(state: FightState, audible: boolean) {
      const now = mix.context.currentTime
      for (const { side, voices } of performers) {
        const phrase = bonolenovMusicPhrase(state[side])
        const playing = audible && state.phase === 'fighting' && state.hitstop === 0 && phrase
        for (const [index, voice] of voices.entries()) {
          voice.frequency.setTargetAtTime(
            (phrase?.hz ?? 220) * [1, 2.003, 3.01, 5][index],
            now,
            0.025,
          )
          voice.level.setTargetAtTime(
            playing ? phrase.level * [1, 0.32, 0.12, 0.22][index] : 0,
            now,
            0.015,
          )
          voice.pan.setTargetAtTime((state[side].x - 50) / 75, now, 0.04)
        }
      }
    },
    stop() {
      for (const { voices } of performers) for (const voice of voices) voice.stop()
    },
  }
}
