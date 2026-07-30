import { writable } from 'svelte/store'
import { MAX_REVERB, MIN_REVERB, impulseResponse, slapDelay } from '$lib/tour/atmosphere'

/**
 * The sound of the walk: footsteps, and the room answering them.
 *
 * Nothing here is a recording. The steps are synthesised the way the voyage
 * theme is — see `$lib/audio/ambient` — and the room is a convolution
 * reverberation whose impulse response is computed from the volume
 * `data/ship/blueprint.json` already gives, by Sabine's equation, in
 * `$lib/tour/atmosphere`. The whole feature adds no asset to the page, no
 * triangle to the deck and no field to the blueprint.
 *
 * It is also the only part of the reconstruction that tells the visitor the size
 * of a room without their having to walk its length: the ear sizes a space from
 * the first reflection off the walls, and it does it in one footstep. A cabin and
 * the hold differ here by a factor of about six in reverberation time, which is
 * not a subtlety — it is the difference between a slap and a rumble.
 */

const ENABLED_KEY = 'black-whale:tour-sound'

/** Whether the walk is currently audible, for the button that says so. */
export const stepsPlaying = writable(false)

/** How long a change of room takes to be heard, in seconds. */
const CROSSFADE = 0.4

type Room = {
  convolver: ConvolverNode
  gain: GainNode
}

type Graph = {
  context: AudioContext
  /** Everything goes through here, so sealed hearing has one place to squeeze. */
  muffle: BiquadFilterNode
  master: GainNode
  /** The step itself, unreflected. */
  dry: GainNode
  /** What is sent into whichever room is currently faded up. */
  send: GainNode
  /** The single early reflection off the nearest wall. */
  slap: DelayNode
  slapLevel: GainNode
  /** Two rooms, so one can be built while the other is still ringing. */
  rooms: [Room, Room]
  /** Which of the two is the room the visitor is standing in. */
  current: 0 | 1
  /** A second of noise, made once and re-read by every step. */
  grit: AudioBuffer
}

let graph: Graph | null = null
let muffled = false
/** The room last handed to `enterRoom`, so an unchanged room is not rebuilt. */
let roomKey = ''

function buildGraph(): Graph {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const context = new Ctor()

  const master = context.createGain()
  master.gain.value = 0.9

  // Sealed hearing is the same lowpass the theme uses, for the same reason: the
  // ship is still making its noises and the visitor has stopped receiving them.
  const muffle = context.createBiquadFilter()
  muffle.type = 'lowpass'
  muffle.frequency.value = 18000
  muffle.Q.value = 0.4
  muffle.connect(master)
  master.connect(context.destination)

  const dry = context.createGain()
  dry.gain.value = 0.8
  dry.connect(muffle)

  const send = context.createGain()
  send.gain.value = 1

  // A delay long enough for the far wall of the banquet hall: `slapDelay` caps
  // the round trip at half a second, so this never has to grow.
  const slap = context.createDelay(0.6)
  slap.delayTime.value = 0.02
  const slapLevel = context.createGain()
  slapLevel.gain.value = 0.35
  send.connect(slap)
  slap.connect(slapLevel)
  slapLevel.connect(muffle)

  const makeRoom = (): Room => {
    const convolver = context.createConvolver()
    // Left on: it holds the level steady as the tail lengthens, so walking from
    // a cabin into the hold is heard as a change of room and not of volume.
    convolver.normalize = true
    const gain = context.createGain()
    gain.gain.value = 0
    send.connect(convolver)
    convolver.connect(gain)
    gain.connect(muffle)
    return { convolver, gain }
  }

  // One second of noise, read from a different offset by every step: a fresh
  // buffer per footstep would allocate on the audio thread a few times a second.
  const grit = context.createBuffer(1, context.sampleRate, context.sampleRate)
  const channel = grit.getChannelData(0)
  for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1

  return {
    context,
    muffle,
    master,
    dry,
    send,
    slap,
    slapLevel,
    rooms: [makeRoom(), makeRoom()],
    current: 0,
    grit,
  }
}

/**
 * A hash of the room's name, so its impulse response is the same every visit.
 *
 * The tail is seeded noise; seeding it on the identifier means the burial
 * chamber always answers with the burial chamber's noise rather than with
 * whatever the previous room left in the generator.
 */
