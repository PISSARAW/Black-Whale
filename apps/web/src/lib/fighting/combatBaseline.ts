import { createFightState } from './fightState'
import { toggleChrolloBookmark } from './chrolloBook'
import { setTrainingDummy, setTrainingResources } from './trainingSession'
import type { FightState } from './types'

export const BASELINE_VERSION = 1
export const BASELINE_SEED = 0x434c4153
export const BASELINE_FIGHTERS = [
  'kurapika',
  'benjamin',
  'hisoka',
  'chrollo',
  'feitan',
  'phinks',
] as const
export type BaselineFighter = (typeof BASELINE_FIGHTERS)[number]
export const BASELINE_TERRAINS = {
  neutral: { stageId: 'heavens-arena', arenaInteractions: false },
  interactive: { stageId: 'whale-hold', arenaInteractions: true },
} as const
export type BaselineTerrain = keyof typeof BASELINE_TERRAINS
export const BASELINE_SITUATIONS = [
  'spacing',
  'approach',
  'projectiles',
  'throws',
  'corner',
  'wakeup',
  'preparation',
] as const
export type BaselineSituation = (typeof BASELINE_SITUATIONS)[number]
export interface BaselineSituationOptions {
  fighter: BaselineFighter
  situation: BaselineSituation
  terrain: BaselineTerrain
}

/** Geometry and resources are fixture premises; all subsequent actions use the engine. */
export function createBaselineSituation(options: BaselineSituationOptions): FightState {
  const partner = options.situation === 'projectiles' ? 'franklin' : 'benjamin'
  let state = createFightState(options.fighter, partner, {
    mode: 'training',
    formatId: 'knockout',
    environment: BASELINE_TERRAINS[options.terrain],
  })
  for (const side of ['player', 'opponent'] as const)
    state = setTrainingResources(state, side, {
      aura: 100,
      health: 300,
      infiniteHealth: false,
      infiniteAura: false,
    })
  state = setTrainingDummy(state, {
    behavior: options.situation === 'wakeup' ? 'reversal' : 'manual',
    action: 'light',
    delay: 0,
  })
  const book = state.player.chrolloBook
  if (options.situation === 'throws' && book?.open)
    state = { ...state, player: { ...state.player, chrolloBook: toggleChrolloBookmark(book) } }
  const [player, opponent] = situationPositions(options.situation)
  return {
    ...state,
    rng: BASELINE_SEED,
    phase: 'fighting',
    player: { ...state.player, x: player },
    opponent: { ...state.opponent, x: opponent },
  }
}

function situationPositions(situation: BaselineSituation): readonly [number, number] {
  if (situation === 'corner') return [87, 93]
  if (situation === 'projectiles') return [20, 80]
  if (situation === 'spacing' || situation === 'approach') return [40, 60]
  return situation === 'throws' ? [46, 50] : [44, 50]
}
