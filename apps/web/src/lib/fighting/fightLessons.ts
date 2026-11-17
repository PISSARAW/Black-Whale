import { NEN_COMBAT_LESSONS, type NenCombatLessonId } from './nenCombat/lessons'
import { FOUNDATION_LESSONS, type FoundationLessonId } from './fightFoundationLessons'
import { ADVANCED_FIGHT_LESSONS, type AdvancedLessonId } from './fightAdvancedLessons'
import type { FighterId } from './types'

export type LessonId =
  | FoundationLessonId
  | AdvancedLessonId
  | NenCombatLessonId
  | 'ren'
  | 'ken'
  | 'zetsu'
  | 'gyo'
  | 'ryu'
  | 'ko'
  | 'emperor'
  | 'gum'
  | 'bookmark'
  | 'window'
export interface FightLesson {
  id: LessonId
  fighter: FighterId
  opponent: FighterId
  title: [string, string]
  steps: [string, string][]
  takeaway: [string, string]
}
export const FIGHT_LESSONS: readonly FightLesson[] = [
  ...FOUNDATION_LESSONS,
  {
    id: 'ren',
    fighter: 'kurapika',
    opponent: 'hisoka',
    title: ['Ren : maintenir son aura', 'Ren: sustain your aura'],
    steps: [
      [
        'Maintiens Aura ({aura}) pendant une seconde. Observe la réserve qui diminue.',
        'Hold Aura ({aura}) for one second. Watch the reserve decrease.',
      ],
    ],
    takeaway: [
      'Ren renforce le corps mais consomme de l’aura. Relâche Aura pour revenir au Ten.',
      'Ren reinforces the body but drains aura. Release Aura to return to Ten.',
    ],
  },
  {
    id: 'ken',
    fighter: 'kurapika',
    opponent: 'hisoka',
    title: ['Ken : défendre sous pression', 'Ken: defend under pressure'],
    steps: [
      [
        'Maintiens Aura + Garde ({aura} + {guard}) et bloque une attaque du mannequin.',
        'Hold Aura + Guard ({aura} + {guard}) and block a dummy attack.',
      ],
    ],
    takeaway: [
      'Ken protège le corps entier, mais sa consommation dépasse celle du Ren. Une projection contourne la garde.',
      'Ken protects the whole body but drains more than Ren. Throws bypass guard.',
    ],
  },
  {
    id: 'zetsu',
    fighter: 'kurapika',
    opponent: 'hisoka',
    title: ['Zetsu : récupérer à découvert', 'Zetsu: recover while exposed'],
    steps: [
      [
        'Maintiens Aura + Bas ({aura} + {down}) pour récupérer au moins 6 points d’aura.',
        'Hold Aura + Down ({aura} + {down}) to recover at least 6 aura.',
      ],
    ],
    takeaway: [
      'Le Zetsu accélère la récupération mais supprime la protection du Nen. Cherche une ouverture sûre.',
      'Zetsu speeds recovery but removes Nen protection. Find a safe opening.',
    ],
  },
  {
    id: 'gyo',
    fighter: 'kurapika',
    opponent: 'hisoka',
    title: ['Gyo : voir le piège caché', 'Gyo: reveal a hidden trap'],
    steps: [
      [
        'Un lien de Bungee Gum caché est déjà attaché. Maintiens Gyo (G / clic stick droit) une demi-seconde pour le révéler.',
        'A hidden Bungee Gum tether is already attached. Hold Gyo (G / right-stick click) for half a second to reveal it.',
      ],
    ],
    takeaway: [
      'Gyo révèle le lien dissimulé par In. Voir le piège ne le supprime pas.',
      'Gyo reveals the tether concealed by In. Seeing the trap does not remove it.',
    ],
  },
  {
    id: 'ryu',
    fighter: 'kurapika',
    opponent: 'hisoka',
    title: ['Ryu : choisir une zone', 'Ryu: choose a zone'],
    steps: [
      [
        'Maintiens 3 pour concentrer l’aura dans les mains pendant une demi-seconde. Observe les autres zones exposées.',
        'Hold 3 to concentrate aura in the hands for half a second. Watch the other exposed zones.',
      ],
    ],
    takeaway: [
      'Une concentration locale sacrifie la protection du reste du corps. Les touches 1–4 choisissent tête, torse, mains et pieds.',
      'Local concentration sacrifices protection elsewhere. Keys 1–4 select head, torso, hands and feet.',
    ],
  },
  {
    id: 'ko',
    fighter: 'kurapika',
    opponent: 'chrollo',
    title: ['Ko : engager puis frapper', 'Ko: commit and strike'],
    steps: [
      [
        'Maintiens Aura ({aura}), lance un coup fort ({heavy}), puis relâche Aura pendant sa préparation. Touche le mannequin avec le Ko.',
        'Hold Aura ({aura}), start a heavy strike ({heavy}), then release Aura during startup. Land the Ko strike.',
      ],
    ],
    takeaway: [
      'Le Ko dépense 20 points d’aura et expose les zones non renforcées. Un coup raté conserve ce risque pendant sa récupération.',
      'Ko spends 20 aura and exposes unreinforced zones. A missed strike keeps that risk during recovery.',
    ],
  },
  {
    id: 'emperor',
    fighter: 'kurapika',
    opponent: 'chrollo',
    title: ['Kurapika : le prix des yeux écarlates', 'Kurapika: the cost of scarlet eyes'],
    steps: [
      [
        'Maintiens Aura ({aura}) et appuie sur Hatsu II ({finisher}) pour activer Emperor Time. Laisse passer une seconde de combat.',
        'Hold Aura ({aura}) and press Hatsu II ({finisher}) to activate Emperor Time. Let one second of combat pass.',
      ],
      [
        'Désactive Emperor Time avec la même commande, ou son bouton dans le panneau de Kurapika.',
        'Deactivate Emperor Time with the same command, or its button in Kurapika’s panel.',
      ],
    ],
    takeaway: [
      'Chaque seconde active coûte une heure de vie dans ce modèle. La pause ne coûte rien ; le hitstop fait partie du combat.',
      'Each active second costs one hour of life in this model. Pause costs nothing; hitstop is part of combat.',
    ],
  },
  {
    id: 'gum',
    fighter: 'hisoka',
    opponent: 'kurapika',
    title: ['Hisoka : attacher et rappeler', 'Hisoka: attach and recall'],
    steps: [
      [
        'Sans direction, touche le mannequin avec Hatsu ({special}) pour attacher Bungee Gum.',
        'With no direction, hit the dummy with Hatsu ({special}) to attach Bungee Gum.',
      ],
      [
        'Recule ({left}) pour étirer le lien, puis fais Avant + Hatsu ({right} + {special}) pour tirer la cible.',
        'Retreat ({left}) to stretch the tether, then use Forward + Hatsu ({right} + {special}) to pull the target.',
      ],
    ],
    takeaway: [
      'Le rappel exige un lien attaché et tendu. Bungee Gum déplace réellement la cible ; ce n’est pas une téléportation.',
      'Recall needs an attached, stretched tether. Bungee Gum moves the target; it is not teleportation.',
    ],
  },
  {
    id: 'bookmark',
    fighter: 'chrollo',
    opponent: 'hisoka',
    title: ['Chrollo : gérer deux pages', 'Chrollo: manage two pages'],
    steps: [
      [
        'Fais Bas + Hatsu ({down} + {special}) pour marquer Sun and Moon et fermer le livre.',
        'Use Down + Hatsu ({down} + {special}) to bookmark Sun and Moon and close the book.',
      ],
      [
        'Fais Arrière + Hatsu ({left} + {special}) pour ouvrir Black Voice en gardant Sun and Moon au marque-page.',
        'Use Back + Hatsu ({left} + {special}) to open Black Voice while keeping Sun and Moon bookmarked.',
      ],
    ],
    takeaway: [
      'Une page ouverte et un seul marque-page peuvent coexister. Hatsu II utilise la page marquée.',
      'One open page and one bookmark can coexist. Hatsu II uses the bookmarked page.',
    ],
  },
  {
    id: 'window',
    fighter: 'benjamin',
    opponent: 'hisoka',
    title: ['Benjamin : observer sans blesser', 'Benjamin: observe without harm'],
    steps: [
      [
        'Approche si nécessaire et fais Avant + Hatsu ({right} + {special}) pour poser Secret Window au contact.',
        'Approach if needed and use Forward + Hatsu ({right} + {special}) to attach Secret Window on contact.',
      ],
    ],
    takeaway: [
      'Secret Window observe les actions corporelles. Il n’inflige aucun dégât et ne révèle pas le Nen caché.',
      'Secret Window observes bodily actions. It deals no damage and does not reveal hidden Nen.',
    ],
  },
]
export const FIGHT_CURRICULUM: readonly FightLesson[] = [
  ...FIGHT_LESSONS,
  ...ADVANCED_FIGHT_LESSONS,
  ...NEN_COMBAT_LESSONS,
]
export function fightLesson(id: LessonId): FightLesson {
  return FIGHT_CURRICULUM.find((lesson) => lesson.id === id)!
}
