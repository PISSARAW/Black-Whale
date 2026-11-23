import type { Graph } from '$lib/audio/ambient/mixer'
import { outputBus } from '$lib/audio/output'
import { noiseBuffer } from '$lib/audio/hatsu/synth'
import { impulseResponse } from '$lib/tour/atmosphere'
import { STAGE_SOUNDS, type StageSoundProfile } from './stages'
import type { FightAudioSettings, FightChannel } from './settings'
import type { FightStageId } from '../stages'

interface Voice {
  priority: number
  graph: Graph
  nodes: AudioNode[]
  sources: Set<AudioScheduledSourceNode>
  timer: ReturnType<typeof setTimeout>
}

type MixChannel = Exclude<FightChannel, 'cinematics'>
const EXTRA_CHANNELS = [
  'movement',
  'techniques',
  'voices',
  'announcer',
  'interface',
  'music',
] as const

export interface FightMix {
  context: AudioContext
  effects: GainNode
  ambience: GainNode
  pressure: GainNode
  profile: StageSoundProfile
  channels: Record<MixChannel, GainNode>
  event: (x: number, bus?: MixChannel, priority?: number) => Graph | null
  configure: (settings: FightAudioSettings, duck: number) => void
  hearing: readonly AudioParam[]
  setActive: (active: boolean) => void
  dispose: () => void
}

/** Mode-owned graph, shared context and faders; never borrows the tour's room. */
export function createFightMix(context: AudioContext, stageId: FightStageId): FightMix {
  const profile = STAGE_SOUNDS[stageId]
  const effects = context.createGain()
  const ambience = context.createGain()
  const pressure = context.createGain()
  const gateEffects = context.createGain()
  const gateAmbient = context.createGain()
  const hearing = context.createBiquadFilter()
  hearing.type = 'lowpass'
  hearing.frequency.value = 18000
  const extra = Object.fromEntries(
    EXTRA_CHANNELS.map((channel) => {
      const node = context.createGain()
      node.connect(channel === 'music' ? gateAmbient : gateEffects)
      return [channel, node]
    }),
  ) as Record<(typeof EXTRA_CHANNELS)[number], GainNode>
  const channels = { effects, ambience, tension: pressure, ...extra }
  effects.connect(gateEffects)
  ambience.connect(gateAmbient)
  const hearingAmbient = context.createBiquadFilter()
  hearingAmbient.type = 'lowpass'
  hearingAmbient.frequency.value = 18000
  gateEffects.connect(hearing).connect(outputBus('effects')!)
  gateAmbient.connect(hearingAmbient).connect(outputBus('ambient')!)
  pressure.connect(gateAmbient)
  const room = context.createConvolver()
  const wet = context.createGain()
  const response = impulseResponse(profile.room, context.sampleRate, { seed: 194 + stageId.length })
  const impulse = context.createBuffer(1, response.length, context.sampleRate)
  impulse.copyToChannel(response, 0)
  room.buffer = impulse
  wet.gain.value = profile.wet
  room.connect(wet).connect(effects)
  const voices: Voice[] = []
  const disconnectVoice = (voice: Voice) => {
    clearTimeout(voice.timer)
    voice.graph.master.gain.setTargetAtTime(0, context.currentTime, 0.008)
    voice.sources.forEach((source) => source.stop(context.currentTime + 0.04))
    setTimeout(() => voice.nodes.forEach((node) => node.disconnect()), 60)
    const index = voices.indexOf(voice)
    if (index >= 0) voices.splice(index, 1)
  }
  const event: FightMix['event'] = (x, bus = 'effects', priority = 1) => {
    if (voices.length >= 32) {
      const weakest = voices.reduce((oldest, voice) =>
        voice.priority < oldest.priority ? voice : oldest,
      )
      if (weakest.priority > priority) return null
      disconnectVoice(weakest)
    }
    const muffle = context.createBiquadFilter()
    muffle.type = 'lowpass'
    muffle.frequency.value = 14000
    const air = context.createBiquadFilter()
    air.type = 'highshelf'
    air.frequency.value = 4000
    air.gain.value = -3
    const master = context.createGain()
    master.gain.value = 0.65
    const panner = context.createStereoPanner()
    panner.pan.value = Math.max(-0.8, Math.min(0.8, (x - 50) / 62.5))
    const send = context.createGain()
    send.gain.value = 0.22
    muffle.connect(air).connect(master).connect(panner)
    panner.connect(channels[bus])
    if (bus === 'effects') panner.connect(send).connect(room)
    const reverbSend = context.createGain()
    reverbSend.gain.value = 0.12
    reverbSend.connect(master)
    const sources = new Set<AudioScheduledSourceNode>()
    const registerSource = (source: AudioScheduledSourceNode) => {
      sources.add(source)
      source.addEventListener(
        'ended',
        () => {
          sources.delete(source)
          if (!sources.size && voices.includes(voice)) disconnectVoice(voice)
        },
        { once: true },
      )
    }
    const graph = {
      context,
      muffle,
      air,
      master,
      reverbSend,
      oneShotTarget: muffle,
      registerSource,
    }
    const nodes = [muffle, air, master, panner, send, reverbSend]
    const voice: Voice = {
      priority,
      graph,
      nodes,
      sources,
      timer: setTimeout(() => disconnectVoice(voice), 10000),
    }
    voices.push(voice)
    return graph
  }
  let active = true
  const setActive = (next: boolean) => {
    if (next === active) return
    active = next
    if (!active) voices.slice().forEach(disconnectVoice)
    const now = context.currentTime
    for (const node of [gateEffects, gateAmbient])
      node.gain.setTargetAtTime(active ? 1 : 0, now, 0.025)
  }
  const configure = (settings: FightAudioSettings, duck: number) => {
    for (const channel of EXTRA_CHANNELS) {
      const level = settings[channel] * (channel === 'music' ? duck : 1)
      channels[channel].gain.setTargetAtTime(level, context.currentTime, 0.025)
    }
    for (const gate of [gateEffects, gateAmbient]) {
      gate.channelCount = settings.mono ? 1 : 2
      gate.channelCountMode = 'explicit'
    }
  }
  const dispose = () => {
    setActive(false)
    voices.slice().forEach(disconnectVoice)
    // Disconnect gates after the release; never close the ship's context.
    setTimeout(() => {
      ;[
        ...Object.values(channels),
        gateEffects,
        gateAmbient,
        hearing,
        hearingAmbient,
        room,
        wet,
      ].forEach((node) => node.disconnect())
    }, 150)
  }
  return {
    context,
    effects,
    ambience,
    pressure,
    profile,
    channels,
    configure,
    event,
    setActive,
    hearing: [hearing.frequency, hearingAmbient.frequency],
    dispose,
  }
}

