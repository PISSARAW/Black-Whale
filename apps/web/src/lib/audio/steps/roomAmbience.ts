import type { RoomSoundProfile } from '$lib/tour/roomSound'
import type { Vec2 } from '$lib/tour/types'

import { earLocal, type Facing } from '../ears'

const SETTLE = 0.45
const THROUGH_DOOR = 0.42
const DOOR_CUTOFF = 760
const VENT_WOBBLE_DEPTH = 85
const VENT_WOBBLE_RATE = 0.11
const VENT_WOBBLE_RATE_SPAN = 0.19

const SILENT: RoomSoundProfile = {
  kind: 'none',
  ventilation: { level: 0, cutoff: 1800, resonance: 0.4, wobble: 0 },
  crowd: { level: 0, cutoff: 500 },
  accent: { level: 0, frequency: 80, rate: 0.2, cutoff: 800 },
  drip: { level: 0, cutoff: 1200, rate: 0.75 },
}

interface RoomVoice {
  output: GainNode
  ventilation: {
    filter: BiquadFilterNode
    gain: GainNode
    wobble: { oscillator: OscillatorNode; depth: GainNode }
  }
  crowd: { filter: BiquadFilterNode; gain: GainNode }
  accent: {
    oscillator: OscillatorNode
    filter: BiquadFilterNode
    gain: GainNode
    pulse: OscillatorNode
    pulseDepth: GainNode
  }
  drip: { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode }
}

interface RoomBeds {
  noise: AudioBuffer
  drips: AudioBuffer
}

export interface RoomAmbience {
  context: AudioContext
  current: RoomVoice
  neighbour: RoomVoice
  neighbourWall: BiquadFilterNode
  neighbourLevel: GainNode
  neighbourPanner: PannerNode
  neighbourAt: Vec2 | null
}

/** Repeatable coloured noise: room ambience must not change identity on every visit. */
function noiseBuffer(context: AudioContext): AudioBuffer {
  const seconds = 5
  const buffer = context.createBuffer(
    1,
    Math.floor(context.sampleRate * seconds),
    context.sampleRate,
  )
  const channel = buffer.getChannelData(0)
  let state = 0x42d00d
  let pink = 0
  for (let index = 0; index < channel.length; index++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const white = (state / 4294967296) * 2 - 1
    pink += (white - pink) * 0.08
    channel[index] = pink
  }
  return buffer
}

/** A deterministic loop of decaying resonances: generated liquid, never a sample. */
function dripBuffer(context: AudioContext): AudioBuffer {
  const seconds = 8
  const buffer = context.createBuffer(
    1,
    Math.floor(context.sampleRate * seconds),
    context.sampleRate,
  )
  const channel = buffer.getChannelData(0)
  const starts = [0.37, 1.74, 3.08, 5.29, 6.63]
  const duration = 0.16
  for (const start of starts) {
    const first = Math.floor(start * context.sampleRate)
    const count = Math.floor(duration * context.sampleRate)
    let phase = 0
    for (let index = 0; index < count && first + index < channel.length; index++) {
      const age = index / context.sampleRate
      const envelope = Math.exp(-age * 34)
      const frequency = 1480 - age * 3200
      phase += (Math.PI * 2 * frequency) / context.sampleRate
      channel[first + index] += Math.sin(phase) * envelope * 0.72
    }
  }
  return buffer
}

function source(context: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const node = context.createBufferSource()
  node.buffer = buffer
  node.loop = true
  node.start()
  return node
}

function voice(context: AudioContext, beds: RoomBeds, into: AudioNode): RoomVoice {
  const output = context.createGain()
  output.gain.value = 1
  output.connect(into)

  const ventilationFilter = context.createBiquadFilter()
  ventilationFilter.type = 'bandpass'
  const ventilationGain = context.createGain()
  source(context, beds.noise).connect(ventilationFilter)
  ventilationFilter.connect(ventilationGain)
  ventilationGain.connect(output)
  const ventilationWobble = context.createOscillator()
  ventilationWobble.type = 'sine'
  const ventilationWobbleDepth = context.createGain()
  ventilationWobbleDepth.gain.value = 0
  ventilationWobble.connect(ventilationWobbleDepth)
  ventilationWobbleDepth.connect(ventilationFilter.frequency)
  ventilationWobble.start()

  const crowdFilter = context.createBiquadFilter()
  crowdFilter.type = 'lowpass'
  const crowdGain = context.createGain()
  source(context, beds.noise).connect(crowdFilter)
  crowdFilter.connect(crowdGain)
  crowdGain.connect(output)

  const accentOscillator = context.createOscillator()
  accentOscillator.type = 'triangle'
  const accentFilter = context.createBiquadFilter()
  accentFilter.type = 'lowpass'
  const accentGain = context.createGain()
  accentOscillator.connect(accentFilter)
  accentFilter.connect(accentGain)
  accentGain.connect(output)
  accentOscillator.start()

  // A slow amplitude drift makes a motor, pump or instrument bank breathe. It
  // never spells a rhythm and therefore never invents an event in the room.
  const pulse = context.createOscillator()
  pulse.type = 'sine'
  const pulseDepth = context.createGain()
  pulse.connect(pulseDepth)
  pulseDepth.connect(accentGain.gain)
  pulse.start()

  const dripSource = source(context, beds.drips)
  const dripFilter = context.createBiquadFilter()
  dripFilter.type = 'bandpass'
  dripFilter.Q.value = 2.2
  const dripGain = context.createGain()
  dripSource.connect(dripFilter)
  dripFilter.connect(dripGain)
  dripGain.connect(output)

  return {
    output,
    ventilation: {
      filter: ventilationFilter,
      gain: ventilationGain,
      wobble: { oscillator: ventilationWobble, depth: ventilationWobbleDepth },
    },
    crowd: { filter: crowdFilter, gain: crowdGain },
    accent: {
      oscillator: accentOscillator,
      filter: accentFilter,
      gain: accentGain,
      pulse,
      pulseDepth,
    },
    drip: { source: dripSource, filter: dripFilter, gain: dripGain },
  }
}

