import type * as Three from 'three'
import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { TierPlan } from './blueprint'
import { dressPrincelyRoomGrid } from './princelyRoomGrid'
import { dressPrincelyWallPanels } from './princelyWallPanels'
import type { Space } from './types'

export interface TserriednichArchitectureContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  plan: TierPlan
  space: Space
}

export function dressTserriednichRoomArchitecture(context: TserriednichArchitectureContext): void {
  dressPrincelyWallPanels(context)
  dressPrincelyRoomGrid(context, false)
  dressPrincelyRoomGrid(context, true)
}
