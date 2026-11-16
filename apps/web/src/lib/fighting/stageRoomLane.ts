import type * as Three from 'three'
import { floorOf, type TierPlan } from '../tour/blueprint'
import type { Space } from '../tour/types'
import { findFightLane, type FightLane } from './stageLane'
import { modelLaneClearance } from './stageModelClearance'
import { roomBarriers } from './stageRoomDetails'
import { FIGHT_BODY_HALF_WIDTH, roomCutDepth } from './stageRoomCut'
import { roomFocus } from './stageRoomFocus'

interface RoomLaneOptions {
  THREE: typeof Three
  space: Space
  plan: TierPlan
  details: Three.Object3D
}

const lanes = new WeakMap<Space, FightLane>()

/** Static tour rooms keep their verified lane across rematches and fighter changes. */
export function cachedRoomFightLane(options: RoomLaneOptions): FightLane {
  const held = lanes.get(options.space)
  if (held) return held
  const lane = roomFightLane(options)
  lanes.set(options.space, lane)
  return lane
}

/** Original collision solids plus the exact model the camera will render. */
export function roomFightLane(options: RoomLaneOptions): FightLane {
  const { THREE, space, plan, details } = options
  const bodyHalfWidth = FIGHT_BODY_HALF_WIDTH
  const lane = findFightLane(space, plan.structures, {
    halfWidth: bodyHalfWidth,
    cutaway: roomCutDepth(space.id) <= -bodyHalfWidth,
    sights: roomFocus(space.id, plan),
    columns: plan.columns.get(space.id),
    barriers: roomBarriers(space.id),
    isClear: modelLaneClearance({
      THREE,
      details,
      floor: floorOf(space, plan.tier),
      halfWidth: bodyHalfWidth,
      frontCut: roomCutDepth(space.id),
    }),
  })
  return { ...lane, bodyHalfWidth }
}
