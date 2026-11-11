import type * as Three from 'three'
import { floorOf, ceilingOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ScreeningRoomSurface } from './screeningRoomDetailSurface'
import { dressScreeningRoomArchitecture } from './screeningRoomArchitecture'
import { dressScreeningRoomStage } from './screeningRoomStage'
import { dressScreeningRoomBoxes } from './screeningRoomBoxes'
import { dressScreeningRoomSeats } from './screeningRoomSeats'
import { dressScreeningRoomCeiling } from './screeningRoomCeiling'
import type { Structure } from './types'

export const SCREENING_ROOM_SPACE = 'tier-2-screening-room'

export function isScreeningRoomSpace(spaceId: string): boolean {
  return spaceId === SCREENING_ROOM_SPACE
}

export function hasScreeningRoomModel(structure: Structure): boolean {
  return (
    structure.spaceId === SCREENING_ROOM_SPACE || structure.id.startsWith('tier-2-screening-room-')
  )
}

/** Chapter 359, checked against the supplied theatre panel. Dimensions remain estimated. */
export function buildScreeningRoomDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== SCREENING_ROOM_SPACE) return null

  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const surface = new ScreeningRoomSurface(into)
  const floor = floorOf(space, plan.tier)
  const ceilingHeight = ceilingOf(space, plan.tier)
  const structures = plan.structures.filter((s) => s.spaceId === spaceId)

  dressScreeningRoomArchitecture({ surface, floor, ceilingHeight, plan, space })
  dressScreeningRoomStage({ THREE, surface, floor, structures })
  dressScreeningRoomBoxes({ surface, floor, structures })
  dressScreeningRoomSeats({ surface, floor, structures })
  dressScreeningRoomCeiling({ surface, floor, ceilingHeight, space })

  return into.finish('screening-room-details')
}

/** Omit duplicate coarse blueprint fixtures, substituting the faithful 3D reconstruction. */
export function screeningRoomSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => id === SCREENING_ROOM_SPACE)) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasScreeningRoomModel(structure)),
  }
}
