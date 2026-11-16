import type * as Three from 'three'
import { disposeBanquetDetails } from '../tour/banquetView'
import type { TierPlan } from '../tour/blueprint'
import type { Polygon } from '../tour/types'
import { buildDoorDetails } from '../tour/doorView'
import { COURT_BAR_RUNS, COURT_BAR_X } from '../tour/supremeCourtFurniture'
import { STAGE_ROOM_BUILDERS, STAGE_SURFACE_PLANS } from './stageRoomModels'

/**
 * The hand-modelled dressing the visit hangs on a room, borrowed as it stands.
 *
 * The selected models and their visual replacements live in stageRoomModels.
 * Collision keeps the original plan, just as it does in the visit.
 */

/** Half the room a fighter needs to keep off a rail. */
const BARRIER_REACH = 0.4

/**
 * Barriers the dressing adds that the blueprint does not list as solids.
 *
 * Each is read from the module that models it, never copied: the court's bar
 * moves here the day it moves in the visit.
 */
const ROOM_BARRIERS: Readonly<Record<string, () => Polygon[]>> = {
  'tier-1-supreme-court': () =>
    COURT_BAR_RUNS.map(([from, to]) => [
      [COURT_BAR_X - BARRIER_REACH, from - BARRIER_REACH],
      [COURT_BAR_X + BARRIER_REACH, from - BARRIER_REACH],
      [COURT_BAR_X + BARRIER_REACH, to + BARRIER_REACH],
      [COURT_BAR_X - BARRIER_REACH, to + BARRIER_REACH],
    ]),
}

export function roomBarriers(spaceId: string): readonly Polygon[] {
  return ROOM_BARRIERS[spaceId]?.() ?? []
}

/** The plan with the coarse solids a detail builder redraws taken back out. */
export function detailedSurfacePlan(plan: TierPlan): TierPlan {
  return STAGE_SURFACE_PLANS.reduce((held, apply) => apply(held, false), plan)
}

function clip(root: Three.Object3D, planes: Three.Plane[]): void {
  root.traverse((item) => {
    const held = (item as Three.Mesh).material
    if (!held) return
    for (const material of Array.isArray(held) ? held : [held]) {
      material.clippingPlanes = planes
      material.clipIntersection = true
      material.needsUpdate = true
    }
  })
}

interface RoomDetails {
  THREE: typeof Three
  /** The whole deck: a room's architecture may read its neighbours. */
  plan: TierPlan
  spaceId: string
  planes: Three.Plane[]
}

/** The room's furniture, architecture and door casings, cut like the room. */
export function buildRoomDetails(options: RoomDetails): Three.Group {
  const { THREE, plan, spaceId, planes } = options
  const detail = { THREE, plan, spaceId, reveal: false }
  const root = new THREE.Group()
  for (const build of STAGE_ROOM_BUILDERS) {
    const dressed = build(detail)
    if (dressed) {
      root.add(dressed)
      break
    }
  }
  const doors = buildDoorDetails(detail)
  if (doors) root.add(doors)
  clip(root, planes)
  return root
}

export function disposeRoomDetails(root: Three.Object3D): void {
  disposeBanquetDetails(root)
}
