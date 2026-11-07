import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { dressHospitalClinic } from './hospitalClinicArchitecture'
import { dressHospitalHallArchitecture } from './hospitalHallArchitecture'
import { dressHospitalResearch } from './hospitalResearchArchitecture'
import { dressHospitalStaff } from './hospitalStaffArchitecture'
import { dressHospitalSupplies } from './hospitalSuppliesArchitecture'
import type { Structure } from './types'

export const HOSPITAL_CLINIC = 'tier-3-central-hospital-clinic'
export const HOSPITAL_SUPPLIES = 'tier-3-central-hospital-supplies'
export const HOSPITAL_STAFF = 'tier-3-central-hospital-staff'
export const HOSPITAL_RESEARCH = 'tier-3-central-hospital-research'
export const HOSPITAL_HALL = 'tier-3-central-hospital-hall'

export const HOSPITAL_SPACES = new Set<string>([
  HOSPITAL_CLINIC,
  HOSPITAL_SUPPLIES,
  HOSPITAL_STAFF,
  HOSPITAL_RESEARCH,
  HOSPITAL_HALL,
])

export function hasHospitalModel(structure: Structure): boolean {
  return HOSPITAL_SPACES.has(structure.spaceId)
}

/** Omit duplicate coarse blueprint boxes in walking mode while retaining full collision. */
export function hospitalSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => HOSPITAL_SPACES.has(id))) return plan
  return {
    ...plan,
    structures: plan.structures.filter((structure) => !hasHospitalModel(structure)),
  }
}

/**
 * Reconstructed Central Hospital & Medical Ward from chapters 358 and 391.
 *
 * Implements the central medical clinic with patient beds, ECG monitors and IV stands,
 * the deep pharmaceutical supply reserves and oxygen cylinders, the consultation rooms
 * with doctor's desk, examination couch and illuminated negatoscope, and the research lab.
 */
export function buildHospitalDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || !HOSPITAL_SPACES.has(spaceId)) return null

  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  const ceilingHeight = ceilingOf(space, plan.tier)
  const structures = plan.structures.filter((s) => s.spaceId === spaceId)

  if (spaceId === HOSPITAL_CLINIC) {
    dressHospitalClinic({ into, floor, ceilingHeight, space, structures })
  } else if (spaceId === HOSPITAL_SUPPLIES) {
    dressHospitalSupplies({ into, floor, ceilingHeight, space, structures })
  } else if (spaceId === HOSPITAL_STAFF) {
    dressHospitalStaff({ into, floor, ceilingHeight, space, structures })
  } else if (spaceId === HOSPITAL_RESEARCH) {
    dressHospitalResearch({ into, floor, ceilingHeight, space, structures })
  } else if (spaceId === HOSPITAL_HALL) {
    dressHospitalHallArchitecture({ into, floor, ceilingHeight, space, structures })
  }

  return into.finish(`hospital-${spaceId}-details`)
}
