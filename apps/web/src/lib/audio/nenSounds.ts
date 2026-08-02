import type { NenTechniqueAction } from '@black-whale/nen-engine'
import { hatsuAudioGraph, type Graph } from './ambient'
import type { NenObjectInteraction } from '$lib/tour/NenSceneAura'

const LEAD = 0.012

interface Tone {
  from: number
  to: number
  peak: number
  duration: number
  type?: OscillatorType
}

function tone(g: Graph, at: number, sound: Tone) {
  const oscillator = g.context.createOscillator()
  oscillator.type = sound.type ?? 'sine'
  oscillator.frequency.setValueAtTime(sound.from, at)
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, sound.to), at + sound.duration)
  const gain = g.context.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(sound.peak, at + Math.min(0.045, sound.duration / 4))
  gain.gain.exponentialRampToValueAtTime(0.0001, at + sound.duration)
  oscillator.connect(gain)
  gain.connect(g.muffle)
  oscillator.start(at)
  oscillator.stop(at + sound.duration + 0.03)
}

function chord(g: Graph, notes: Tone[]) {
  const at = g.context.currentTime + LEAD
  notes.forEach((note, index) => tone(g, at + index * 0.018, note))
}

/** Audible signature of a basic Nen transition. Zetsu gets only its closing hush. */
export function playNenTechniqueSound(action: NenTechniqueAction) {
  const g = hatsuAudioGraph()
  if (!g) return
  switch (action.type) {
    case 'TEN':
      chord(g, [{ from: 210, to: 260, peak: 0.035, duration: 0.42 }, { from: 420, to: 520, peak: 0.018, duration: 0.38 }])
      break
    case 'REN':
      chord(g, [{ from: 68, to: 118, peak: 0.12, duration: 0.72, type: 'sawtooth' }, { from: 136, to: 228, peak: 0.06, duration: 0.65, type: 'triangle' }])
      break
    case 'ZETSU':
      chord(g, [{ from: 480, to: 48, peak: 0.055, duration: 0.5, type: 'triangle' }])
      break
    case 'GYO':
      if (action.on) chord(g, [{ from: 720, to: 1220, peak: 0.055, duration: 0.2 }, { from: 1080, to: 1680, peak: 0.025, duration: 0.16 }])
      break
    case 'EN':
      if (action.radius) chord(g, [{ from: 190, to: 760, peak: 0.07, duration: 0.62, type: 'sine' }, { from: 380, to: 980, peak: 0.03, duration: 0.7 }])
      break
    case 'KEN':
      if (action.on) chord(g, [{ from: 92, to: 74, peak: 0.11, duration: 0.38, type: 'square' }, { from: 184, to: 148, peak: 0.045, duration: 0.42 }])
      break
    case 'KO':
      if (action.zone) chord(g, [{ from: 160, to: 54, peak: 0.13, duration: 0.24, type: 'sawtooth' }])
      break
    case 'RYU':
      chord(g, [{ from: 330, to: 520, peak: 0.045, duration: 0.28, type: 'triangle' }, { from: 520, to: 290, peak: 0.032, duration: 0.34 }])
      break
    case 'SHU':
      if (action.on) chord(g, [{ from: 260, to: 390, peak: 0.05, duration: 0.36 }, { from: 520, to: 780, peak: 0.022, duration: 0.42 }])
      break
    case 'ON':
      if (action.on) chord(g, [{ from: 52, to: 88, peak: 0.14, duration: 0.86, type: 'sawtooth' }, { from: 104, to: 176, peak: 0.075, duration: 0.78, type: 'square' }])
      break
    case 'IN':
      if (action.on) chord(g, [{ from: 640, to: 120, peak: 0.028, duration: 0.32, type: 'triangle' }])
      break
  }
}

export function playNenObjectSound(kind: NenObjectInteraction) {
  const g = hatsuAudioGraph()
  if (!g) return
  if (kind === 'strike') {
    chord(g, [{ from: 118, to: 38, peak: 0.18, duration: 0.2, type: 'square' }, { from: 460, to: 95, peak: 0.075, duration: 0.16, type: 'sawtooth' }])
  } else if (kind === 'pressure') {
    chord(g, [{ from: 76, to: 46, peak: 0.13, duration: 0.55, type: 'sawtooth' }])
  } else if (kind === 'sense') {
    chord(g, [{ from: 540, to: 1080, peak: 0.055, duration: 0.42 }, { from: 810, to: 1320, peak: 0.025, duration: 0.5 }])
  } else {
    chord(g, [{ from: 240, to: 420, peak: 0.05, duration: 0.3, type: 'triangle' }])
  }
}
