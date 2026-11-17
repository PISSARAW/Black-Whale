import type { CombatRoute } from './combatRoutes'
import { ROSTER_DUEL_LESSONS } from './duelComboRosterLessons'
import { SECOND_DUEL_LESSONS } from './duelComboSecondLessons'
import { THIRD_DUEL_LESSONS } from './duelComboThirdLessons'
import { FOURTH_DUEL_LESSONS } from './duelComboFourthLessons'
import { FIFTH_DUEL_LESSONS } from './duelComboFifthLessons'
import { SIXTH_DUEL_LESSONS } from './duelComboSixthLessons'
import { SEVENTH_DUEL_LESSONS } from './duelComboSeventhLessons'
import { EIGHTH_DUEL_LESSONS } from './duelComboEighthLessons'
import { NINTH_DUEL_LESSONS } from './duelComboNinthLessons'

/** Examples exercise the move rules; changing a lesson never changes a fighter's cancels. */
export const DUEL_COMBO_LESSONS: readonly CombatRoute[] = [
  ...ROSTER_DUEL_LESSONS,
  ...SECOND_DUEL_LESSONS,
  ...THIRD_DUEL_LESSONS,
  ...FOURTH_DUEL_LESSONS,
  ...FIFTH_DUEL_LESSONS,
  ...SIXTH_DUEL_LESSONS,
  ...SEVENTH_DUEL_LESSONS,
  ...EIGHTH_DUEL_LESSONS,
  ...NINTH_DUEL_LESSONS,
  {
    id: 'kurapika:economy',
    fighter: 'kurapika',
    kind: 'confirm',
    title: ['Économie · finir au sol', 'Economy · knockdown finish'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Après le revers, choisis le balayage pour finir au sol près de la cible.',
      'No aura cost. After the backfist, choose the sweep to knock down nearby.',
    ],
  },
  {
    id: 'kurapika:carry',
    fighter: 'kurapika',
    kind: 'confirm',
    title: ['Placement · pousser au coin', 'Position · carry to the corner'],
    moves: ['standingLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Le lariat pousse plus loin que le balayage, mais laisse davantage de récupération.',
      'No aura cost. The lariat carries farther than the sweep, but has more recovery.',
    ],
  },
  {
    id: 'kurapika:precision',
    fighter: 'kurapika',
    kind: 'confirm',
    title: ['Précision · liaison puis fouet', 'Precision · link into whip'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'forwardSpecial'],
    requirement: [
      'Après avant + J, attends la fin du geste avant K : c’est une liaison, pas un cancel. Le fouet final coûte 24 aura et exige le Nen disponible.',
      'After forward + J, wait for recovery before K: this is a link, not a cancel. The final whip costs 24 aura and requires available Nen.',
    ],
  },
  {
    id: 'kurapika:precision-economy',
    fighter: 'kurapika',
    kind: 'low',
    title: ['Précision · départ bas sans dépense', 'Precision · meterless low route'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura. Temporise K après avant + J, puis termine par le balayage pendant la confirmation.',
      'No aura cost. Time K after forward + J, then cancel the confirmed backfist into the sweep.',
    ],
  },
  {
    id: 'benjamin:economy',
    fighter: 'benjamin',
    kind: 'confirm',
    title: ['Économie · balayage tactique', 'Economy · tactical sweep'],
    moves: ['standingLight', 'standingHeavy', 'lowHeavy'],
    requirement: [
      'Aucune dépense d’aura ni pouvoir hérité requis. Termine au sol en conservant ta réserve pour le prochain échange.',
      'No aura cost or inherited ability required. Knock down and save resources for the next exchange.',
    ],
  },
  {
    id: 'benjamin:carry',
    fighter: 'benjamin',
    kind: 'confirm',
    title: ['Placement · charge blindée', 'Position · armored charge'],
    moves: ['standingLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. La charge pousse fortement vers le coin ; sa récupération est plus longue que celle du balayage.',
      'No aura cost. The charge carries strongly toward the corner; it recovers more slowly than the sweep.',
    ],
  },
  {
    id: 'benjamin:power',
    fighter: 'benjamin',
    kind: 'confirm',
    title: ['Puissance · prolonger vers Air Blow', 'Power · extend into Air Blow'],
    moves: ['standingLight', 'forwardLight', 'standingHeavy', 'neutralSpecial'],
    requirement: [
      'Confirme chaque touche avant la suite. Air Blow exige son héritage, le Nen disponible et 40 aura ; Secret Window et Culdcept restent des préparations séparées.',
      'Confirm each hit. Air Blow requires its inheritance, available Nen and 40 aura; Secret Window and Culdcept remain separate preparations.',
    ],
  },
  {
    id: 'benjamin:power-economy',
    fighter: 'benjamin',
    kind: 'low',
    title: ['Puissance · départ bas sans dépense', 'Power · meterless low route'],
    moves: ['lowLight', 'forwardLight', 'standingHeavy', 'forwardHeavy'],
    requirement: [
      'Aucune dépense d’aura. Prolonge avec le marteau, puis choisis la charge pour les dégâts et le placement.',
      'No aura cost. Extend with the hammer, then choose the charge for damage and position.',
    ],
  },
]
