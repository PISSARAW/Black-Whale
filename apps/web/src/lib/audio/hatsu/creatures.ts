import { hatsuAudioGraph, midiToHz } from '../ambient'

import { rush, startsAt, swept } from './synth'

export function hissLikeASnake() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The initial strike/bite (quick and somewhat forceful)
  rush(g, at, {
    duration: 0.08,
    peak: 0.1,
    type: 'bandpass',
    cutoff: 1800,
    sweepTo: 800,
    q: 1.2,
    attack: 0.01,
    release: 0.05,
    send: 0.3,
  })

  // The longer hiss following the bite
  rush(g, at + 0.04, {
    duration: 0.45,
    peak: 0.12,
    type: 'highpass',
    cutoff: 2800,
    sweepTo: 4500,
    attack: 0.04,
    release: 0.35,
    send: 0.5,
  })
}

/**
 * Marayam's Guardian Spirit Beast, roaring at somebody trying the door.
 *
 * The one sound in the walk that is a refusal. A roar is three things at once
 * and it has to be all three or it reads as an engine: a low tone that sags
 * across its whole length, a second one a fifth off it and deliberately not in
 * tune with the first, and a great deal of low noise on top — the noise is the
 * throat, and without it two oscillators are a foghorn. The whole of it is sent
 * hard to the reverb, because it is being made in a room with a steel deckhead
 * and that is most of why it is frightening.
 */
export function roarLikeADragon() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The throat: a wide band of low noise that opens and closes, which is the
  // shape of a mouth rather than the shape of a note.
  rush(g, at, {
    duration: 1.15,
    peak: 0.16,
    type: 'lowpass',
    cutoff: 320,
    sweepTo: 900,
    q: 0.7,
    attack: 0.09,
    release: 0.5,
    send: 0.75,
  })
  // And the two tones under it. The detune is the point: exactly a fifth would
  // be a chord, and an animal does not make a chord.
  swept(g, at, {
    duration: 1.1,
    type: 'sawtooth',
    from: 62,
    to: 44,
    peak: 0.13,
    attack: 0.07,
    release: 0.45,
    wobble: 5,
    wobbleHz: 17,
    send: 0.6,
  })
  swept(g, at + 0.05, {
    duration: 1,
    type: 'sawtooth',
    from: 93,
    to: 67,
    detune: 22,
    peak: 0.07,
    attack: 0.1,
    release: 0.4,
    wobble: 4,
    wobbleHz: 11,
    send: 0.6,
  })
  // The catch at the end, which is what stops it sounding like a sample fading
  // out: the breath runs out before the note does.
  rush(g, at + 0.95, {
    duration: 0.22,
    peak: 0.07,
    type: 'bandpass',
    cutoff: 700,
    sweepTo: 260,
    q: 1.4,
    attack: 0.03,
    release: 0.3,
    send: 0.5,
  })
}

/**
 * Momoze's flock, let loose.
 *
 * A great many small creatures of no particular kind, all making noise at once
 * — so it is deliberately not one call: eight short chirps scattered over half
 * a second, each at its own pitch, some of them squeaking up and some down. The
 * scatter is by hand rather than off an LFO for the reason the wormhole's
 * sparks are: a crowd on a regular beat is a machine.
 */
export function chirpTheFlock() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // Pitch, when, how long, and which way it bends. Written out rather than
  // generated so the flock sounds the same every time it is loosed — the walk
  // has no random it is allowed to use in a render.
  const voices: [number, number, number, number][] = [
    [84, 0, 0.09, 1.5],
    [72, 0.06, 0.14, 0.7],
    [91, 0.11, 0.07, 1.8],
    [66, 0.19, 0.16, 0.6],
    [88, 0.24, 0.08, 1.3],
    [79, 0.31, 0.11, 0.75],
    [96, 0.38, 0.06, 2.1],
    [74, 0.44, 0.13, 0.65],
  ]
  for (const [note, offset, length, bend] of voices) {
    swept(g, at + offset, {
      duration: length,
      type: offset % 0.2 > 0.1 ? 'square' : 'triangle',
      from: midiToHz(note),
      to: midiToHz(note) * bend,
      peak: 0.055,
      attack: 0.008,
      release: 0.09,
      wobble: 9,
      wobbleHz: 24,
      send: 0.5,
    })
  }
  // And something large among them, because one of them is: the drawing has a
  // bear the size of the room in it.
  swept(g, at + 0.12, {
    duration: 0.4,
    type: 'sawtooth',
    from: 74,
    to: 58,
    peak: 0.06,
    attack: 0.05,
    release: 0.3,
    wobble: 6,
    wobbleHz: 9,
    send: 0.6,
  })
}

/**
 * Camilla's cat, breaking up the room it is waiting in.
 *
 * Two things and both are needed: the sound of a thing going under something
 * heavy, and the animal making it. The crush is low noise with the bottom
 * falling out of it; the cat over the top is deliberately not a miaow — a
 * miaow is domestic, and this one is the size of a room. So it is the low
 * warning a cat gives before it is one: a hard sine bending down, with a purr
 * under it that is only a very slow wobble on a low tone.
 */
export function crushLikeACat() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The thing going.
  rush(g, at, {
    duration: 0.3,
    peak: 0.13,
    type: 'lowpass',
    cutoff: 900,
    sweepTo: 130,
    q: 0.6,
    attack: 0.005,
    release: 0.25,
    send: 0.5,
  })
  // The cat over it.
  swept(g, at + 0.1, {
    duration: 0.5,
    type: 'triangle',
    from: 300,
    to: 168,
    peak: 0.075,
    attack: 0.06,
    release: 0.3,
    wobble: 12,
    wobbleHz: 6,
    send: 0.55,
  })
  // And the purr, which is what makes it read as pleased with itself.
  swept(g, at, {
    duration: 0.75,
    type: 'sine',
    from: 58,
    to: 52,
    peak: 0.05,
    attack: 0.1,
    release: 0.35,
    wobble: 14,
    wobbleHz: 22,
  })
}