function seedOf(id: string): number {
  let hash = 2166136261
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * Puts the visitor in a room: builds its impulse response and crossfades to it.
 *
 * The two convolvers take it in turns. Assigning a buffer to the one that is
 * still sounding cuts its tail off mid-ring, which is heard as a click at every
 * doorway; assigning it to the idle one and crossfading means the corridor rings
 * out while the hall opens up, which is what walking through a door sounds like.
 */
export function enterRoom(id: string, reverb: number, wallDistance: number) {
  const g = graph
  if (!g) return
  if (id === roomKey) return
  roomKey = id

  const next = g.current === 0 ? 1 : 0
  const rt60 = Math.min(MAX_REVERB, Math.max(MIN_REVERB, reverb))
  const now = g.context.currentTime

  const response = impulseResponse(rt60, g.context.sampleRate, {
    seed: seedOf(id),
    reflections: [slapDelay(wallDistance), slapDelay(wallDistance * 2.4)],
  })
  const buffer = g.context.createBuffer(1, response.length, g.context.sampleRate)
  buffer.copyToChannel(response, 0)
  g.rooms[next].convolver.buffer = buffer

  // A long tail is a bigger part of what is heard: in the hold the reflections
  // arrive before the step has finished, in a cabin they are a detail on it.
  const wet = 0.3 + Math.min(0.45, (rt60 - MIN_REVERB) * 0.18)
  g.rooms[next].gain.gain.cancelScheduledValues(now)
  g.rooms[next].gain.gain.setTargetAtTime(wet, now, CROSSFADE / 3)
  g.rooms[g.current].gain.gain.cancelScheduledValues(now)
  g.rooms[g.current].gain.gain.setTargetAtTime(0, now, CROSSFADE / 3)
  g.current = next

  g.slap.delayTime.cancelScheduledValues(now)
  g.slap.delayTime.setTargetAtTime(slapDelay(wallDistance), now, CROSSFADE / 3)
}

/**
 * Where the walls are this instant, without changing rooms.
 *
 * The reverberation belongs to the room and does not move, but the first
 * reflection does: crossing a hall, the near wall goes from two metres away to
 * fifty, and the ear hears that as the room opening up around it.
 */
export function nearWall(wallDistance: number) {
  const g = graph
  if (!g) return
  const now = g.context.currentTime
  g.slap.delayTime.setTargetAtTime(slapDelay(wallDistance), now, 0.25)
}

/**
 * One footstep.
 *
 * A boot on steel plate is a broadband transient with a short pitched ring after
 * it: the noise burst through a bandpass is the sole hitting the plate, the low
 * sine is the plate itself. Both are two hundred milliseconds of envelope, and
 * both go into the room, which is where all the character of it comes from — the
 * same step in the hold and in a cabin is unmistakably two different sounds.
 *
 * `index` is the number of the pace, from `stepsIn`. Alternate paces are the
 * other foot, and are pitched and weighted a shade differently, because a walk
 * of identical clicks is heard as a machine.
 */
export function footstep(index: number, options: { running?: boolean } = {}) {
  const g = graph
  if (!g) return
  const { context } = g
  if (context.state === 'suspended') return

  const at = context.currentTime + 0.005
  const other = index % 2 === 1
  const force = options.running ? 1 : 0.55
  const level = force * (other ? 0.85 : 1)

  const burst = context.createBufferSource()
  burst.buffer = g.grit
  // A different slice of the noise every step, so no two are the same sample.
  const offset = (index * 0.137) % 0.8

  const band = context.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = other ? 1900 : 2300
  band.Q.value = 0.9

  const envelope = context.createGain()
  envelope.gain.setValueAtTime(0.0001, at)
  envelope.gain.exponentialRampToValueAtTime(0.28 * level, at + 0.006)
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.16)

  burst.connect(band)
  band.connect(envelope)
  envelope.connect(g.dry)
  envelope.connect(g.send)
  burst.start(at, offset, 0.2)
  burst.stop(at + 0.2)

  // The plate under the boot. Steel rings low and briefly; a running step lands
  // harder and rings a little lower for it.
  const plate = context.createOscillator()
  plate.type = 'sine'
  plate.frequency.setValueAtTime(other ? 96 : 104, at)
  plate.frequency.exponentialRampToValueAtTime(58, at + 0.12)
  const thud = context.createGain()
  thud.gain.setValueAtTime(0.0001, at)
  thud.gain.exponentialRampToValueAtTime(0.16 * force, at + 0.008)
  thud.gain.exponentialRampToValueAtTime(0.0001, at + 0.13)
  plate.connect(thud)
  thud.connect(g.dry)
  thud.connect(g.send)
  plate.start(at)
  plate.stop(at + 0.2)
}

function applyMuffle(g: Graph, on: boolean, seconds: number) {
  const now = g.context.currentTime
  g.muffle.frequency.cancelScheduledValues(now)
  g.muffle.frequency.setTargetAtTime(on ? 210 : 18000, now, seconds / 3)
  g.master.gain.cancelScheduledValues(now)
  g.master.gain.setTargetAtTime(on ? 0.12 : 0.9, now, seconds / 3)
}

/**
 * Starts the walk's sound. Called from the gesture that engages the walk, so the
 * browser has already given us permission to make a noise.
 */
export function startSteps() {
  if (typeof window === 'undefined') return
  if (!graph) {
    // A walk must never fail because the browser has no Web Audio: the ship is
    // still there, it is just silent.
    try {
      graph = buildGraph()
    } catch {
      return
    }
    applyMuffle(graph, muffled, 0.05)
  }
  if (graph.context.state === 'suspended') void graph.context.resume()
  stepsPlaying.set(true)
  if (typeof localStorage !== 'undefined') localStorage.setItem(ENABLED_KEY, 'on')
}

/** Silences the walk, and forgets which room it was in so returning rebuilds it. */
export function stopSteps() {
  if (graph) {
    const context = graph.context
    const held = graph
    graph = null
    roomKey = ''
    const now = context.currentTime
    held.master.gain.cancelScheduledValues(now)
    held.master.gain.setTargetAtTime(0.0001, now, 0.15)
    // Let whatever is ringing ring out before the context goes away, or the
    // silence starts with a click.
    setTimeout(() => {
      if (!graph) void context.close()
    }, 1200)
  }
  stepsPlaying.set(false)
  if (typeof localStorage !== 'undefined') localStorage.setItem(ENABLED_KEY, 'off')
}

export function toggleSteps() {
  if (graph) stopSteps()
  else startSteps()
}

/** Three Monkeys' second strike seals hearing: the deck goes underwater too. */
export function setStepsMuffled(on: boolean) {
  muffled = on
  if (graph) applyMuffle(graph, on, 0.9)
}

/**
 * Whether the visitor has silenced the walk before.
 *
 * Unlike the voyage theme, this is on unless it was turned off: footsteps and the
 * room answering them are part of the walk rather than a soundtrack over it, and
 * a visitor who has never touched the button should hear the ship. Nothing sounds
 * until they engage the walk, which is a gesture and their own doing.
 */
export function stepsWereSilenced(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(ENABLED_KEY) === 'off'
}
