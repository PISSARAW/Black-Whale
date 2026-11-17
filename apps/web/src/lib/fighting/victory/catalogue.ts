import type { FightSide, FightState, FighterId } from '../types'
import { troupeMember } from '../troupeMembership'
import { rihanPlan } from './rihanPlan'
import { beyondCurseVariant, type BeyondCurseVariant } from './beyondCurseSelection'

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
  'hanzo',
  'bill',
  'melody',
  'hinrigh',
  'terebellum',
  'voconte',
  'longhi',
  'furykov',
  'theta',
  'mizaistom',
  'rihan',
  'zakuro',
  'lynch',
] as const
export type VictoryFighter = (typeof VICTORY_FIGHTERS)[number]
export const VICTORY_TITLES: Record<VictoryFighter, readonly [string, string]> = {
  hisoka: ['Regarde-moi', 'Look at me'],
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
  hanzo: ['Derrière toi', 'Behind you'],
  bill: ['Dernier rempart', 'The last line'],
  melody: ['Un champ au printemps', 'A field in spring'],
  hinrigh: ['Pièce à conviction', 'Evidence'],
  terebellum: ['Retour à l’envoyeur', 'Return to sender'],
  voconte: ['Aller simple', 'One-way trip'],
  longhi: ['Tu avais signé', 'You signed it'],
  furykov: ['La réponse était prête', 'The answer was ready'],
  theta: ['Une balle d’avance', 'One round ahead'],
  mizaistom: ['Dernier avertissement', 'Final warning'],
  rihan: ['L’angle mort', 'The blind spot'],
  zakuro: ['La dernière goutte', 'The last drop'],
  lynch: ['Le dernier aveu', 'The final confession'],
}
export function hasVictoryCinematic(id: FighterId): id is VictoryFighter {
  return (VICTORY_FIGHTERS as readonly string[]).includes(id)
}
export interface VictorySelection {
  token: string
  variant?:
    | 'kurapika-judgment'
    | 'kurapika-troupe'
    | 'chrollo-sun-moon'
    | 'rihan-physical'
    | BeyondCurseVariant
  duration?: number
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
  const curse = beyondCurseVariant(state)
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
    ...(curse ? { variant: curse } : victoryVariant(fighter, state[loser].id)),
  }
}

function victoryVariant(
  fighter: VictoryFighter,
  target: FighterId,
): Pick<VictorySelection, 'variant'> {
  if (fighter === 'rihan') return rihanPlan(target).prey ? {} : { variant: 'rihan-physical' }
  if (fighter !== 'kurapika') return {}
  return { variant: troupeMember(target) ? 'kurapika-troupe' : 'kurapika-judgment' }
}
