import type { FightSide, FightState, FighterId } from '../types'
import { troupeMember } from '../troupeMembership'

export const VICTORY_DURATION = 10
export const VICTORY_FIGHTERS = [
  'hisoka',
  'chrollo',
  'kurapika',
  'feitan',
  'phinks',
  'franklin',
  'benjamin',
  'tserriednich',
  'leorio',
  'halkenburg',
  'camilla',
  'kalluto',
  'machi',
  'shizuku',
  'bonolenov',
  'illumi',
  'biscuit',
  'saiyu',
  'melody',
] as const
export type VictoryFighter = (typeof VICTORY_FIGHTERS)[number]
export const VICTORY_TITLES: Record<VictoryFighter, readonly [string, string]> = {
  hisoka: ['Le dernier fil', 'The last thread'],
  chrollo: ['Le festin du Soleil et de la Lune', 'The feast of Sun and Moon'],
  kurapika: ['Le jugement est rendu', 'The verdict is delivered'],
  feitan: ['Le soleil du supplice', 'The sun of torment'],
  phinks: ['Le dernier tour', 'The last revolution'],
  franklin: ['Le silence après la rafale', 'Silence after the barrage'],
  benjamin: ['Le dernier ordre', 'The final order'],
  tserriednich: ['Tu arrives trop tard', 'You are already too late'],
  leorio: ['L’étage supérieur', 'The next floor'],
  halkenburg: ['Une seule volonté', 'One shared will'],
  camilla: ['Le souffle', 'The breath'],
  kalluto: ['La dernière danse du papier', 'The final paper dance'],
  machi: ['Le dernier point', 'The final stitch'],
  shizuku: ['Rien à signaler', 'Nothing to report'],
  bonolenov: ['Le dernier mouvement', 'The final movement'],
  illumi: ['Même après la mort', 'Even after death'],
  biscuit: ['Le soin de grâce', 'The finishing touch'],
  saiyu: ['Les trois silences', 'The three silences'],
  melody: ['Un champ au printemps', 'A field in spring'],
}
export function hasVictoryCinematic(id: FighterId): id is VictoryFighter {
  return (VICTORY_FIGHTERS as readonly string[]).includes(id)
}
export interface VictorySelection {
  token: string
  variant?: 'kurapika-judgment' | 'kurapika-troupe'
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
  return {
    token,
    fighter,
    winner,
    loser,
    ...victoryVariant(fighter, state[loser].id),
  }
}

function victoryVariant(
  fighter: VictoryFighter,
  target: FighterId,
): Pick<VictorySelection, 'variant'> {
  if (fighter !== 'kurapika') return {}
  return { variant: troupeMember(target) ? 'kurapika-troupe' : 'kurapika-judgment' }
}
