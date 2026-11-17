import { characterLine } from './dialogues'
import { rivalLine } from './rivals'
import type { FightSide, FightState } from '../types'
export function introduction(state: FightState, language: 'fr' | 'en', side: FightSide): string {
  return (
    rivalLine({
      actor: state[side].id,
      other: state[side === 'player' ? 'opponent' : 'player'].id,
      language,
    }) ?? characterLine(state[side].id, language)
  )
}
/** Only a resolved verdict can produce an ending; no private cause or guessed power is named. */
export function ending(state: FightState, language: 'fr' | 'en'): string | null {
  const winner = resolvedCeremonyWinner(state)
  if (!winner) return null
  const line = characterLine(state[winner].id, language, true)
  const fr = language === 'fr'
  const scope = state.matchWinner
    ? fr
      ? 'Duel terminé.'
      : 'Match complete.'
    : fr
      ? 'Manche terminée.'
      : 'Round complete.'
  const context =
    state.finishReason === 'time' ? (fr ? 'Le temps est écoulé.' : 'Time has expired.') : ''
  return [scope, context, line].filter(Boolean).join(' ')
}

export function resolvedCeremonyWinner(state: FightState): FightSide | null {
  if (
    state.phase !== 'finished' ||
    state.catsName ||
    state.forecastSimulation ||
    state.parallelFuture
  )
    return null
  return state.winner === 'draw' ? null : state.winner
}
