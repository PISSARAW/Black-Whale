import { writable } from 'svelte/store'
import {
  HULL_FUNDAMENTAL,
  MAX_REVERB,
  MIN_REVERB,
  hullNoise,
  hullRumble,
  impulseResponse,
  slapDelay,
} from '$lib/tour/atmosphere'
import { PLATE, type Footing } from '$lib/tour/footing'

/**
 * The sound of the walk: footsteps, the room answering them, and the hull under
 * all of it.
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
 *
 * The hull is here rather than in `$lib/audio/ambient` for the same reason the
 * footsteps are. The voyage theme is a soundtrack over the archive, off until
 * someone asks for it; the machinery is a thing aboard the ship, and it belongs to
 * whatever else the walk makes audible — one `AudioContext`, one toggle, and the
 * same lowpass when a technique seals hearing. See `hullRumble` for what it is
 * keyed to, which is the deck's own elevation.
 */

const ENABLED_KEY = 'black-whale:tour-sound'

/** Whether the walk is currently audible, for the button that says so. */
export const stepsPlaying = writable(false)

/** How long a change of room takes to be heard, in seconds. */
const CROSSFADE = 0.4

/**
 * What the loudest deck of the ship mixes the hull at.
 *
 * Under the footsteps by design: at Tier 5 the rumble is the floor of the mix and
 * a boot on the plate still lands on top of it. `hullRumble` gives the fraction of
 * this each elevation gets, from 1 in the hold to 0,12 in the King's rooms.
 */
const HULL_GAIN = 0.16

/**
 * Seconds of pink noise in the loop.
 *
 * Long enough that the ear cannot find the period — under two seconds a noise
 * loop is heard as a texture repeating — and short enough that the buffer is a few
 * hundred kilobytes rather than a few megabytes. `hullNoise` folds its ends
 * together, so the length is a question of period and not of the seam.
 */
const HULL_LOOP = 4

/** The deck the damping starts at, before the walk says where the visitor is. */
const HULL_DECK_DEFAULT = hullRumble(0)

/** How long the hull takes to change when the visitor changes deck, in seconds. */
const HULL_SETTLE = 2.5

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
  /** How loud the machinery is where the visitor is standing. */
  hull: GainNode
  /** How much of it the decks between here and the engines let through. */
  hullDamp: BiquadFilterNode
}

let graph: Graph | null = null
let muffled = false
let auraQuiet = false
/** The room last handed to `enterRoom`, so an unchanged room is not rebuilt. */
let roomKey = ''
/** The deck last handed to `enterDeck`, so a graph built later still knows it. */
let deckElevation = 0

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

  /**
   * The hull: the engines, heard through however many decks are between.
   *
   * Two voices into one gain. The sine at `HULL_FUNDAMENTAL` is the machinery
   * itself — a single very low note, more felt than heard, and the thing that
   * makes a pair of headphones say "ship" — and the pink bed around it is
   * everything the note drives: plate, ducting, the four thousand rooms it is
   * transmitted through. Both are shaped by one lowpass, because what changes
   * with elevation is not the engine but how much of it survives the steel.
   *
   * Outside the convolvers on purpose. The reverberation is what a *room* does to
   * a sound made in it; the rumble is not made in the room, it arrives through
   * its walls, and running it through the hold's four-second tail would smear a
   * continuous noise into a continuous noise at more cost. It goes through
   * `muffle`, so sealing hearing seals the ship too.
   *
   * Started silent: the level is set the moment the walk knows which deck the
   * visitor is standing on. See `enterDeck`.
   */
  const hullDamp = context.createBiquadFilter()
  hullDamp.type = 'lowpass'
  hullDamp.frequency.value = HULL_DECK_DEFAULT.cutoff
  hullDamp.Q.value = 0.7

  const hull = context.createGain()
  hull.gain.value = 0
  hullDamp.connect(hull)
  hull.connect(muffle)

  const bed = context.createBufferSource()
  const pink = context.createBuffer(
    1,
    Math.floor(HULL_LOOP * context.sampleRate),
    context.sampleRate,
  )
  pink.copyToChannel(hullNoise(HULL_LOOP, context.sampleRate), 0)
  bed.buffer = pink
  bed.loop = true
  const bedLevel = context.createGain()
  bedLevel.gain.value = 0.6
  bed.connect(bedLevel)
  bedLevel.connect(hullDamp)
  bed.start()

  const engine = context.createOscillator()
  engine.type = 'sine'
  engine.frequency.value = HULL_FUNDAMENTAL
  const engineLevel = context.createGain()
  engineLevel.gain.value = 0.5
  engine.connect(engineLevel)
  engineLevel.connect(hullDamp)
  engine.start()

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
    hull,
    hullDamp,
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
 * Puts the visitor on a deck: how much of the machinery reaches this elevation.
 *
 * Called with the elevation of the level being walked, which for an interior is
 * the elevation of the deck it is inside — a prince's bathroom is seventy-two
 * metres up whatever the room plan is drawn at.
 *
 * Eased over `HULL_SETTLE`, which is slow on purpose and much slower than the
 * crossfade between two rooms. A lift or a stairwell is the one place on the ship
 * where a visitor changes deck, and the rumble coming up to meet them over a
 * couple of seconds is the whole cue: you hear that you are descending. Cut
 * instantly it would read as a bug in the audio, which is what every abrupt gain
 * change reads as.
 */
export function enterDeck(elevation: number) {
  // Remembered whether or not there is a graph to tell: the visitor can silence
  // the walk on Tier 5, cross half the ship, and turn it back on from a button in
  // the markup that has no idea which deck they are standing on. `startSteps`
  // reads this back, so the deck the rumble describes is the deck they are on.
  deckElevation = elevation
  const g = graph
  if (!g) return
  const { level, cutoff } = hullRumble(elevation)
  const now = g.context.currentTime

  g.hull.gain.cancelScheduledValues(now)
  g.hull.gain.setTargetAtTime(level * HULL_GAIN, now, HULL_SETTLE / 3)
  g.hullDamp.frequency.cancelScheduledValues(now)
  g.hullDamp.frequency.setTargetAtTime(cutoff, now, HULL_SETTLE / 3)
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
  const g = graph
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
  const g = graph
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

function applyMuffle(g: Graph, on: boolean, seconds: number) {
  const now = g.context.currentTime
  g.muffle.frequency.cancelScheduledValues(now)
  g.muffle.frequency.setTargetAtTime(on ? 210 : auraQuiet ? 4200 : 18000, now, seconds / 3)
  g.master.gain.cancelScheduledValues(now)
  g.master.gain.setTargetAtTime(on ? 0.12 : auraQuiet ? 0.075 : 0.9, now, seconds / 3)
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
  // The hull swells in from silence over `HULL_SETTLE` on the deck the visitor is
  // actually standing on, which nothing but this module remembers.
  enterDeck(deckElevation)
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

/** Zetsu suppresses the user's presence: footsteps and transmitted hull noise recede together. */
export function setStepsAuraQuiet(on: boolean) {
  auraQuiet = on
  if (graph) applyMuffle(graph, muffled, 0.22)
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
