/**
 * What a technique sounds like in the walk.
 *
 * The tour already had a picture for nineteen of its Hatsu and no sound for any
 * of them: an owl that perched in silence, a vacuum cleaner that swallowed a
 * table without a motor, a machine gun that fired nothing you could hear. This
 * is the missing half, and it is synthesised for the same reason the voyage
 * theme is — no megabytes, no licence, and every voice ends up behind the same
 * `muffle` node, so Three Monkeys takes the visitor's hearing of the techniques
 * exactly as it takes their hearing of the ship.
 *
 * Nothing here knows what a room is. `routes/tour/+page.svelte` reads the report
 * a cast returned and calls one of these; the loops are driven off the world,
 * because a running engine is a state and not an event.
 */
import { hatsuAudioGraph, midiToHz, type Graph } from './ambient'

/** A sound that runs until something stops it: a motor, a swarm, a dirge. */
export interface Held {
  stop: () => void
}

/** A hair of lead time: scheduling in the past is what makes a click. */
const LEAD = 0.02

const startsAt = (g: Graph) => g.context.currentTime + LEAD

// ── The bench ────────────────────────────────────────────────────────────
//
// Two helpers cover everything below. `swept` is a single oscillator that may
// bend — a hoot sags, a punch drops, a boing wobbles — which the theme's own
// `voice` cannot do because nothing in a written melody bends. `rush` is a loop
// of white noise through one filter, which is what air, paper, sparks and
// gunfire all are once you stop naming them.

/** Two seconds of white noise, built once per context and looped by everything. */
const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>()

function noiseBuffer(context: AudioContext): AudioBuffer {
  const held = noiseBuffers.get(context)
  if (held) return held
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 2), context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
  noiseBuffers.set(context, buffer)
  return buffer
}

interface Swept {
  type: OscillatorType
  /** Where the pitch starts, in hertz. */
  from: number
  /** Where it ends, if it moves at all. */
  to?: number
  peak: number
  attack?: number
  release?: number
  detune?: number
  /** Depth of a pitch wobble, in hertz, and how fast it wobbles. */
  wobble?: number
  wobbleHz?: number
  send?: number
}

/** One oscillator, optionally bending and optionally wobbling as it goes. */
function swept(g: Graph, at: number, duration: number, o: Swept) {
  const { context } = g
  const attack = o.attack ?? 0.005
  const release = o.release ?? 0.08
  const ends = at + duration + release

  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.peak), at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, ends)

  const osc = context.createOscillator()
  osc.type = o.type
  osc.frequency.setValueAtTime(o.from, at)
  if (o.to !== undefined && o.to !== o.from) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), at + duration)
  }
  if (o.detune) osc.detune.value = o.detune

  if (o.wobble) {
    const lfo = context.createOscillator()
    lfo.frequency.value = o.wobbleHz ?? 7
    const depth = context.createGain()
    depth.gain.value = o.wobble
    lfo.connect(depth)
    depth.connect(osc.frequency)
    lfo.start(at)
    lfo.stop(ends)
  }

  osc.connect(gain)
  gain.connect(g.muffle)
  if (o.send) {
    const send = context.createGain()
    send.gain.value = o.send
    gain.connect(send)
    send.connect(g.reverbSend)
  }
  osc.start(at)
  osc.stop(ends + 0.05)
}

interface Rush {
  peak: number
  attack?: number
  release?: number
  type?: BiquadFilterType
  /** Where the filter starts, and where it has got to by the end. */
  cutoff?: number
  sweepTo?: number
  q?: number
  send?: number
}

/** A gust of noise through one filter: air, paper, sparks, a shot, a motor. */
function rush(g: Graph, at: number, duration: number, o: Rush) {
  const { context } = g
  const attack = o.attack ?? 0.01
  const release = o.release ?? 0.05
  const ends = at + duration + release

  const source = context.createBufferSource()
  source.buffer = noiseBuffer(context)
  source.loop = true

  const filter = context.createBiquadFilter()
  filter.type = o.type ?? 'bandpass'
  filter.frequency.setValueAtTime(o.cutoff ?? 1200, at)
  if (o.sweepTo !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, o.sweepTo), at + duration)
  }
  filter.Q.value = o.q ?? 1

  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.peak), at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, ends)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(g.muffle)
  if (o.send) {
    const send = context.createGain()
    send.gain.value = o.send
    gain.connect(send)
    send.connect(g.reverbSend)
  }
  source.start(at)
  source.stop(ends + 0.05)
}

// ── On the rooms ─────────────────────────────────────────────────────────

/**
 * Secret Window's owl, attached or called back.
 *
 * Two notes, the second lower and shorter, each sagging about a tone across the
 * call — which is what a tawny owl does and what makes the sound read as a bird
 * rather than as a flute. The breath under it is a short band of noise: a hoot
 * is mostly air.
 */
export function hootAnOwl() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  for (const [offset, from, length, peak] of [
    [0, 384, 0.34, 0.11],
    [0.44, 352, 0.46, 0.09],
  ]) {
    swept(g, at + offset, length, {
      type: 'sine',
      from,
      to: from * 0.9,
      peak,
      attack: 0.05,
      release: 0.22,
      send: 0.55,
    })
    // The octave above is what stops the sine sounding like a test tone.
    swept(g, at + offset, length * 0.7, {
      type: 'triangle',
      from: from * 2,
      to: from * 1.8,
      peak: peak * 0.22,
      attack: 0.06,
      release: 0.2,
    })
    rush(g, at + offset, length * 0.5, {
      peak: 0.02,
      cutoff: from * 2.2,
      q: 2.5,
      attack: 0.04,
      release: 0.15,
    })
  }
}

