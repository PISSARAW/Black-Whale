import type * as Three from 'three'
import { buildBanquetDetails, disposeBanquetDetails } from '../tour/banquetView'
import type { TierPlan } from '../tour/blueprint'
import type { Polygon } from '../tour/types'
import { buildCasinoDetails, casinoSurfacePlan } from '../tour/casinoView'
import { buildDoorDetails } from '../tour/doorView'
import { buildScreeningRoomDetails, screeningRoomSurfacePlan } from '../tour/screeningRoomView'
import { buildSupremeCourtDetails, supremeCourtSurfacePlan } from '../tour/supremeCourtView'

/**
 * The hand-modelled dressing the visit hangs on a room, borrowed as it stands.
 *
 * Only the builders of the rooms Clash offers are listed: the visit's own list
 * in `tour/TierView.ts` imports every interior aboard, and a duel in the casino
 * has no use for fourteen princes' apartments. A room added to `stages.ts`
 * that the visit dresses needs its builder added here.
 */
interface DetailOptions {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}

const DETAIL_BUILDERS: ReadonlyArray<(options: DetailOptions) => Three.Group | null> = [
  buildBanquetDetails,
  buildCasinoDetails,
  buildScreeningRoomDetails,
  buildSupremeCourtDetails,
]

const SURFACE_PLANS: ReadonlyArray<(plan: TierPlan, reveal: boolean) => TierPlan> = [
  casinoSurfacePlan,
  screeningRoomSurfacePlan,
  supremeCourtSurfacePlan,
]

/**
 * Barriers the dressing adds that the blueprint does not list as solids.
 *
 * The court's bar is modelled in `tour/supremeCourtFurniture.ts` at `x = 94`,
 * in two runs either side of its gate. A duel may not be laid across it.
 */
const ROOM_BARRIERS: Readonly<Record<string, readonly Polygon[]>> = {
  'tier-1-supreme-court': [
    [
      [93.6, 27.8],
      [94.4, 27.8],
      [94.4, 36.7],
      [93.6, 36.7],
    ],
    [
      [93.6, 40.3],
      [94.4, 40.3],
      [94.4, 49.2],
      [93.6, 49.2],
    ],
  ],
}

export function roomBarriers(spaceId: string): readonly Polygon[] {
  return ROOM_BARRIERS[spaceId] ?? []
}

/** The plan with the coarse solids a detail builder redraws taken back out. */
export function detailedSurfacePlan(plan: TierPlan): TierPlan {
  return SURFACE_PLANS.reduce((held, apply) => apply(held, false), plan)
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
  for (const build of DETAIL_BUILDERS) {
    const dressed = build(detail)
    if (dressed) root.add(dressed)
  }
  const doors = buildDoorDetails(detail)
  if (doors) root.add(doors)
  clip(root, planes)
  return root
}

export function disposeRoomDetails(root: Three.Object3D): void {
  disposeBanquetDetails(root)
}
