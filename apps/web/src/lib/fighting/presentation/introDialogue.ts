import { COMBAT_VOICE_RATES } from '../audio/settings'
import { rivalExchange, rivalKey } from './rivals'
import atlas from './rivalVoiceAtlas.json'
import type { FightSide, FightState } from '../types'
import type { VoiceLocale } from '../audio/speechSamples'

type PairSpans = readonly [readonly [number, number], readonly [number, number]]
export const RIVAL_VOICE_SAMPLE_RATE = 24000
export const INTRO_SHOT_MIN_SECONDS = 2.4
export const RIVAL_VOICE_ATLAS: Partial<Record<string, Record<VoiceLocale, PairSpans>>> =
  Object.fromEntries(
    Object.entries(atlas).map(([key, { fr, en }]) => [
      key,
      { fr: takeSpans(fr), en: takeSpans(en) },
    ]),
  )

function takeSpans([
  [firstStart, firstLength],
  [secondStart, secondLength],
]: number[][]): PairSpans {
  return [
    [firstStart, firstLength],
    [secondStart, secondLength],
  ]
}

type Duel = Pick<FightState, 'player' | 'opponent'>

export function introDialogue(duel: Duel) {
  const { player, opponent } = duel
  const pair = rivalExchange(player.id, opponent.id)?.pair
  const key = rivalKey(player.id, opponent.id)
  const spans = RIVAL_VOICE_ATLAS[key]
  if (!pair || !spans) return
  const firstSide: FightSide = pair[0] === player.id ? 'player' : 'opponent'
  const slowest = COMBAT_VOICE_RATES.low * RIVAL_VOICE_SAMPLE_RATE
  const seconds = (position: 0 | 1) =>
    Math.max(
      INTRO_SHOT_MIN_SECONDS,
      Math.max(spans.fr[position][1], spans.en[position][1]) / slowest + 0.15,
    )
  return { key, firstSide, spans, shotSeconds: [seconds(0), seconds(1)] as const }
}
