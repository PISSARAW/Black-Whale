import type { ArenaHatsuEffect, Impact } from '../combat/types'
import type { HatsuProfile } from '../nen/hatsuRegistry'
import { HATSU_VISUAL_SIGNATURE_BY_KIND } from '../nen/hatsuRegistry'
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

export function playArenaHatsu(effect: ArenaHatsuEffect, profile?: HatsuProfile | null) {
  const frequencies: Record<ArenaHatsuEffect, number> = {
    bind: 240,
    impact: 72,
    barrage: 150,
    restore: 420,
    enhance: 310,
  }
  if (!profile)
    return pulse(frequencies[effect], 0.55, 0.04, effect === 'restore' ? 'sine' : 'sawtooth')
  const sound = arenaHatsuAudioSignature(profile)
  pulse(sound.base, sound.duration, sound.gain, sound.wave)
  window.setTimeout(
    () => pulse(sound.accent, sound.duration * 0.7, 0.025, sound.accentWave),
    sound.delay,
  )
}

export interface ArenaHatsuAudioSignature {
  base: number
  accent: number
  duration: number
  delay: number
  gain: number
  wave: OscillatorType
  accentWave: OscillatorType
}

export function arenaHatsuAudioSignature(profile: HatsuProfile): ArenaHatsuAudioSignature {
  const signature = HATSU_VISUAL_SIGNATURE_BY_KIND[profile.kind]
  const hash = [...profile.id].reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    7,
  )
  const motion = ['pulse', 'orbit', 'strike', 'drift', 'coil', 'bloom', 'scan', 'flicker'].indexOf(
    signature.motion,
  )
  const base = 92 + (hash % 420)
  const wave: OscillatorType =
    signature.form === 'beast' || signature.form === 'organic'
      ? 'sawtooth'
      : signature.form === 'field'
        ? 'sine'
        : 'triangle'
  return {
    base,
    accent: base * (1.15 + (hash % 7) / 20),
    duration: 0.3 + motion * 0.055,
    delay: 55 + (hash % 90),
    gain: 0.035 + (hash % 4) * 0.006,
    wave,
    accentWave: signature.motion === 'strike' ? 'square' : wave,
  }
}
