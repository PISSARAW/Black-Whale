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

/** Reconstructed Tier 2 Screening Room / Theatre from Chapter 359 with full architectural fidelity. */
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
  const ceilingHeight = ceilingOf(space, plan.tier) ?? 10

  // 1. Classical architecture, wall damask panels, pilasters, emergency exits, projection booth
  dressScreeningRoomArchitecture({ surface, floor, ceilingHeight })

  // 2. Proscenium stage, piers, gilded arch, grand velvet drape, screen and podium
  dressScreeningRoomStage({ surface, floor, ceilingHeight })

  // 3. Elevated private VIP boxes with corbels, balustrades and armchairs
  dressScreeningRoomBoxes({ surface, floor })

  // 4. Stalls seating blocks on stepped raked risers with aisles
  dressScreeningRoomSeats({ surface, floor })

  // 5. Monumental coffered ceiling grid and grand chandeliers
  dressScreeningRoomCeiling({ surface, floor, ceilingHeight })

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
