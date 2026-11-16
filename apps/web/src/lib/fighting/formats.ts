import { FIGHT_FPS } from './fightClock'
import { DUEL_HEALTH } from './health'

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
    descriptionFr: 'Épuisez les trois barres de 100 PV adverses. Décision après 120 secondes.',
    descriptionEn: 'Deplete all three enemy 100 HP bars. Decision after 120 seconds.',
    victory: 'health',
    hitTarget: null,
    knockdownTarget: null,
    health: DUEL_HEALTH,
    roundFrames: 120 * FIGHT_FPS,
  },
  {
    id: 'arcade',
    titleFr: 'Arcade',
    titleEn: 'Arcade',
    descriptionFr: 'Trois barres de 100 PV : K.-O. ou décision après 120 secondes.',
    descriptionEn: 'Three 100 HP bars: knockout or a decision after 120 seconds.',
    victory: 'health',
    hitTarget: null,
    knockdownTarget: null,
    health: DUEL_HEALTH,
    roundFrames: 120 * FIGHT_FPS,
  },
]

export const DEFAULT_FIGHT_FORMAT: FightFormatId = 'arcade'

export function fightFormat(id: FightFormatId): FightFormat {
  return FIGHT_FORMATS.find((format) => format.id === id) ?? FIGHT_FORMATS[2]
}
