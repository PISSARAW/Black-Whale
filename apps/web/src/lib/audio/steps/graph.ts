import { HULL_FUNDAMENTAL, hullNoise, hullRumble } from '$lib/tour/atmosphere'

/**
 * One AudioContext for the walk, and the state that has to survive it.
 *
 * The deck the visitor stands on and whether their hearing is sealed are known
 * before there is a graph and remembered after it is gone — the walk can be
 * silenced on Tier 5 and turned back on from a button that knows nothing about
 * where they are. So the state lives here, with the graph it configures, and
 * the rooms, the voices and the toggle read it through these accessors.
 */

/** How long a change of room takes to be heard, in seconds. */
export const CROSSFADE = 0.4

/**
 * What the loudest deck of the ship mixes the hull at.
 *
 * Under the footsteps by design: at Tier 5 the rumble is the floor of the mix and
 * a boot on the plate still lands on top of it. `hullRumble` gives the fraction of
 * this each elevation gets, from 1 in the hold to 0,12 in the King's rooms.
 */
export const HULL_GAIN = 0.16

/**
 * Seconds of pink noise in the loop.
 *
 * Long enough that the ear cannot find the period — under two seconds a noise
 * loop is heard as a texture repeating — and short enough that the buffer is a few
 * hundred kilobytes rather than a few megabytes. `hullNoise` folds its ends
 * together, so the length is a question of period and not of the seam.
 */
export const HULL_LOOP = 4

/** The deck the damping starts at, before the walk says where the visitor is. */
export const HULL_DECK_DEFAULT = hullRumble(0)

/** How long the hull takes to change when the visitor changes deck, in seconds. */
export const HULL_SETTLE = 2.5

type Room = {
  convolver: ConvolverNode
  gain: GainNode
}

export type Graph = {
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

/** The live graph, or null while the walk is silent. */
export const currentGraph = () => graph

/** The toggle builds it on start and gives it up on stop. */
export function setCurrentGraph(next: Graph | null) {
  graph = next
}

export const currentRoomKey = () => roomKey

export function setCurrentRoomKey(id: string) {
  roomKey = id
}

export const currentDeckElevation = () => deckElevation

export function setCurrentDeckElevation(elevation: number) {
  deckElevation = elevation
}

/** Whether hearing is sealed, which a graph built later still has to be told. */
export const isMuffled = () => muffled

export function buildGraph(): Graph {
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

export function applyMuffle(g: Graph, on: boolean, seconds: number) {
  const now = g.context.currentTime
  g.muffle.frequency.cancelScheduledValues(now)
  g.muffle.frequency.setTargetAtTime(on ? 210 : auraQuiet ? 4200 : 18000, now, seconds / 3)
  g.master.gain.cancelScheduledValues(now)
  g.master.gain.setTargetAtTime(on ? 0.12 : auraQuiet ? 0.075 : 0.9, now, seconds / 3)
}

/**
 * Starts the walk's sound. Called from the gesture that engages the walk, so the
 * browser has already given us permission to make a noise.

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
