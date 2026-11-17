import type { FightSide, FightState, FighterId } from '../types'

export const VICTORY_DURATION = 10
export const VICTORY_FIGHTERS = [
  'hisoka',
  'chrollo',
  'kurapika',
  'feitan',
  'phinks',
  'franklin',
] as const
export type VictoryFighter = (typeof VICTORY_FIGHTERS)[number]
export const VICTORY_TITLES: Record<VictoryFighter, readonly [string, string]> = {
  hisoka: ['Le dernier fil', 'The last thread'],
  chrollo: ['La dernière page', 'The last page'],
  kurapika: ['Le jugement est rendu', 'The verdict is delivered'],
  feitan: ['Le soleil du supplice', 'The sun of torment'],
  phinks: ['Le dernier tour', 'The last revolution'],
  franklin: ['Le silence après la rafale', 'Silence after the barrage'],
}
export function hasVictoryCinematic(id: FighterId): id is VictoryFighter {
  return (VICTORY_FIGHTERS as readonly string[]).includes(id)
}
export interface VictorySelection {
  token: string
  fighter: VictoryFighter
  winner: FightSide
  loser: FightSide
}
export function selectVictory(state: FightState): VictorySelection | null {
  if (state.phase !== 'finished' || state.winner === null || state.winner === 'draw') return null
  if (state.mode === 'training' || state.forecastSimulation || state.catsName) return null
  const winner = state.winner,
    fighter = state[winner].id
  if (!hasVictoryCinematic(fighter)) return null
  const loser = winner === 'player' ? 'opponent' : 'player'
  const token = [
    state.environment.stageId,
    state.roundNumber,
    state.frame,
    winner,
    fighter,
    state[loser].id,
  ].join(':')
  return { token, fighter, winner, loser }
}
