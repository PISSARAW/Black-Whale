import { SHIP_BACKGROUND_SCENES } from './stageBackgroundShipScenes'
import { ROYAL_BACKGROUND_SCENES } from './stageBackgroundRoyalScenes'
import type { BackgroundScene } from './stageBackgroundSceneTypes'
import type { FightStageId } from './stages'

export const STAGE_BACKGROUND_SCENES = {
  ...SHIP_BACKGROUND_SCENES,
  ...ROYAL_BACKGROUND_SCENES,
} satisfies Record<FightStageId, BackgroundScene>
