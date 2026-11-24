import type { Graph } from '$lib/audio/ambient/mixer'
import type { FighterId } from '../types'
import type { KameoId } from '../kameos/types'
import { loadVoiceAsset, playVoiceSlice, type VoiceLocale } from './speechSamples'

export type FighterVoiceLine = `effort-${0 | 1 | 2}` | `pain-${0 | 1 | 2}` | `call-${KameoId}`
type VoiceBank = Record<FighterVoiceLine, readonly [number, number]>
type FighterVoiceWave = Partial<Record<FighterId, Record<VoiceLocale, VoiceBank>>>

export const FIGHTER_VOICE_RATE = 24000
const waves = import.meta.glob<FighterVoiceWave>('./fighterVoiceAtlas/wave-*.json', {
  eager: true,
  import: 'default',
})
export const FIGHTER_VOICE_ATLAS: FighterVoiceWave = Object.assign({}, ...Object.values(waves))

export function preloadFighterVoice(
  context: AudioContext,
  { fighter, locale }: { fighter: FighterId; locale: VoiceLocale },
) {
  if (!FIGHTER_VOICE_ATLAS[fighter]) return
  return loadVoiceAsset(context, `roster/${locale}-${fighter}`)
}

export function playFighterTake(
  graph: Graph,
  options: {
    fighter: FighterId
    locale: VoiceLocale
    line: FighterVoiceLine
    level: number
    speed: number
  },
): boolean {
  const { fighter, locale, line } = options
  const slice = FIGHTER_VOICE_ATLAS[fighter]?.[locale][line]
  if (!slice) return false
  const audio = preloadFighterVoice(graph.context, options)?.audio
  if (!audio) return false
  playVoiceSlice(graph, audio, {
    ...options,
    offset: slice[0] / FIGHTER_VOICE_RATE,
    duration: slice[1] / FIGHTER_VOICE_RATE,
  })
  return true
}
