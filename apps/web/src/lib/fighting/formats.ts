import { FIGHT_FPS } from './fightClock'

export type FightFormatId = 'heavens-arena' | 'knockout' | 'arcade'
export type FightVictoryRule = 'points' | 'health' | 'hybrid'

export interface FightFormat {
  id: FightFormatId
  titleFr: string
  titleEn: string
  descriptionFr: string
  descriptionEn: string
  victory: FightVictoryRule
  hitTarget: number | null
  knockdownTarget: number | null
  health: number
  roundFrames: number
}

export const FIGHT_FORMATS: readonly FightFormat[] = [
  {
    id: 'heavens-arena',
    titleFr: 'Tour Céleste',
    titleEn: 'Heavens Arena',
    descriptionFr: '10 points ou TKO au troisième knockdown, selon le jugement de la Tour.',
    descriptionEn: '10 points or a third-knockdown TKO under Heavens Arena judging.',
    victory: 'points',
    hitTarget: 10,
    knockdownTarget: 3,
    health: 100,
    roundFrames: 180 * FIGHT_FPS,
  },
  {
    id: 'knockout',
    titleFr: 'Combat K.-O.',
    titleEn: 'Knockout fight',
    descriptionFr: 'Réduisez les 100 PV adverses à zéro avant la décision.',
    descriptionEn: "Reduce the opponent's 100 HP to zero before the decision.",
    victory: 'health',
    hitTarget: null,
    knockdownTarget: null,
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
    knockdownTarget: null,
    health: 100,
    roundFrames: 60 * FIGHT_FPS,
  },
]

export const DEFAULT_FIGHT_FORMAT: FightFormatId = 'arcade'

export function fightFormat(id: FightFormatId): FightFormat {
  return FIGHT_FORMATS.find((format) => format.id === id) ?? FIGHT_FORMATS[2]
}
