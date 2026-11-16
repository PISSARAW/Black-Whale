import { catsNameFighterVisible } from './camillaCatScene'
import { lsdfFighterVisible } from './lsdfPresentation'
import type { FightSide, FightState } from './types'

export function fightFigureVisible(state: FightState, side: FightSide): boolean {
  return lsdfFighterVisible(state, side) && catsNameFighterVisible(state, side)
}