/**
 * Cross Game's card, laid on a room: blue, then yellow, then red.
 *
 * A card being drawn off the deck and set down — the slide is the noise, the set
 * is the click — and above it the two-tone blip of a selection being made. The
 * blip climbs with the stage, so the third card is heard to be the third one
 * without anyone having to look at its colour.
 */
export function selectACard(stage = 1) {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  const step = Math.min(2, Math.max(0, stage - 1))

  // The card leaving the deck.
  rush(g, at, 0.075, { peak: 0.07, type: 'highpass', cutoff: 2600, sweepTo: 5200, release: 0.04 })
  // And landing on the room.
  rush(g, at + 0.085, 0.02, { peak: 0.09, type: 'bandpass', cutoff: 2000, q: 0.8, release: 0.05 })

  const root = 74 + step * 3
  swept(g, at + 0.085, 0.05, { type: 'square', from: midiToHz(root), peak: 0.05, release: 0.06 })
  swept(g, at + 0.145, 0.09, {
    type: 'square',
    from: midiToHz(root + 7),
    peak: 0.045,
    release: 0.14,
    send: 0.4,
  })
}

/**
 * A mouth of Magical Worm, opening.
 *
 * The sound the films give a portal cut in the air: a low swallow of space, a
 * shower of sparks round the rim, and a ring once the hole is standing. The
 * sparks are scattered by hand rather than by an LFO — a rim of fire is
 * irregular, and a regular one reads as a machine.
 */
export function openAWormhole() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The air going through the hole, low and rising as it widens.
  rush(g, at, 0.55, {
    peak: 0.1,
    type: 'lowpass',
    cutoff: 180,
    sweepTo: 1400,
    q: 0.7,
    attack: 0.12,
    release: 0.2,
    send: 0.5,
  })
  // The rim: twenty grains of fire, thrown across the opening.
  for (let i = 0; i < 20; i++) {
    const when = at + 0.05 + Math.random() * 0.5
    rush(g, when, 0.012 + Math.random() * 0.02, {
      peak: 0.035 + Math.random() * 0.03,
      type: 'bandpass',
      cutoff: 2400 + Math.random() * 4200,
      q: 6,
      attack: 0.002,
      release: 0.06,
      send: 0.6,
    })
  }
  // And the ring, once it is a hole and not a wound: a fifth, held open.
  for (const [semitone, peak] of [
    [0, 0.055],
    [7, 0.04],
    [12, 0.03],
  ]) {
    swept(g, at + 0.3, 0.7, {
      type: 'triangle',
      from: midiToHz(69 + semitone),
      peak,
      attack: 0.18,
      release: 0.8,
      send: 0.75,
    })
  }
}

/**
 * Chrollo's teleport: the moment the walk is somewhere else.
 *
 * Time being taken out rather than crossed — the swell rises, is cut off
 * mid-breath rather than resolved, and what lands on the far side is a single
 * hollow thud with a shard of metal on top of it. The cut is the whole sound:
 * a swell that faded would be travel, and this is not travel.
 */
export function skipThroughTime() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The swell, climbing to nothing.
  rush(g, at, 0.34, {
    peak: 0.11,
    type: 'bandpass',
    cutoff: 220,
    sweepTo: 3200,
    q: 1.6,
    attack: 0.22,
    release: 0.005,
  })
  swept(g, at, 0.34, {
    type: 'sawtooth',
    from: 62,
    to: 210,
    peak: 0.07,
    attack: 0.2,
    release: 0.005,
  })

  // The cut, and the far side of it.
  const landed = at + 0.36
  swept(g, landed, 0.24, {
    type: 'sine',
    from: 140,
    to: 38,
    peak: 0.22,
    attack: 0.004,
    release: 0.3,
    send: 0.3,
  })
  swept(g, landed, 0.1, {
    type: 'square',
    from: 1860,
    to: 620,
    peak: 0.05,
    attack: 0.002,
    release: 0.35,
    send: 0.7,
  })
  rush(g, landed, 0.06, { peak: 0.06, type: 'highpass', cutoff: 3600, release: 0.25, send: 0.6 })
}

/**
 * Indoor Fish: the requiem, for as long as there is a shoal in the ship.
 *
 * The victims feel nothing and stay alive until the ability ends, which is the
 * cruellest line in the technique — so what plays is not a bite but a mass for
 * the dead: a four-bar dirge in D minor, low choir over a tolling bell, at forty
 * to the minute. It is music rather than a sound effect because the fish are a
 * state and not an event, and it stops when the last room is let go.
 */
const DIRGE_BEAT = 60 / 40
const DIRGE_BAR = DIRGE_BEAT * 4

/** [beat, semitones above D3, beats] — a descending lament, twice through. */
const dirge: Array<Array<[number, number, number]>> = [
  [
    [0, 0, 2],
    [2, -2, 2],
  ],
  [
    [0, -3, 2],
    [2, -5, 2],
  ],
  [
    [0, -4, 2],
    [2, -5, 1],
    [3, -7, 1],
  ],
  [[0, -12, 4]],
]

