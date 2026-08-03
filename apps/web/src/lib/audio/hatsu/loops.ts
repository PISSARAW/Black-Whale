import { hatsuAudioGraph } from '../ambient'

import { type Held, noiseBuffer, rush, startsAt, swept } from './synth'
// The requiem is written music rather than a loop, but it runs until it is
// stopped and `stopEveryHatsuLoop` is what stops everything that runs.
import { stopRequiem } from './music'

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
    rush(g, at + i * 0.13, {
      duration: 0.1,
      peak: 0.07,
      type: 'lowpass',
      cutoff: 420,
      sweepTo: 260,
      q: 1.4,
      attack: 0.01,
      release: 0.05,
    })
    swept(g, at + i * 0.13, {
      duration: 0.1,
      type: 'sawtooth',
      from: 78,
      to: 44,
      peak: 0.08,
      release: 0.06,
    })
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
