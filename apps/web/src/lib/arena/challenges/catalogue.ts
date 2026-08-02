import type { ArenaChallenge } from './types'

export const ARENA_CHALLENGES: ArenaChallenge[] = [
  {
    id: 'ryu',
    titleFr: 'Déplacer le Ryu',
    titleEn: 'Shift Ryu',
    objectives: [{ kind: 'use', action: 'RYU', count: 3 }],
  },
  {
    id: 'guard',
    titleFr: 'Fermer la garde',
    titleEn: 'Close the guard',
    objectives: [{ kind: 'blocks', count: 2 }],
  },
  {
    id: 'in-gyo',
    titleFr: 'Voir ce qui est caché',
    titleEn: 'See the concealed',
    objectives: [{ kind: 'use', action: 'GYO', count: 1 }, { kind: 'win' }],
  },
  {
    id: 'ko',
    titleFr: 'Punir Ko',
    titleEn: 'Punish Ko',
    objectives: [{ kind: 'accuracy', minimum: 0.6 }, { kind: 'win' }],
  },
  {
    id: 'zetsu',
    titleFr: 'Reprendre son souffle',
    titleEn: 'Recover composure',
    objectives: [
      { kind: 'use', action: 'MODE', count: 2 },
      { kind: 'aura', minimum: 35 },
    ],
  },
]
