import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'
import {
  dressCamillaDiningArchitecture,
  dressCamillaEntranceArchitecture,
  dressCamillaLivingArchitecture,
} from './camillaArchitecture'
import { CamillaSurface } from './camillaDetailSurface'
import {
  dressCamillaChaise,
  dressCamillaTable,
  dressDiningTable,
  dressMusseSurveillanceDesk,
  dressUntouchablesSeats,
} from './camillaFurniture'

export const CAMILLA_ROOM_1002 = 'tier-1-royal-residential-sector-room-1002'
export const CAMILLA_LIVING = 'tier-1-royal-residential-sector-room-1002-living'
export const CAMILLA_DINING = 'tier-1-royal-residential-sector-room-1002-dining'
export const CAMILLA_ENTRANCE = 'tier-1-royal-residential-sector-room-1002-entrance'

function buildLiving(options: {
  THREE: typeof Three
  plan: TierPlan
  space: ReturnType<TierPlan['spaces']['find']> & object
}): Three.Group | null {
  const { THREE, plan, space } = options
  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)

  dressCamillaLivingArchitecture({ THREE, into, plan, space })
  dressCamillaChaise(new CamillaSurface(into, [-5.5, 0, 2.0], { floor }))
  dressCamillaTable(new CamillaSurface(into, [-3.9, 0, 2.0], { floor }))
  dressUntouchablesSeats(new CamillaSurface(into, [0, 0, 0], { floor }))

  return into.finish('camilla-living-details')
}

function buildDining(options: {
  THREE: typeof Three
  plan: TierPlan
  space: ReturnType<TierPlan['spaces']['find']> & object
}): Three.Group | null {
  const { THREE, plan, space } = options
  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)

  dressCamillaDiningArchitecture({ THREE, into, plan, space })
  dressDiningTable(new CamillaSurface(into, [6.0, 0, -2.7], { floor }))

  return into.finish('camilla-dining-details')
}

function buildEntrance(options: {
  THREE: typeof Three
  plan: TierPlan
  space: ReturnType<TierPlan['spaces']['find']> & object
}): Three.Group | null {
  const { THREE, plan, space } = options
  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)

  dressCamillaEntranceArchitecture({ THREE, into, plan, space })
  dressMusseSurveillanceDesk(new CamillaSurface(into, [0.4, 0, -6.5], { floor }))

  return into.finish('camilla-entrance-details')
}

/** Reconstructed suite 1002 for Princess Camilla from chapters 366, 389 and 413. */
export function buildCamillaRoomDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { reveal, spaceId, plan, THREE } = options
  if (reveal || !spaceId.startsWith(CAMILLA_ROOM_1002)) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  if (spaceId === CAMILLA_LIVING) {
    return buildLiving({ THREE, plan, space })
  }
  if (spaceId === CAMILLA_DINING) {
    return buildDining({ THREE, plan, space })
  }
  if (spaceId === CAMILLA_ENTRANCE) {
    return buildEntrance({ THREE, plan, space })
  }
  return null
}
