import type { FightLesson } from './fightLessons'

export type AdvancedLessonId =
  'anti-air' | 'throw-escape' | 'hit-confirm' | 'corner-defense' | 'interrupt-setup'
/** Scenario premises and physical responses only; no additional Nen ability. */
export const ADVANCED_FIGHT_LESSONS: readonly FightLesson[] = [
  {
    id: 'anti-air',
    fighter: 'kurapika',
    opponent: 'hisoka',
    title: ['Anti-air : répondre au saut', 'Anti-air: answer a jump'],
    steps: [
      [
        'Le mannequin saute. Touche son corps aérien avec ton lourd debout ({heavy}).',
        'The dummy jumps. Hit its airborne body with your standing heavy ({heavy}).',
      ],
    ],
    takeaway: [
      'La réussite dépend d’une collision anti-air réelle, pas du seul bouton lourd.',
      'Success requires an actual anti-air collision, not just pressing heavy.',
    ],
  },
  {
    id: 'throw-escape',
    fighter: 'hisoka',
    opponent: 'benjamin',
    title: ['Déprojection : répondre au contact', 'Throw escape: answer at contact'],
    steps: [
      [
        'Le mannequin projette. Utilise Projection ({throw}) près de son contact pour déprojeter.',
        'The dummy throws. Use Throw ({throw}) close to contact to tech.',
      ],
    ],
    takeaway: [
      'La fenêtre arcade est de huit frames. Sauter évite une projection mais ne valide pas une déprojection.',
      'The arcade tech window is eight frames. Jumping avoids a throw but does not count as a tech.',
    ],
  },
  {
    id: 'hit-confirm',
    fighter: 'kurapika',
    opponent: 'benjamin',
    title: ['Confirmation : léger puis lourd', 'Hit confirm: light into heavy'],
    steps: [
      [
        'Touche avec un léger debout ({light}). Le mannequin tentera de garder ensuite.',
        'Land a standing light ({light}). The dummy will try to guard afterwards.',
      ],
      [
        'Confirme cette touche avec un lourd ({heavy}) avant la fin du hitstun. Une garde ou un combo perdu impose un nouvel essai.',
        'Confirm with heavy ({heavy}) before hitstun ends. A block or dropped combo requires a fresh attempt.',
      ],
    ],
    takeaway: [
      'Deux contacts consécutifs sont exigés. Un lourd gardé ne compte pas comme une confirmation.',
      'Two consecutive hits are required. A blocked heavy is not a hit confirmation.',
    ],
  },
  {
    id: 'corner-defense',
    fighter: 'hisoka',
    opponent: 'benjamin',
    title: ['Coin : bloquer puis répondre', 'Corner: block then respond'],
    steps: [
      [
        'Hisoka commence au coin gauche. Garde ({guard}) le lourd du mannequin.',
        'Hisoka starts in the left corner. Guard ({guard}) the dummy’s heavy.',
      ],
      [
        'Relâche Garde et punis sa récupération avec un léger ({light}).',
        'Release Guard and punish recovery with a light ({light}).',
      ],
    ],
    takeaway: [
      'Après une garde au coin, vérifie ta distance et attends la fin du blockstun avant de répondre.',
      'After guarding in the corner, check spacing and wait for blockstun to end before responding.',
    ],
  },
  {
    id: 'interrupt-setup',
    fighter: 'hisoka',
    opponent: 'phinks',
    title: ['Préparation : interrompre une rotation', 'Setup: interrupt a rotation'],
    steps: [
      [
        'Phinks a commencé une rotation réelle du bras droit. Observe son geste.',
        'Phinks has started an actual right-arm rotation. Observe the motion.',
      ],
      [
        'Touche-le avec un léger ({light}) avant qu’il termine la rotation.',
        'Hit with a light ({light}) before the rotation completes.',
      ],
    ],
    takeaway: [
      'La rotation inachevée est interrompue par le moteur. Aucun pouvoir, charge terminée ou équipement n’est ajouté à Hisoka.',
      'The engine interrupts the unfinished rotation. Hisoka receives no extra ability, completed charge or equipment.',
    ],
  },
]
