import { PLATE, type Footing } from '$lib/tour/footing'

import { currentGraph } from './graph'

/**
 * One footstep, timbred by what it lands on.
 *
 * A boot on a floor is a broadband transient with a short pitched ring after it:
 * the noise burst through a bandpass is the sole striking the surface, the low
 * sine is the surface itself answering. Both go into the room, which is where the
 * *size* of it comes from — the same step in the hold and in a cabin is
 * unmistakably two different sounds — and `footing` is where the *material* comes
 * from, which until now the walk had no way of saying at all.
 *
 * `index` is the number of the pace, from `stepsIn`. Alternate paces are the
 * other foot, and are pitched and weighted a shade differently, because a walk
 * of identical clicks is heard as a machine. `floor` is what the deck is made of
 * under this room — see `$lib/tour/footing`, which derives it — and defaults to
 * bare plate, which is the ship as built and most of what is on it.
 */
export function footstep(index: number, options: { running?: boolean; floor?: Footing } = {}) {
  const g = currentGraph()
  if (!g) return
  const { context } = g
  if (context.state === 'suspended') return

  const floor = options.floor ?? PLATE
  const at = context.currentTime + 0.005
  const other = index % 2 === 1
  const force = options.running ? 1 : 0.55
  const level = force * (other ? 0.85 : 1) * floor.level

  const burst = context.createBufferSource()
  burst.buffer = g.grit
  // A different slice of the noise every step, so no two are the same sample.
  const offset = (index * 0.137) % 0.8

  const band = context.createBiquadFilter()
  band.type = 'bandpass'
  // The two feet a little either side of the floor's own band: the same pair of
  // boots, not two floors.
  band.frequency.value = floor.band * (other ? 0.92 : 1.08)
  band.Q.value = floor.q

  const envelope = context.createGain()
  envelope.gain.setValueAtTime(0.0001, at)
  envelope.gain.exponentialRampToValueAtTime(0.28 * level, at + floor.attack)
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + floor.attack + floor.decay)

  burst.connect(band)
  band.connect(envelope)
  envelope.connect(g.dry)
  envelope.connect(g.send)
  const span = floor.attack + floor.decay + 0.04
  burst.start(at, offset, span)
  burst.stop(at + span)

  // The floor under the boot. Steel rings low and briefly, stone lower and
  // longer, carpet barely at all; a running step lands harder and drops further.
  const plate = context.createOscillator()
  plate.type = 'sine'
  plate.frequency.setValueAtTime(floor.ring * (other ? 0.92 : 1), at)
  plate.frequency.exponentialRampToValueAtTime(floor.ring * 0.58, at + floor.decay * 0.75)
  const thud = context.createGain()
  thud.gain.setValueAtTime(0.0001, at)
  thud.gain.exponentialRampToValueAtTime(floor.ringLevel * force, at + 0.008)
  thud.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.05, floor.decay * 0.85))
  plate.connect(thud)
  thud.connect(g.dry)
  thud.connect(g.send)
  plate.start(at)
  plate.stop(at + span)
}

/**
 * The sound of ten seconds being taken back.
 *
 * Tape, not a chime: a band of the same grit the footsteps are cut from, played
 * fast and backwards, over a tone that falls the way a spool does when it is
 * let go. It is synthesised like everything else the walk makes — the archive
 * ships no audio, and a rewind that arrived as an .mp3 would be the only sound
 * aboard that was not the ship's own.
 */
export function rewindSound(seconds = 1.1) {
  const g = currentGraph()
  if (!g) return
  const { context } = g
  if (context.state === 'suspended') return
  const at = context.currentTime + 0.005

  // The spool: noise run backwards through a filter that opens as it goes, so
  // the ear hears the tape being pulled rather than a hiss.
  const spool = context.createBufferSource()
  spool.buffer = g.grit
  spool.playbackRate.setValueAtTime(-2.4, at)
  spool.loop = true
  const band = context.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(600, at)
  band.frequency.exponentialRampToValueAtTime(3200, at + seconds * 0.8)
  band.Q.value = 3
  const level = context.createGain()
  level.gain.setValueAtTime(0.0001, at)
  level.gain.exponentialRampToValueAtTime(0.22, at + 0.05)
  level.gain.exponentialRampToValueAtTime(0.0001, at + seconds)
  spool.connect(band)
  band.connect(level)
  level.connect(g.dry)
  level.connect(g.send)
  // A negative rate needs somewhere to play back *from*, so it starts at the
  // end of the buffer. Browsers that refuse it simply play it forward, which is
  // still a spool.
  try {
    spool.start(at, Math.max(0, g.grit.duration - 0.05))
  } catch {
    spool.playbackRate.setValueAtTime(2.4, at)
    spool.start(at)
  }
  spool.stop(at + seconds)

  // And the machine under it, falling away as the reel runs back.
  const motor = context.createOscillator()
  motor.type = 'sawtooth'
  motor.frequency.setValueAtTime(320, at)
  motor.frequency.exponentialRampToValueAtTime(70, at + seconds)
  const hum = context.createGain()
  hum.gain.setValueAtTime(0.0001, at)
  hum.gain.exponentialRampToValueAtTime(0.06, at + 0.04)
  hum.gain.exponentialRampToValueAtTime(0.0001, at + seconds)
  motor.connect(hum)
  hum.connect(g.dry)
  motor.start(at)
  motor.stop(at + seconds)
}
