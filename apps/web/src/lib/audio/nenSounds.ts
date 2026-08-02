import { NEN_PRESENTATION, type NenTechnique, type NenTechniqueAction } from '@black-whale/nen-engine'
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

const ACTION_TECHNIQUE: Record<NenTechniqueAction['type'], NenTechnique> = {
  TEN: 'ten', REN: 'ren', ZETSU: 'zetsu', GYO: 'gyo', IN: 'in', EN: 'en',
  KEN: 'ken', KO: 'ko', RYU: 'ryu', SHU: 'shu', ON: 'on',
}

function activeTransition(action: NenTechniqueAction) {
  if ('on' in action) return action.on
  if (action.type === 'EN') return action.radius !== null
  if (action.type === 'KO') return action.zone !== null
  return true
}

/** The same abstract signature drives every Tour mode; only spatial gain may differ. */
function canonicalCue(g: Graph, technique: NenTechnique) {
  const profile = NEN_PRESENTATION[technique]
  const duration = Math.max(0.16, profile.envelope.attack + profile.envelope.release)
  const peak = 0.14 * profile.sound.volume
  chord(g, [
    { from: profile.sound.lowHz, to: Math.min(profile.sound.highHz, profile.sound.lowHz * 1.8), peak, duration, type: profile.sound.noise > 0.35 ? 'sawtooth' : 'triangle' },
    { from: profile.sound.highHz, to: Math.max(profile.sound.lowHz, profile.sound.highHz * 0.72), peak: peak * 0.46, duration: duration * 1.08, type: 'sine' },
  ])
}

/** Audible signature of a basic Nen transition. Zetsu gets only its closing hush. */
export function playNenTechniqueSound(action: NenTechniqueAction) {
  const g = hatsuAudioGraph()
  if (!g) return
  if (activeTransition(action)) return canonicalCue(g, ACTION_TECHNIQUE[action.type])
  switch (action.type) {
    case 'GYO': case 'IN': case 'KEN': case 'SHU': case 'ON':
      chord(g, [{ from: 360, to: 90, peak: 0.012, duration: 0.16, type: 'triangle' }])
      return
    case 'EN': case 'KO': return
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
