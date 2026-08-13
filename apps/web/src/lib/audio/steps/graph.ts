import type { Facing } from '../ears'
import { sharedAudioContext } from '../context'
import { outputBus } from '../output'
import { buildEnvironment, type Environment } from './environment'

/**
 * The walk's graph, and the state that has to survive it.
 *
 * The deck the visitor stands on and whether their hearing is sealed are known
 * before there is a graph and remembered after it is gone — the walk can be
 * silenced on Tier 5 and turned back on from a button that knows nothing about
 * where they are. So the state lives here, with the graph it configures, and
 * the rooms, the voices and the toggle read it through these accessors.
 */

/** How long a change of room takes to be heard, in seconds. */
export const CROSSFADE = 0.4

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
  /** The machinery and the water: continuous, placed, and not made in a room. */
  env: Environment
}

let graph: Graph | null = null
let muffled = false
let auraQuiet = false
/** The room last handed to `enterRoom`, so an unchanged room is not rebuilt. */
let roomKey = ''
/** The deck last handed to `enterDeck`, so a graph built later still knows it. */
let deckElevation = 0
/** And the way the visitor was facing, for the same reason and a sharper one:
 * they can turn to face the stern, then switch the walk's sound on, and the
 * engines would come up dead ahead if nobody had kept this. */
let facing: Facing = { heading: 0, pitch: 0 }

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

export const currentFacing = () => facing

export function setCurrentFacing(next: Facing) {
  facing = next
}

/** Whether hearing is sealed, which a graph built later still has to be told. */
export const isMuffled = () => muffled

export function buildGraph(): Graph {
  // The ship's one context, shared with the theme and with every technique —
  // which is what lets a cast be fed into `send` below and come back out of the
  // room it was made in. See `../context`.
  const context = sharedAudioContext()
  if (!context) throw new Error('no Web Audio')

  const master = context.createGain()
  master.gain.value = 0.9

  // Sealed hearing is the same lowpass the theme uses, for the same reason: the
  // ship is still making its noises and the visitor has stopped receiving them.
  const muffle = context.createBiquadFilter()
  muffle.type = 'lowpass'
  muffle.frequency.value = 18000
  muffle.Q.value = 0.4
  muffle.connect(master)
  master.connect(outputBus('walk') ?? context.destination)

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

  // The machinery and the sea, both silent until the walk says which deck this
  // is. They hang off `muffle` like everything else, so sealed hearing takes
  // them too, and they are the one part of the graph that is placed in three
  // dimensions rather than mixed flat. See `./environment`.
  const env = buildEnvironment(context, muffle)

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
    env,
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
