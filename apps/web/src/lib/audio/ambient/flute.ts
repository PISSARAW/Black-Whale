import { hatsuAudioGraph, midiToHz, voice } from './mixer'

/**
 * Melody's flute, one degree per solfège syllable: A natural minor, so a score
 * played over the voyage theme stays in the same key as the pad underneath it.
 * DO is A4 and the seven entries line up with the DO…SI labels the Hatsu draws.
 */
const SOLFEGE = [0, 2, 3, 5, 7, 8, 10]

/**
 * Sound one note of Enchanting Music. `degree` counts syllables from DO and
 * wraps every seven, matching the label sequence, so a run of clicks is heard
 * as the scale it is written as.
 */
export function playHatsuNote(degree: number, options: { velocity?: number } = {}) {
  const g = hatsuAudioGraph()
  if (!g) return
  const step = ((Math.round(degree) % SOLFEGE.length) + SOLFEGE.length) % SOLFEGE.length
  // Every wrap climbs an octave, so a long score rises instead of circling.
  const octave = Math.floor(Math.round(degree) / SOLFEGE.length)
  const midi = 69 + SOLFEGE[step] + 12 * Math.min(octave, 2)
  const at = g.context.currentTime + 0.02
  const peak = 0.18 * (options.velocity ?? 1)

  voice(g, at, {
    hz: midiToHz(midi),
    duration: 0.45,
    type: 'triangle',
    peak,
    attack: 0.05,
    release: 0.6,
    vibrato: 3.5,
    send: 0.6,
  })
  // A quiet octave above gives the triangle the breathy edge of a flute.
  voice(g, at, {
    hz: midiToHz(midi + 12),
    duration: 0.3,
    type: 'sine',
    peak: peak * 0.35,
    attack: 0.02,
    release: 0.5,
    send: 0.8,
  })
}