/** D3, which the whole thing hangs off. */
const DIRGE_ROOT = 50

let dirgeScheduler: ReturnType<typeof setInterval> | null = null
let dirgeNextBar = 0
let dirgeBar = 0

function scheduleDirgeBar(g: Graph, bar: number, at: number) {
  // The bell, once a bar. Four inharmonic partials, struck and left to ring.
  for (const [ratio, peak] of [
    [1, 0.09],
    [2.71, 0.035],
    [5.15, 0.018],
    [8.4, 0.01],
  ]) {
    swept(g, at, 0.1, {
      type: 'sine',
      from: midiToHz(DIRGE_ROOT - 12) * ratio,
      peak,
      attack: 0.006,
      release: DIRGE_BAR * 0.9,
      send: 0.8,
    })
  }

  for (const [offset, semitone, beats] of dirge[bar % dirge.length]) {
    const hz = midiToHz(DIRGE_ROOT + semitone)
    // Two detuned saws and a sine under them: a choir, not a synth pad.
    swept(g, at + offset * DIRGE_BEAT, beats * DIRGE_BEAT * 0.85, {
      type: 'sawtooth',
      from: hz,
      peak: 0.045,
      attack: 0.45,
      release: 0.9,
      detune: -7,
      send: 0.7,
    })
    swept(g, at + offset * DIRGE_BEAT, beats * DIRGE_BEAT * 0.85, {
      type: 'sawtooth',
      from: hz,
      peak: 0.04,
      attack: 0.55,
      release: 0.9,
      detune: 8,
      send: 0.7,
    })
    swept(g, at + offset * DIRGE_BEAT, beats * DIRGE_BEAT * 0.9, {
      type: 'sine',
      from: hz / 2,
      peak: 0.07,
      attack: 0.3,
      release: 0.7,
    })
  }
}

function dirgeTick() {
  const g = hatsuAudioGraph()
  if (!g) return
  while (dirgeNextBar < g.context.currentTime + DIRGE_BAR * 1.5) {
    scheduleDirgeBar(g, dirgeBar, Math.max(dirgeNextBar, g.context.currentTime + 0.05))
    dirgeBar += 1
    dirgeNextBar += DIRGE_BAR
  }
}

/** Start the mass. Calling it while it is already saying changes nothing. */
export function startRequiem() {
  if (dirgeScheduler) return
  const g = hatsuAudioGraph()
  if (!g) return
  dirgeBar = 0
  dirgeNextBar = g.context.currentTime + 0.1
  dirgeTick()
  dirgeScheduler = setInterval(dirgeTick, 250)
}

/** Stop it. What is already scheduled is allowed to finish, as a bell must. */
export function stopRequiem() {
  if (!dirgeScheduler) return
  clearInterval(dirgeScheduler)
  dirgeScheduler = null
}

/**
 * Kalluto's paper dolls, stuck to a room.
 *
 * Sheets rather than a sheet: five rustles staggered over a third of a second,
 * each a short band of high noise, because a fold of paper is a broadband
 * transient and a flock of them is five of those arriving nearly together.
 */
export function foldPaper() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  for (let i = 0; i < 5; i++) {
    const when = at + i * 0.055 + Math.random() * 0.03
    rush(g, when, 0.05 + Math.random() * 0.05, {
      peak: 0.05 + Math.random() * 0.025,
      type: 'highpass',
      cutoff: 2600 + Math.random() * 2400,
      sweepTo: 5600,
      q: 0.8,
      attack: 0.008,
      release: 0.07,
      send: 0.3,
    })
  }
  // The last sheet settling: one flick, lower and slower than the rest.
  rush(g, at + 0.3, 0.12, {
    peak: 0.04,
    type: 'bandpass',
    cutoff: 1500,
    sweepTo: 900,
    q: 1.2,
    release: 0.12,
    send: 0.45,
  })
}

/**
 * Enchanting Music, on the flute the walk puts in the visitor's hands.
 *
 * A flute is a sine with air in it: the tone is nearly pure — which is why
 * every other voice in this file needs a second oscillator to stop sounding
 * like a test tone and this one does not — and what makes it an instrument
 * rather than a signal is the breath across the lip plate and the slow waver a
 * player cannot help putting on a held note.
 *
 * Three airs, and they are written out rather than generated, because what
 * tells them apart is the writing: the soft one is long notes rising through a
 * pentatonic, which has no interval in it that can sound wrong; the sharp one
 * is the same instrument played in note values that keep halving — crotchet,
 * quaver, semiquaver, which is exactly what the room fills up with; and the
 * lively one is a jig, in the compound time that has made people dance for four
 * hundred years.
 */
const FLUTE_ROOT = 74

/**
 * Each air as `[semitones above the root, when it lands in beats, how many
 * beats it holds]`, with the beat it is counted in.
 */
const AIRS: Record<
  'bloom' | 'scatter' | 'dance',
  { beat: number; peak: number; notes: [number, number, number][] }
