import type { ArenaHatsuEffect, Impact } from '../combat/types'
import { hatsuAudioGraph } from '$lib/audio/ambient'

function pulse(frequency: number, duration: number, gain: number, type: OscillatorType) {
  const graph = hatsuAudioGraph()
  if (!graph) return
  const audio = graph.context
  const oscillator = audio.createOscillator()
  const volume = audio.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, audio.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(35, frequency * 0.55),
    audio.currentTime + duration,
  )
  volume.gain.setValueAtTime(gain, audio.currentTime)
  volume.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration)
  oscillator.connect(volume).connect(graph.muffle)
  oscillator.start()
  oscillator.stop(audio.currentTime + duration)
}

export function playArenaImpact(impact: Impact) {
  if (impact === 'miss') return
  if (impact === 'blocked') return pulse(180, 0.12, 0.025, 'triangle')
  if (impact === 'ko') return pulse(62, 0.7, 0.06, 'sawtooth')
  pulse(impact === 'clean' ? 110 : 82, impact === 'clean' ? 0.2 : 0.38, 0.045, 'square')
}

export function playArenaHatsu(effect: ArenaHatsuEffect) {
  const frequencies: Record<ArenaHatsuEffect, number> = {
    bind: 240,
    impact: 72,
    barrage: 150,
    restore: 420,
    enhance: 310,
  }
  pulse(frequencies[effect], 0.55, 0.04, effect === 'restore' ? 'sine' : 'sawtooth')
}
