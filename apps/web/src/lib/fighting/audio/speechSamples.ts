import type { Graph } from '$lib/audio/ambient/mixer'
import { startsAt } from '$lib/audio/hatsu/synth'
import atlas from './speechAtlas.json'

export type VoiceLocale = keyof typeof atlas.locales
export type SpeechLine = keyof typeof atlas.locales.fr

interface VoicePack {
  audio?: AudioBuffer
  loaded: Promise<AudioBuffer | undefined>
}

const banks = new WeakMap<AudioContext, Map<string, VoicePack>>()

export function preloadFightSpeech(context: AudioContext, locale: VoiceLocale) {
  return loadVoiceBank(context, locale)
}

export function loadVoiceBank(
  context: AudioContext,
  locale: VoiceLocale,
  kind: 'speech' | 'description' = 'speech',
) {
  return loadVoiceAsset(context, kind === 'description' ? `description-${locale}` : locale)
}

export function loadVoiceAsset(context: AudioContext, key: string) {
  if (typeof window === 'undefined') return
  const bank = banks.get(context) ?? new Map<string, VoicePack>()
  banks.set(context, bank)
  const cached = bank.get(key)
  if (cached) {
    bank.delete(key)
    bank.set(key, cached)
    return cached
  }
  const pack: VoicePack = {
    loaded: fetch(`/audio/clash-voices/${key}.mp3`)
      .then((response) => (response.ok ? response.arrayBuffer() : null))
      .then(async (bytes) => {
        if (bytes) pack.audio = await context.decodeAudioData(bytes)
        return pack.audio
      })
      .catch(() => undefined),
  }
  bank.set(key, pack)
  if (bank.size > 16) {
    const oldest = [...bank.keys()].find((name) => name.startsWith('roster/'))
    if (oldest) bank.delete(oldest)
  }
  return pack
}

export function fightSpeechBuffer(context: AudioContext, locale: VoiceLocale) {
  return banks.get(context)?.get(locale)?.audio
}

export function voiceSample(
  graph: Graph,
  audio: AudioBuffer,
  options: { locale: VoiceLocale; line: SpeechLine; level: number; speed?: number; at?: number },
) {
  const [from, count] = atlas.locales[options.locale][options.line]
  return playVoiceSlice(graph, audio, {
    ...options,
    offset: from / atlas.sampleRate,
    duration: count / atlas.sampleRate,
  })
}

export function playVoiceSlice(
  graph: Graph,
  audio: AudioBuffer,
  options: { offset: number; duration: number; level: number; speed?: number; at?: number },
) {
  const at = options.at ?? startsAt(graph)
  const { offset, duration } = options
  const speed = options.speed ?? 1
  const gain = graph.context.createGain()
  gain.gain.value = options.level
  const source = graph.context.createBufferSource()
  source.buffer = audio
  source.playbackRate.value = speed
  source.connect(gain).connect(graph.oneShotTarget ?? graph.master)
  graph.registerSource?.(source)
  source.addEventListener(
    'ended',
    () => {
      source.disconnect()
      gain.disconnect()
    },
    { once: true },
  )
  source.start(at, offset, duration)
  return { source, ends: at + duration / speed }
}