export interface ContinuousVoice {
  frequency: AudioParam
  level: AudioParam
  pan: AudioParam
  stop: () => void
}

/** Stoppable sustained voice: the buffer and synthesis bench are shared with the site. */
export function continuousVoice(
  mix: FightMix,
  options: {
    target: AudioNode
    hz: number
    noise?: boolean
    type?: OscillatorType
    level: number
  },
): ContinuousVoice {
  const { context } = mix
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = options.hz
  const gain = context.createGain()
  gain.gain.value = 0
  gain.gain.setTargetAtTime(options.level, context.currentTime, 0.06)
  const pan = context.createStereoPanner()
  filter.connect(gain).connect(pan).connect(options.target)
  const source = options.noise ? context.createBufferSource() : context.createOscillator()
  let frequency: AudioParam
  if ('buffer' in source) {
    source.buffer = noiseBuffer(context)
    source.loop = true
    frequency = filter.frequency
  } else {
    source.type = options.type ?? 'sine'
    source.frequency.value = options.hz
    filter.frequency.value = 2500
    frequency = source.frequency
  }
  source.connect(filter)
  // Every sustained layer used to begin at sample zero of the same shared
  // buffer. In the arena those perfectly correlated copies reinforced one
  // another and sounded like electrical crackle. Give each layer its own
  // phase; one-shot noises already do the same in `rush`.
  if ('buffer' in source) source.start(0, Math.random() * source.buffer!.duration)
  else source.start()
  return {
    frequency,
    level: gain.gain,
    pan: pan.pan,
    stop: () => {
      gain.gain.setTargetAtTime(0, context.currentTime, 0.025)
      source.stop(context.currentTime + 0.12)
      source.onended = () => [source, filter, gain, pan].forEach((node) => node.disconnect())
    },
  }
}
