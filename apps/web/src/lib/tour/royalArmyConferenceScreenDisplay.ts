import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  ARMY_FRAME,
  ARMY_SCREEN,
  RoyalArmyConferenceSurface,
} from './royalArmyConferenceDetailSurface'
import type { Structure } from './types'

/** Blank framed surfaces; no tactical imagery or legible annotations appear in the inspected panels. */
function blankBoard(into: BanquetDetailBuilder, structure: Structure, floor: number): void {
  const surface = new RoyalArmyConferenceSurface(into, structure, floor)
  const w = surface.width,
    h = structure.height
  surface.box([w, h, 0.055], [0, h / 2, 0], ARMY_FRAME)
  surface.box([w - 0.09, h - 0.09, 0.014], [0, h / 2, 0.038], ARMY_SCREEN)
}

export const dressBriefingScreenDisplay = blankBoard
export const dressTacticalChartBoardDisplay = blankBoard