> = {
  // Rising, unhurried, and ending on the note it started from an octave up:
  // nothing here resolves downward, because the room is opening.
  bloom: {
    beat: 0.42,
    peak: 0.075,
    notes: [
      [0, 0, 2],
      [2, 2, 1],
      [4, 3, 1],
      [7, 4, 2],
      [9, 6, 1],
      [7, 7, 1],
      [12, 8, 3],
    ],
  },
  // A crotchet, two quavers, four semiquavers, and the same again a step down:
  // the piece is the note values, and the notes scatter as they shorten.
  scatter: {
    beat: 0.34,
    peak: 0.07,
    notes: [
      [12, 0, 1],
      [10, 1, 0.5],
      [7, 1.5, 0.5],
      [5, 2, 0.25],
      [7, 2.25, 0.25],
      [3, 2.5, 0.25],
      [5, 2.75, 0.25],
      [10, 3, 1],
      [8, 4, 0.5],
      [5, 4.5, 0.5],
      [3, 5, 0.25],
      [5, 5.25, 0.25],
      [1, 5.5, 0.25],
      [0, 5.75, 0.25],
    ],
  },
  // Six-eight, and the long-short of it is the whole reason anything moves.
  dance: {
    beat: 0.19,
    peak: 0.08,
    notes: [
      [0, 0, 1],
      [4, 1, 0.5],
      [7, 1.5, 0.5],
      [9, 2, 1],
      [7, 3, 0.5],
      [4, 3.5, 0.5],
      [5, 4, 1],
      [9, 5, 0.5],
      [12, 5.5, 0.5],
      [11, 6, 1],
      [9, 7, 0.5],
      [7, 7.5, 0.5],
      [4, 8, 1],
      [7, 9, 1],
      [0, 10, 2],
    ],
  },
}

/** One air, played once. Which one is the visitor's decision, and their key. */
export function playATune(tune: 'bloom' | 'scatter' | 'dance') {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  const air = AIRS[tune]

  for (const [step, when, held] of air.notes) {
    const hz = midiToHz(FLUTE_ROOT + step)
    const starts = at + when * air.beat
    const length = held * air.beat
    swept(g, starts, length, {
      type: 'sine',
      from: hz,
      peak: air.peak,
      // A player's tongue, near enough: the shorter the note the harder it is
      // started, which is what makes a run of semiquavers sound played.
      attack: Math.min(0.06, 0.012 + length * 0.08),
      release: Math.min(0.35, 0.06 + length * 0.35),
      // The waver a held note gets and a short one has no time for.
      wobble: held >= 1 ? 3.5 : 0,
      wobbleHz: 5,
      send: 0.6,
    })
    // The breath across the lip plate, which is where the instrument is.
    rush(g, starts, Math.min(length, 0.09), {
      peak: 0.014,
      type: 'bandpass',
      cutoff: hz * 2,
      q: 1.6,
      attack: 0.006,
      release: 0.06,
      send: 0.35,
    })
  }
}

// ── Blinky, and the other things that run ────────────────────────────────

let motor: Held | null = null

/**
 * Blinky's motor, running for as long as he is in hand.
 *
 * A vacuum cleaner is two things at once: a low rotor you feel and a wide hiss
 * of air you hear. Both spin up rather than switch on — an appliance that
 * reached full speed instantly would read as a synthesiser — and the whole
 * thing spins back down when the aura is handed back.
 */
export function startVacuum() {
  if (motor) return
  const g = hatsuAudioGraph()
  if (!g) return
  const { context } = g
  const at = startsAt(g)

  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(0.09, at + 0.45)
  gain.connect(g.muffle)

  // The rotor, spinning up to speed over the first half-second.
  const rotor = context.createOscillator()
  rotor.type = 'sawtooth'
  rotor.frequency.setValueAtTime(42, at)
  rotor.frequency.exponentialRampToValueAtTime(96, at + 0.5)
  const rotorGain = context.createGain()
  rotorGain.gain.value = 0.5
  rotor.connect(rotorGain)
  rotorGain.connect(gain)

  // Its own second harmonic, which is what makes a motor sound like a motor.
  const whine = context.createOscillator()
  whine.type = 'square'
  whine.frequency.setValueAtTime(84, at)
  whine.frequency.exponentialRampToValueAtTime(192, at + 0.5)
  const whineGain = context.createGain()
  whineGain.gain.value = 0.09
  whine.connect(whineGain)
  whineGain.connect(gain)

  // And the air going up the hose.
  const air = context.createBufferSource()
  air.buffer = noiseBuffer(context)
  air.loop = true
  const band = context.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(600, at)
  band.frequency.exponentialRampToValueAtTime(1500, at + 0.5)
  band.Q.value = 0.6
  const airGain = context.createGain()
  airGain.gain.value = 0.75
  air.connect(band)
  band.connect(airGain)
  airGain.connect(gain)

  rotor.start(at)
  whine.start(at)
  air.start(at)

  motor = {
    stop: () => {
      const off = context.currentTime
      // Down rather than off: the rotor has weight, and it coasts.
      rotor.frequency.cancelScheduledValues(off)
      rotor.frequency.setTargetAtTime(38, off, 0.16)
      whine.frequency.cancelScheduledValues(off)
      whine.frequency.setTargetAtTime(76, off, 0.16)
      gain.gain.cancelScheduledValues(off)
      gain.gain.setTargetAtTime(0.0001, off, 0.14)
      rotor.stop(off + 0.9)
      whine.stop(off + 0.9)
      air.stop(off + 0.9)
    },
  }
}

export function stopVacuum() {
  motor?.stop()
  motor = null
}

