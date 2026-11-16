import { nenTacticalState } from './nen'
import type { FightLesson } from './fightLessons'
import type { LessonProgress } from './fightLessonState'
import type { FightState } from './types'

export type FoundationLessonId = 'spacing' | 'guard' | 'throw' | 'punish' | 'ten'
export const FOUNDATION_LESSONS: readonly FightLesson[] = [
  {
    id: 'spacing',
    fighter: 'hisoka',
    opponent: 'benjamin',
    title: ['Distance : choisir son engagement', 'Spacing: choose your commitment'],
    steps: [
      [
        'Recule ({left}) pour tenir entre 9 et 13 unités pendant une demi-seconde, sans attaquer.',
        'Retreat ({left}) and hold a 9–13 unit gap for half a second without attacking.',
      ],
    ],
    takeaway: [
      'La distance décide quels coups peuvent réellement toucher.',
      'Spacing determines which attacks can actually connect.',
    ],
  },
  {
    id: 'guard',
    fighter: 'hisoka',
    opponent: 'benjamin',
    title: ['Garde : recevoir une attaque', 'Guard: block an attack'],
    steps: [
      [
        'Maintiens Garde ({guard}) sans Aura et bloque le coup du mannequin.',
        'Hold Guard ({guard}) without Aura and block the dummy’s strike.',
      ],
    ],
    takeaway: [
      'Une garde ordinaire ne bloque ni projections, ni chaleur, ni musique.',
      'Ordinary guard does not block throws, heat or music.',
    ],
  },
  {
    id: 'throw',
    fighter: 'hisoka',
    opponent: 'benjamin',
    title: ['Projection : gagner le contact', 'Throw: reach your opponent'],
    steps: [
      [
        'Approche ({right}), puis projette ({throw}). Une projection trop loin manque sa cible.',
        'Approach ({right}), then throw ({throw}). A distant throw misses.',
      ],
    ],
    takeaway: [
      'La projection exige le contact et laisse une fenêtre de déprojection.',
      'Throws require contact and allow a tech window.',
    ],
  },
  {
    id: 'punish',
    fighter: 'hisoka',
    opponent: 'benjamin',
    title: ['Punition : faire manquer puis répondre', 'Punish: bait a whiff and respond'],
    steps: [
      [
        'Recule pendant le lourd du mannequin, puis rentre et touche durant sa récupération.',
        'Retreat during the dummy’s heavy, then close in and hit during its recovery.',
      ],
    ],
    takeaway: [
      'Une punition est un contact réel avant que l’adversaire récupère, pas un bonus accordé au bouton.',
      'Punishment requires real contact before recovery; pressing a button grants no bonus.',
    ],
  },
  {
    id: 'ten',
    fighter: 'kurapika',
    opponent: 'hisoka',
    title: ['Ten : revenir à une défense équilibrée', 'Ten: return to balanced defense'],
    steps: [
      [
        'Relâche Aura et les techniques avancées. Maintiens le Ten une seconde.',
        'Release Aura and advanced techniques. Maintain Ten for one second.',
      ],
    ],
    takeaway: [
      'Le Ten équilibre protection et récupération ; il ne remplace pas la garde.',
      'Ten balances protection and recovery; it does not replace guard.',
    ],
  },
]

type Check = (state: FightState, progress: LessonProgress) => boolean
export const FOUNDATION_CHECKS: Record<FoundationLessonId, Check> = {
  spacing: (s) =>
    Math.abs(s.player.x - s.opponent.x) >= 9 &&
    Math.abs(s.player.x - s.opponent.x) <= 13 &&
    !s.player.attack,
  guard: (s, p) => freshPlayerDefense(s, p) && !s.player.nen.ken,
  throw: (s, p) => freshPlayerHit(s, p) && s.player.attack?.variant === 'throw',
  punish: (s, p) => freshPlayerHit(s, p) && Boolean(s.impact?.punish),
  ten: (s) => nenTacticalState(s.player).technique === 'ten',
}
function freshPlayerHit(s: FightState, p: LessonProgress): boolean {
  return Boolean(
    s.impact &&
    s.impact.sequence !== p.lastImpact &&
    s.impact.attacker === 'player' &&
    !s.impact.blocked &&
    !s.impact.avoided,
  )
}
function freshPlayerDefense(s: FightState, p: LessonProgress): boolean {
  return Boolean(
    s.impact &&
    s.impact.sequence !== p.lastImpact &&
    s.impact.attacker === 'opponent' &&
    s.impact.blocked &&
    !s.impact.avoided,
  )
}
