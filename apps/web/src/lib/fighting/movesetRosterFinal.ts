import { buildMoveset, type MovesetSpec } from './movesetFactory'

const SPECS: readonly MovesetSpec[] = [
  {
    fighterId: 'yokotani',
    mechanic: [
      'A Battle of Wits: LSDF : dans son territoire, les gardes numérotés interceptent l’agression et imposent la loi du repaire.',
      'A Battle of Wits: LSDF: inside his territory, numbered guards intercept aggression and enforce the hideout law.',
    ],
    finisherCondition: [
      'Une garde numérotée de LSDF doit encore protéger Yokotani.',
      'A numbered LSDF guard must still be protecting Yokotani.',
    ],
    labels: [
      'Objection immédiate|Immediate Objection',
      'Marteau du défenseur|Defender Hammer',
      'Article premier|First Article',
      'Balayage de procédure|Procedural Sweep',
      'Mandat aérien|Aerial Warrant',
      'Sentence descendante|Descending Sentence',
      'Mise en demeure|Formal Notice',
      'Plaidoirie coercitive|Coercive Plea',
      'Exception de défense|Defensive Exception',
      'A Battle of Wits: LSDF|A Battle of Wits: LSDF',
      'Garde numéro quatre|Guard Number Four',
      'Interpellation au sol|Ground Arrest',
      'Défense du repaire|Hideout Defense',
      'Arrestation automatique|Automatic Arrest',
      'LSDF · Jugement sans appel|LSDF · Final Judgment',
    ],
    speed: 1.02,
    power: 1.02,
    reach: 2.2,
    combos: [
      ['standingLight', 'backHeavy', 'neutralSpecial'],
      ['lowLight', 'forwardHeavy', 'downSpecial'],
      ['airLight', 'airHeavy', 'forwardSpecial'],
    ],
  },
]

export const ROSTER_FINAL_MOVESETS = SPECS.map(buildMoveset)