let engine: Held | null = null

/**
 * Kurton under the visitor, from the starter to the idle.
 *
 * Three chugs of a starter motor and then a four-stroke idle: a low saw with a
 * slow beat against a second one a hair out of tune, which is what an engine
 * turning over actually is. It runs while the walk is riding and cuts when they
 * step off.
 */
export function startEngine() {
  if (engine) return
  const g = hatsuAudioGraph()
  if (!g) return
  const { context } = g
  const at = startsAt(g)

  // The starter: three turns before it catches.
  for (let i = 0; i < 3; i++) {
    rush(g, at + i * 0.13, 0.1, {
      peak: 0.07,
      type: 'lowpass',
      cutoff: 420,
      sweepTo: 260,
      q: 1.4,
      attack: 0.01,
      release: 0.05,
    })
    swept(g, at + i * 0.13, 0.1, { type: 'sawtooth', from: 78, to: 44, peak: 0.08, release: 0.06 })
  }

  const caught = at + 0.42
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, caught)
  gain.gain.exponentialRampToValueAtTime(0.085, caught + 0.3)
  gain.connect(g.muffle)

  const block = context.createOscillator()
  block.type = 'sawtooth'
  block.frequency.setValueAtTime(120, caught)
  block.frequency.exponentialRampToValueAtTime(64, caught + 0.55)
  const twin = context.createOscillator()
  twin.type = 'sawtooth'
  twin.frequency.setValueAtTime(121, caught)
  twin.frequency.exponentialRampToValueAtTime(64.9, caught + 0.55)

  // The lump in the idle: the firing order, heard as a slow tremolo.
  const lump = context.createOscillator()
  lump.type = 'sine'
  lump.frequency.value = 9.5
  const lumpDepth = context.createGain()
  lumpDepth.gain.value = 0.3
  const body = context.createGain()
  body.gain.value = 0.7
  lump.connect(lumpDepth)
  lumpDepth.connect(body.gain)

  const muffler = context.createBiquadFilter()
  muffler.type = 'lowpass'
  muffler.frequency.value = 900
  muffler.Q.value = 0.8

  block.connect(muffler)
  twin.connect(muffler)
  muffler.connect(body)
  body.connect(gain)

  // Exhaust: a thin band of noise over the top of it.
  const exhaust = context.createBufferSource()
  exhaust.buffer = noiseBuffer(context)
  exhaust.loop = true
  const pipe = context.createBiquadFilter()
  pipe.type = 'bandpass'
  pipe.frequency.value = 480
  pipe.Q.value = 0.9
  const exhaustGain = context.createGain()
  exhaustGain.gain.value = 0.2
  exhaust.connect(pipe)
  pipe.connect(exhaustGain)
  exhaustGain.connect(gain)

  block.start(caught)
  twin.start(caught)
  lump.start(caught)
  exhaust.start(caught)

  engine = {
    stop: () => {
      const off = context.currentTime
      gain.gain.cancelScheduledValues(off)
      gain.gain.setTargetAtTime(0.0001, off, 0.12)
      block.frequency.setTargetAtTime(46, off, 0.2)
      twin.frequency.setTargetAtTime(46.4, off, 0.2)
      block.stop(off + 0.9)
      twin.stop(off + 0.9)
      lump.stop(off + 0.9)
      exhaust.stop(off + 0.9)
    },
  }
}

export function stopEngine() {
  engine?.stop()
  engine = null
}

let swarm: Held | null = null

/**
 * Little Eye, out in a room somewhere.
 *
 * A fly: a saw around 180 Hz beaten hard by a fast tremolo, which is the
 * wingbeat, wandering a few hertz either side so it never settles into a tone.
 * Quiet, because the thing is four decks away and the point of it is that you
 * know it is still out there.
 */
export function startFly() {
  if (swarm) return
  const g = hatsuAudioGraph()
  if (!g) return
  const { context } = g
  const at = startsAt(g)

  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(0.03, at + 0.25)
  gain.connect(g.muffle)

  const wings = context.createOscillator()
  wings.type = 'sawtooth'
  wings.frequency.value = 182

  // The insect never flies in a straight line, so the pitch never holds still.
  const drift = context.createOscillator()
  drift.type = 'sine'
  drift.frequency.value = 0.7
  const driftDepth = context.createGain()
  driftDepth.gain.value = 26
  drift.connect(driftDepth)
  driftDepth.connect(wings.frequency)

  // The wingbeat itself, as amplitude rather than pitch.
  const beat = context.createOscillator()
  beat.type = 'sine'
  beat.frequency.value = 24
  const beatDepth = context.createGain()
  beatDepth.gain.value = 0.45
  const body = context.createGain()
  body.gain.value = 0.55
  beat.connect(beatDepth)
  beatDepth.connect(body.gain)

  const buzz = context.createBiquadFilter()
  buzz.type = 'bandpass'
  buzz.frequency.value = 900
  buzz.Q.value = 1.8

  wings.connect(buzz)
  buzz.connect(body)
  body.connect(gain)

  wings.start(at)
  drift.start(at)
  beat.start(at)

  swarm = {
    stop: () => {
      const off = context.currentTime
      gain.gain.cancelScheduledValues(off)
      gain.gain.setTargetAtTime(0.0001, off, 0.1)
      wings.stop(off + 0.6)
      drift.stop(off + 0.6)
      beat.stop(off + 0.6)
    },
  }
}

