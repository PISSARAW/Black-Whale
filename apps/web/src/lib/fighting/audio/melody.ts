import { continuousVoice, type FightMix } from './mixer'
import type { FightState } from '../types'

/** The sustained flute follows simulation time; pause, mute and expiry silence it. */
export function createMelodyVoices(mix: FightMix) {
  const voices = (['player', 'opponent'] as const).map((side) => ({
    side,
    fundamental: continuousVoice(mix, { target: mix.effects, hz: 349.23, level: 0 }),
    breath: continuousVoice(mix, { target: mix.effects, hz: 1400, noise: true, level: 0 }),
  }))
  return {
    update(state: FightState, audible: boolean) {
      const now = mix.context.currentTime
      for (const { side, fundamental, breath } of voices) {
        const fighter = state[side]
        const music = fighter.melodyPerformance
        const playing = audible && state.phase === 'fighting' && music?.startupFrames === 0
        const note = [0, 2, 4, 7][Math.floor((music?.playingFrames ?? 0) / 24) % 4]
        fundamental.frequency.setTargetAtTime(349.23 * 2 ** (note / 12), now, 0.04)
        fundamental.level.setTargetAtTime(playing ? 0.045 : 0, now, 0.025)
        breath.level.setTargetAtTime(playing ? 0.008 : 0, now, 0.025)
        fundamental.pan.setTargetAtTime((fighter.x - 50) / 75, now, 0.04)
        breath.pan.setTargetAtTime((fighter.x - 50) / 75, now, 0.04)
      }
    },
    stop() {
      for (const voice of voices) {
        voice.fundamental.stop()
        voice.breath.stop()
      }
    },
  }
}
