import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { PoliceStationSurface } from './policeStationDetailSurface'
import { dressPoliceAtriumArchitecture } from './policeStationArchitecture'
import { dressPoliceTieredFountain } from './policeStationFountain'
import {
  dressPoliceEntranceSecurity,
  dressPoliceFrontDesk,
  dressPoliceSafetyDesk,
} from './policeStationFurniture'
import { dressPoliceOfficers } from './policeStationOfficers'
import type { Structure } from './types'

export const POLICE_ATRIUM = 'tier-3-central-police-station-atrium'
export const POLICE_ENTRANCE = 'tier-3-central-police-station-entrance'
export const POLICE_SAFETY = 'tier-3-central-police-station-safety-section'

export const POLICE_SPACES = new Set<string>([
  POLICE_ATRIUM,
  POLICE_ENTRANCE,
  POLICE_SAFETY,
])

export function isPoliceStationSpace(spaceId: string): boolean {
  return POLICE_SPACES.has(spaceId)
}

export function hasPoliceStationModel(structure: Structure): boolean {
  return (
    structure.id.startsWith('tier-3-central-police-station-') ||
    POLICE_SPACES.has(structure.spaceId)
  )
}

/** Omit coarse blueprint boxes from walked plan while retaining full collision physics */
export function policeSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => POLICE_SPACES.has(id))) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasPoliceStationModel(structure)),
  }
}

/** Chapter 349, 378, 393: Central police station and grand atrium on 4 levels */
export function buildPoliceStationDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || !POLICE_SPACES.has(spaceId)) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const structures = plan.structures.filter((s) => s.spaceId === spaceId)

  if (spaceId === POLICE_ATRIUM) {
    dressPoliceAtriumArchitecture({ THREE, into, plan, space })
    dressPoliceTieredFountain({ into, center: [0, -2.5], floor })

    const frontDesk = structures.find((s) => s.id.endsWith('-front-desk'))
    if (frontDesk) {
      dressPoliceFrontDesk(new PoliceStationSurface(into, frontDesk, floor))
    }

    dressPoliceOfficers(into, floor)
    return into.finish('police-station-atrium-manga-details')
  }

  if (spaceId === POLICE_SAFETY) {
    const safetyDesk = structures.find((s) => s.id.endsWith('-safety-desk'))
    if (safetyDesk) {
      dressPoliceSafetyDesk(new PoliceStationSurface(into, safetyDesk, floor))
    }
    return into.finish('police-station-safety-manga-details')
  }

  if (spaceId === POLICE_ENTRANCE) {
    dressPoliceEntranceSecurity(into, floor)
    return into.finish('police-station-entrance-manga-details')
  }

  return null
}