export function stopFly() {
  swarm?.stop()
  swarm = null
}

/** Everything that runs, silenced at once: leaving the walk, or dropping it. */
export function stopEveryHatsuLoop() {
  stopVacuum()
  stopEngine()
  stopFly()
  stopRequiem()
}

// ── The things that happen ───────────────────────────────────────────────

/**
 * Air Blow, crossing the ship.
 *
 * One long band of air sweeping downward — a gust is bright at the front and
 * dark by the time it has gone past — timed to the 1,1 s the scene gives the
 * motes, so the sound and the picture end together.
 */
export function blowAGust() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  rush(g, at, 1, {
    peak: 0.13,
    type: 'bandpass',
    cutoff: 1100,
    sweepTo: 220,
    q: 0.55,
    attack: 0.16,
    release: 0.25,
    send: 0.4,
  })
  // A second, thinner band a beat behind: the tail of the same gust.
  rush(g, at + 0.12, 0.85, {
    peak: 0.05,
    type: 'highpass',
    cutoff: 2400,
    sweepTo: 700,
    attack: 0.2,
    release: 0.3,
    send: 0.6,
  })
}

/**
 * Remote Punch, arriving.
 *
 * A fist is a very short broadband crack over a sine that falls two octaves in
 * under a fifth of a second. Nothing rings: the aura came up out of the deck,
 * hit something, and stopped.
 */
export function landAPunch() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  swept(g, at, 0.16, {
    type: 'sine',
    from: 168,
    to: 42,
    peak: 0.26,
    attack: 0.004,
    release: 0.18,
    send: 0.25,
  })
  rush(g, at, 0.05, {
    peak: 0.12,
    type: 'lowpass',
    cutoff: 1800,
    sweepTo: 400,
    attack: 0.002,
    release: 0.1,
  })
  // The deck it came up through, answering.
  swept(g, at + 0.02, 0.3, { type: 'triangle', from: 74, to: 52, peak: 0.07, release: 0.35 })
}

/**
 * Rising Sun, at the radius the wrapping had taken.
 *
 * Not an explosion — Feitan does not throw it, he becomes it — so it blooms:
 * a low roar underneath, a shimmer climbing over the top, and both of them
 * scaled by how far the heat reached. The 2,4 s matches the scene's exposure.
 */
export function raiseTheSun(metres = 12) {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  const reach = Math.min(2, Math.max(0.5, metres / 14))

  // The roar.
  rush(g, at, 1.9, {
    peak: 0.13 * reach,
    type: 'lowpass',
    cutoff: 90,
    sweepTo: 900,
    q: 0.6,
    attack: 0.7,
    release: 0.7,
    send: 0.5,
  })
  // The shimmer: two saws a fifth apart, climbing as the sphere opens.
  for (const [semitone, peak, detune] of [
    [0, 0.045, -9],
    [7, 0.035, 6],
    [12, 0.025, 0],
  ]) {
    swept(g, at + 0.25, 1.7, {
      type: 'sawtooth',
      from: midiToHz(50 + semitone),
      to: midiToHz(50 + semitone) * 2.4,
      peak: peak * reach,
      attack: 0.8,
      release: 0.6,
      detune,
      send: 0.7,
    })
  }
  // And the top of the bloom, where it stops climbing.
  rush(g, at + 1.4, 0.5, {
    peak: 0.05 * reach,
    type: 'highpass',
    cutoff: 3400,
    sweepTo: 7000,
    attack: 0.3,
    release: 0.6,
    send: 0.8,
  })
}

/**
 * Grimmel's arrow, already gone past by the time it is heard.
 *
 * Three events in under half a second: the string, the shaft going by, and the
 * arrival. That order is the point — the walk is standing in the far room, so
 * what it hears is the sound catching up with the exchange.
 */
export function loostAnArrow() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The string.
  swept(g, at, 0.09, {
    type: 'triangle',
    from: 240,
    to: 132,
    peak: 0.12,
    attack: 0.002,
    release: 0.12,
    send: 0.4,
  })
  rush(g, at, 0.04, { peak: 0.07, type: 'highpass', cutoff: 2200, release: 0.06 })

  // The shaft, passing.
  rush(g, at + 0.06, 0.3, {
    peak: 0.09,
    type: 'bandpass',
    cutoff: 3200,
    sweepTo: 600,
    q: 1.4,
    attack: 0.05,
    release: 0.12,
    send: 0.5,
  })

  // The arrival: a soul is not a target, so it lands soft and rings a little.
  swept(g, at + 0.36, 0.12, {
    type: 'sine',
    from: 320,
    to: 110,
    peak: 0.11,
    attack: 0.003,
    release: 0.5,
    send: 0.75,
  })
}

/**
 * Nen Stitches, thrown down the reticle.
 *
 * Wire coming off a drum: fourteen metallic ticks that speed up as the thread
 * runs out, over a thin band of noise sliding away from the hand. The last tick
 * is the bite — it is what says the thread took hold rather than fell short.
 */
