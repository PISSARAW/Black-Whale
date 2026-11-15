import { FIGHT_FPS } from './frameData'

export type FightFormatId = 'heavens-arena' | 'knockout' | 'arcade'
export type FightVictoryRule = 'hits' | 'health' | 'hybrid'

export interface FightFormat {
  id: FightFormatId
  titleFr: string
  titleEn: string
  descriptionFr: string
  descriptionEn: string
  victory: FightVictoryRule
  hitTarget: number | null
  health: number
  roundFrames: number
}

export const FIGHT_FORMATS: readonly FightFormat[] = [
  {
    id: 'heavens-arena',
    titleFr: 'Tour Céleste',
    titleEn: 'Heavens Arena',
    descriptionFr: 'Le premier à placer 3 coups non bloqués remporte le combat.',
    descriptionEn: 'The first fighter to land 3 unblocked hits wins.',
    victory: 'hits',
    hitTarget: 3,
    health: 100,
    roundFrames: 60 * FIGHT_FPS,
  },
  {
    id: 'knockout',
    titleFr: 'Combat K.-O.',
    titleEn: 'Knockout fight',
    descriptionFr: 'Réduisez les 100 PV adverses à zéro avant la décision.',
    descriptionEn: "Reduce the opponent's 100 HP to zero before the decision.",
    victory: 'health',
    hitTarget: null,
    health: 100,
    roundFrames: 90 * FIGHT_FPS,
  },
  {
    id: 'arcade',
    titleFr: 'Arcade',
    titleEn: 'Arcade',
    descriptionFr: 'Règle historique : K.-O., 10 points ou décision à 60 secondes.',
    descriptionEn: 'Classic rule: knockout, 10 points, or a 60-second decision.',
    victory: 'hybrid',
    hitTarget: 10,
    health: 100,
    roundFrames: 60 * FIGHT_FPS,
  },
]

export const DEFAULT_FIGHT_FORMAT: FightFormatId = 'arcade'

export function fightFormat(id: FightFormatId): FightFormat {
  return FIGHT_FORMATS.find((format) => format.id === id) ?? FIGHT_FORMATS[2]
}
