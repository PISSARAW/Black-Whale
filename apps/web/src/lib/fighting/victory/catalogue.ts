import type { FightSide, FightState, FighterId } from '../types'
import { troupeMember } from '../troupeMembership'
import { rihanPlan } from './rihanPlan'
import { beyondCurseVariant, type BeyondCurseVariant } from './beyondCurseSelection'
import { PHINKS_VICTORY_DURATION } from './phinksTiming'
import { phinksVictoryStrike } from './phinksStrike'
import { SHIZUKU_VICTORY_DURATION } from './shizukuTiming'
import { TSERRIEDNICH_VICTORY_DURATION } from './tserriednichTiming'

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
  'luini',
  'basho',
  'sayird',
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
  tserriednich: ['Deux vérités', 'Two Truths'],
  leorio: ['L’étage supérieur', 'The next floor'],
  halkenburg: ['Une seule volonté', 'One shared will'],
  camilla: ['Le chat qui revient', 'The cat that returns'],
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
  luini: ['La mauvaise porte', 'The wrong door'],
  basho: ['Le dernier vers', 'The final verse'],
  sayird: ['Ton angle mort', 'Your blind spot'],
}
export function hasVictoryCinematic(id: FighterId): id is VictoryFighter {
  return (VICTORY_FIGHTERS as readonly string[]).includes(id)
}
const VICTORY_DURATIONS: Partial<Record<VictoryFighter, number>> = {
  phinks: PHINKS_VICTORY_DURATION,
  shizuku: SHIZUKU_VICTORY_DURATION,
  tserriednich: TSERRIEDNICH_VICTORY_DURATION,
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
  finishingShot?: number
  phinksStrike?: ReturnType<typeof phinksVictoryStrike>
  fighter: VictoryFighter
  winner: FightSide
  loser: FightSide
}
function cinematicWinner(state: FightState): FightSide | null {
  if (state.phase !== 'finished' || state.winner === null || state.winner === 'draw') return null
  if (state.mode === 'training' || state.forecastSimulation || state.catsName) return null
  return state.winner
}

function catRevivalFinished(state: FightState, winner: FightSide, loser: FightSide): boolean {
  return (
    state.catsNameFatality?.victimSide === winner &&
    state.catsNameFatality.killerSide === loser &&
    state.catsNameConsumed === loser &&
    state[winner].health > 0 &&
    state[loser].health <= 0
  )
}

function futureFinishingShot(
  state: FightState,
  fighter: VictoryFighter,
  curse: ReturnType<typeof beyondCurseVariant>,
): Pick<VictorySelection, 'finishingShot'> {
  if (
    curse ||
    fighter !== 'tserriednich' ||
    state.finishReason !== 'knockout' ||
    state.finishingShot === undefined
  )
    return {}
  return { finishingShot: state.finishingShot }
}

function curseAwareDuration(fighter: VictoryFighter, curse: ReturnType<typeof beyondCurseVariant>) {
  return fighter === 'tserriednich' && curse ? undefined : VICTORY_DURATIONS[fighter]
}

export function selectVictory(state: FightState): VictorySelection | null {
  const winner = cinematicWinner(state)
  if (!winner) return null
  const fighter = state[winner].id
  if (!hasVictoryCinematic(fighter)) return null
  const loser = winner === 'player' ? 'opponent' : 'player'
  if (fighter === 'camilla' && !catRevivalFinished(state, winner, loser)) return null
  const curse = beyondCurseVariant(state)
  const duration = curseAwareDuration(fighter, curse)
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
    ...(duration === undefined ? {} : { duration }),
    ...futureFinishingShot(state, fighter, curse),
    ...(fighter === 'phinks' ? { phinksStrike: phinksVictoryStrike(state, winner) } : {}),
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