export function unspoolWire() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  rush(g, at, 0.6, {
    peak: 0.05,
    type: 'highpass',
    cutoff: 1800,
    sweepTo: 5200,
    attack: 0.04,
    release: 0.15,
    send: 0.45,
  })

  const TICKS = 14
  for (let i = 0; i < TICKS; i++) {
    // Quadratic spacing: the drum accelerates as the coil gets lighter.
    const when = at + 0.62 * (1 - (1 - i / TICKS) ** 2)
    swept(g, when, 0.01, {
      type: 'square',
      from: 2600 + i * 130,
      peak: 0.035,
      attack: 0.001,
      release: 0.03,
      send: 0.35,
    })
  }

  // The bite.
  swept(g, at + 0.64, 0.05, {
    type: 'triangle',
    from: 1400,
    to: 520,
    peak: 0.09,
    attack: 0.002,
    release: 0.4,
    send: 0.7,
  })
}

/**
 * Double Machine Gun: eight rounds, two barrels, sixty milliseconds apart.
 *
 * The barrels are a filter apart rather than a pitch apart, because two guns
 * firing the same round differ in what the body of the weapon does to it. The
 * fall of brass at the end is what makes it a burst and not a drum fill.
 */
export function fireABurst(rounds = 8) {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  const shots = Math.min(14, Math.max(2, rounds))

  for (let i = 0; i < shots; i++) {
    const when = at + i * 0.062
    const left = i % 2 === 0
    // The crack.
    rush(g, when, 0.035, {
      peak: 0.11,
      type: 'highpass',
      cutoff: left ? 2400 : 3100,
      sweepTo: left ? 900 : 1200,
      attack: 0.001,
      release: 0.07,
      send: 0.55,
    })
    // The charge behind it.
    swept(g, when, 0.05, {
      type: 'sine',
      from: left ? 150 : 168,
      to: 48,
      peak: 0.15,
      attack: 0.002,
      release: 0.09,
    })
  }

  // Brass on the deck, after the last round.
  for (let i = 0; i < 4; i++) {
    rush(g, at + shots * 0.062 + 0.1 + i * 0.09 + Math.random() * 0.05, 0.02, {
      peak: 0.03,
      type: 'bandpass',
      cutoff: 4200 + Math.random() * 2000,
      q: 7,
      attack: 0.001,
      release: 0.12,
      send: 0.6,
    })
  }
}

/**
 * Three Monkeys, one strike at a time.
 *
 * A temple gong, struck once per seal — sight, then hearing, then speech — and
 * pitched a tone lower each time, so the third strike is heard to be worse than
 * the first. Four inharmonic partials over a strike transient: a gong is metal
 * that does not agree with itself, which is exactly why a sine will not do.
 *
 * The second strike takes hearing, so it is the last thing heard clearly; the
 * `muffle` node every voice here goes through does the rest without being asked.
 */
export function strikeAGong(stage = 1) {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  // Stage 0 is the fourth strike, which lifts all three seals and rings open.
  const step = Math.max(0, stage - 1)
  const root = midiToHz(45 - step * 2) * (stage === 0 ? 2 : 1)

  // The mallet.
  rush(g, at, 0.03, {
    peak: 0.09,
    type: 'bandpass',
    cutoff: 1800,
    q: 1.2,
    attack: 0.002,
    release: 0.08,
  })

  for (const [ratio, peak, ring] of [
    [1, 0.13, 3.4],
    [2.34, 0.07, 2.8],
    [3.71, 0.045, 2.2],
    [5.9, 0.028, 1.6],
    [8.63, 0.016, 1.1],
  ]) {
    swept(g, at, 0.12, {
      type: 'sine',
      from: root * ratio,
      // Metal detunes downward as the strike energy leaves it.
      to: root * ratio * 0.994,
      peak,
      attack: 0.008,
      release: ring,
      send: 0.85,
    })
  }
}

/**
 * Bungee Gum, set on something.
 *
 * It has the properties of both rubber and gum, so it is heard as both: a
 * stretch that climbs, and a snap back that falls past where it started before
 * settling. The wobble on the way down is the rubber, and it is the whole joke.
 */
export function stretchTheGum() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The stretch.
  swept(g, at, 0.18, {
    type: 'triangle',
    from: 190,
    to: 560,
    peak: 0.1,
    attack: 0.02,
    release: 0.04,
    send: 0.3,
  })
  // And the return, overshooting and wobbling as it goes.
  swept(g, at + 0.19, 0.34, {
    type: 'triangle',
    from: 560,
    to: 148,
    peak: 0.12,
    attack: 0.008,
    release: 0.22,
    wobble: 34,
    wobbleHz: 13,
    send: 0.5,
  })
  swept(g, at + 0.19, 0.3, {
    type: 'sine',
    from: 280,
    to: 74,
    peak: 0.05,
    attack: 0.01,
    release: 0.2,
  })
}

/**
 * Spatial Teleportation: the steel stops being a boundary.
 *
 * Luini's is the one technique in the walk that is a state rather than a moment
 * — the hull goes half transparent and stays there — so what marks it is the
 * grinding cycle of a machine dematerialising rather than a single hit. Three
 * turns of it, each a pair of detuned saws sweeping up and back through a
 * closing filter, with the brakes left on.
 */
