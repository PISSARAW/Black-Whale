import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { dressCentralCourthouseArchitecture } from './centralCourthouseArchitecture'
import { CentralCourthouseSurface } from './centralCourthouseDetailSurface'
import {
  dressCourthouseCurtain,
  dressCourthouseDesk,
  dressCourthouseGavel,
  dressCourthouseSeat,
} from './centralCourthouseFurniture'
import type { Structure } from './types'

export const CENTRAL_COURTHOUSE_SPACE = 'tier-3-central-courthouse-courtroom'
const MODEL_IDS = new Set(
  ['seat', 'gavel', 'rear-desk', 'front-desk', 'curtain'].map(
    (suffix) => `tier-3-central-courthouse-${suffix}`,
  ),
)

/** Unknown future fixtures retain their base mesh instead of silently disappearing. */
export function hasCentralCourthouseModel(structure: Structure): boolean {
  return structure.spaceId === CENTRAL_COURTHOUSE_SPACE && MODEL_IDS.has(structure.id)
}

/** This copy affects drawing only; the original plan still owns every collision. */
export function centralCourthouseSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || !plan.spaces.some(({ id }) => id === CENTRAL_COURTHOUSE_SPACE)) return plan
  return { ...plan, structures: plan.structures.filter((item) => !hasCentralCourthouseModel(item)) }
}

function dressFixture(surface: CentralCourthouseSurface, THREE: typeof Three): void {
  const id = surface.structure.id
  if (id.endsWith('-seat')) dressCourthouseSeat(surface)
  else if (id.endsWith('-gavel')) dressCourthouseGavel(surface)
  else if (id.endsWith('-curtain')) dressCourthouseCurtain(surface, THREE)
  else dressCourthouseDesk(surface)
}

/** Chapter 359: a compact panelled room, exposed seat and asymmetric side desks. */
export function buildCentralCourthouseDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal || spaceId !== CENTRAL_COURTHOUSE_SPACE) return null
  const space = plan.spaces.find(({ id }) => id === spaceId)
  if (!space) return null

  const into = new BanquetDetailBuilder(THREE)
  dressCentralCourthouseArchitecture({ into, plan, space })
  const floor = floorOf(space, plan.tier)
  for (const structure of plan.structures.filter(hasCentralCourthouseModel)) {
    dressFixture(new CentralCourthouseSurface(into, structure, floor), THREE)
  }
  return into.finish('central-courthouse-panel-details')
}