function tap(
  context: AudioContext,
  connection: { from: AudioNode; into: AudioNode; level: number },
): void {
  const gain = context.createGain()
  gain.gain.value = connection.level
  connection.from.connect(gain)
  gain.connect(connection.into)
}

/** Builds the two persistent beds: the room and one source behind a doorway. */
export function buildRoomAmbience(
  context: AudioContext,
  dry: AudioNode,
  roomSend: AudioNode,
): RoomAmbience {
  const beds = { noise: noiseBuffer(context), drips: dripBuffer(context) }

  const currentBus = context.createGain()
  tap(context, { from: currentBus, into: dry, level: 1 })
  tap(context, { from: currentBus, into: roomSend, level: 0.32 })

  const neighbourBus = context.createGain()
  const neighbourWall = context.createBiquadFilter()
  neighbourWall.type = 'lowpass'
  neighbourWall.frequency.value = DOOR_CUTOFF
  neighbourWall.Q.value = 0.55
  const neighbourLevel = context.createGain()
  neighbourLevel.gain.value = THROUGH_DOOR
  const neighbourPanner = context.createPanner()
  neighbourPanner.panningModel = 'HRTF'
  neighbourPanner.distanceModel = 'inverse'
  neighbourPanner.refDistance = 2
  neighbourPanner.rolloffFactor = 0.45
  neighbourPanner.maxDistance = 80
  neighbourBus.connect(neighbourWall)
  neighbourWall.connect(neighbourLevel)
  neighbourLevel.connect(neighbourPanner)
  tap(context, { from: neighbourPanner, into: dry, level: 1 })
  tap(context, { from: neighbourPanner, into: roomSend, level: 0.2 })

  const ambience = {
    context,
    current: voice(context, beds, currentBus),
    neighbour: voice(context, beds, neighbourBus),
    neighbourWall,
    neighbourLevel,
    neighbourPanner,
    neighbourAt: null,
  }
  const initial = { now: context.currentTime, seconds: 0.01 }
  applyVoice(ambience.current, SILENT, initial)
  applyVoice(ambience.neighbour, SILENT, initial)
  return ambience
}

interface Transition {
  now: number
  seconds: number
}

function target(param: AudioParam, value: number, transition: Transition): void {
  param.cancelScheduledValues(transition.now)
  param.setTargetAtTime(value, transition.now, Math.max(0.005, transition.seconds / 3))
}

function applyVoice(voice: RoomVoice, profile: RoomSoundProfile, transition: Transition): void {
  const wobble = Math.min(1, Math.max(0, profile.ventilation.wobble))
  target(voice.ventilation.gain.gain, profile.ventilation.level, transition)
  target(voice.ventilation.filter.frequency, profile.ventilation.cutoff, transition)
  target(voice.ventilation.filter.Q, profile.ventilation.resonance, transition)
  target(voice.ventilation.wobble.depth.gain, wobble * VENT_WOBBLE_DEPTH, transition)
  target(
    voice.ventilation.wobble.oscillator.frequency,
    VENT_WOBBLE_RATE + wobble * VENT_WOBBLE_RATE_SPAN,
    transition,
  )

  target(voice.crowd.gain.gain, profile.crowd.level, transition)
  target(voice.crowd.filter.frequency, profile.crowd.cutoff, transition)

  target(voice.accent.oscillator.frequency, profile.accent.frequency, transition)
  target(voice.accent.filter.frequency, profile.accent.cutoff, transition)
  target(voice.accent.gain.gain, profile.accent.level, transition)
  target(voice.accent.pulse.frequency, profile.accent.rate, transition)
  target(voice.accent.pulseDepth.gain, profile.accent.level * 0.28, transition)

  target(voice.drip.gain.gain, profile.drip.level, transition)
  target(voice.drip.filter.frequency, profile.drip.cutoff, transition)
  target(voice.drip.source.playbackRate, profile.drip.rate, transition)
}

/** Crossfades the persistent controls without rebuilding any oscillator. */
export function settleRoomAmbience(
  ambience: RoomAmbience,
  current: RoomSoundProfile,
  neighbour: { profile: RoomSoundProfile; at: Vec2 } | null,
): void {
  const now = ambience.context.currentTime
  const transition = { now, seconds: SETTLE }
  applyVoice(ambience.current, current, transition)
  applyVoice(ambience.neighbour, neighbour?.profile ?? SILENT, transition)
  ambience.neighbourAt = neighbour?.at ?? null
  target(ambience.neighbourLevel.gain, neighbour ? THROUGH_DOOR : 0, transition)
}

/** Keeps the doorway source aligned with the same listener axes as hull and sea. */
export function orientRoomAmbience(ambience: RoomAmbience, listener: Facing & { at: Vec2 }): void {
  const at = ambience.neighbourAt
  if (!at) return
  const local = earLocal({ x: at[0] - listener.at[0], y: 0, z: at[1] - listener.at[1] }, listener)
  const now = ambience.context.currentTime
  ambience.neighbourPanner.positionX.setTargetAtTime(local.x, now, 0.05)
  ambience.neighbourPanner.positionY.setTargetAtTime(local.y, now, 0.05)
  ambience.neighbourPanner.positionZ.setTargetAtTime(local.z, now, 0.05)
}