export function grindThroughSpace(on = true) {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)
  const CYCLES = 3
  const CYCLE = 0.62

  for (let i = 0; i < CYCLES; i++) {
    const when = at + i * CYCLE
    // Rising when the walls open, falling when they close again: the same
    // machine, run the other way round.
    const low = 88 - i * 6
    const high = 168 - i * 10
    const [from, to] = on ? [low, high] : [high, low]

    for (const detune of [-11, 9]) {
      swept(g, when, CYCLE * 0.55, {
        type: 'sawtooth',
        from,
        to,
        peak: 0.075,
        attack: 0.1,
        release: 0.22,
        detune,
        send: 0.65,
      })
      swept(g, when + CYCLE * 0.5, CYCLE * 0.45, {
        type: 'sawtooth',
        from: to,
        to: from,
        peak: 0.06,
        attack: 0.08,
        release: 0.2,
        detune,
        send: 0.65,
      })
    }
    // The friction: a band of noise dragged across each turn.
    rush(g, when, CYCLE * 0.9, {
      peak: 0.045,
      type: 'bandpass',
      cutoff: on ? 420 : 1500,
      sweepTo: on ? 1500 : 420,
      q: 2.2,
      attack: 0.15,
      release: 0.2,
      send: 0.7,
    })
  }

  // The thump when it has finished arriving, or finished leaving.
  swept(g, at + CYCLES * CYCLE, 0.2, {
    type: 'sine',
    from: 96,
    to: 46,
    peak: 0.12,
    attack: 0.006,
    release: 0.5,
    send: 0.4,
  })
}

/**
 * Biohazard, waking something up.
 *
 * Hinrigh's animal-machine is a machine first: a servo stepping through four
 * positions, a relay closing, and a low hydraulic settle underneath. The steps
 * are square and quantised on purpose — nothing about it should sound alive.
 */
export function wakeTheMachine() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The relay.
  rush(g, at, 0.02, {
    peak: 0.1,
    type: 'highpass',
    cutoff: 3000,
    attack: 0.001,
    release: 0.04,
    send: 0.4,
  })

  // The servo, four positions, no glide between them.
  const steps = [196, 262, 233, 330]
  steps.forEach((hz, i) => {
    const when = at + 0.05 + i * 0.085
    swept(g, when, 0.06, {
      type: 'square',
      from: hz,
      peak: 0.055,
      attack: 0.004,
      release: 0.03,
      send: 0.3,
    })
    // Gear noise on each move: brief, and the same every time, as a gear is.
    rush(g, when, 0.045, {
      peak: 0.035,
      type: 'bandpass',
      cutoff: 1700,
      q: 3.5,
      attack: 0.004,
      release: 0.04,
    })
  })

  // The hydraulics taking the weight of whatever just stood up.
  swept(g, at + 0.4, 0.45, {
    type: 'sawtooth',
    from: 58,
    to: 38,
    peak: 0.09,
    attack: 0.09,
    release: 0.4,
    send: 0.35,
  })
  rush(g, at + 0.4, 0.4, {
    peak: 0.04,
    type: 'lowpass',
    cutoff: 700,
    sweepTo: 260,
    attack: 0.1,
    release: 0.3,
  })
}

/**
 * The Dowsing Chain's ball, brought down on a thing like a whip.
 *
 * A whip crack is three things in a fifth of a second and only three: the swish
 * of the chain coming round, which is a band of noise sweeping up as it gets
 * faster; the crack itself, which is a tip going supersonic and is therefore
 * broadband and almost instantaneous; and the ring of steel meeting whatever it
 * hit, which is the one part of this that is not air. Take away any of them and
 * it reads as a slap.
 */
export function crackAWhip() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The chain coming round: air, rising as the weight accelerates.
  rush(g, at, 0.11, {
    peak: 0.06,
    type: 'bandpass',
    cutoff: 700,
    sweepTo: 3200,
    q: 0.9,
    attack: 0.05,
    release: 0.03,
  })

  // The crack: everything at once, and gone.
  rush(g, at + 0.11, 0.02, {
    peak: 0.3,
    type: 'highpass',
    cutoff: 1800,
    sweepTo: 6000,
    attack: 0.001,
    release: 0.09,
    send: 0.55,
  })

  // And the steel that made it, which is what says this was a chain rather
  // than a length of leather: a short, hard ring on the ball itself.
  swept(g, at + 0.115, 0.06, {
    type: 'triangle',
    from: 2100,
    to: 1500,
    peak: 0.07,
    attack: 0.002,
    release: 0.16,
    send: 0.4,
  })
  swept(g, at + 0.115, 0.05, {
    type: 'sine',
    from: 3160,
    to: 2400,
    peak: 0.035,
    attack: 0.002,
    release: 0.12,
    send: 0.4,
  })
}

/**
 * Snake Arm biting a solid.
 *
 * A snake's hiss: a sudden, sharp band of high-frequency noise that decays quickly.
 */
export function hissLikeASnake() {
  const g = hatsuAudioGraph()
  if (!g) return
  const at = startsAt(g)

  // The initial strike/bite (quick and somewhat forceful)
  rush(g, at, 0.08, {
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
  rush(g, at + 0.04, 0.45, {
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
  rush(g, at, 1.15, {
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
  swept(g, at, 1.1, {
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
  swept(g, at + 0.05, 1, {
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
  rush(g, at + 0.95, 0.22, {
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
    swept(g, at + offset, length, {
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
  swept(g, at + 0.12, 0.4, {
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
  rush(g, at, 0.3, {
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
  swept(g, at + 0.1, 0.5, {
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
  swept(g, at, 0.75, {
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
