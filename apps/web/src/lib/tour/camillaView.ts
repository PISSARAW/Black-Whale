import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { floorOf, type TierPlan } from './blueprint'
import { dressCamillaArchitecture } from './camillaArchitecture'
import { CamillaSurface } from './camillaDetailSurface'
import { dressCamillaFurniture } from './camillaFurniture'
import { dressCamillaPicture } from './camillaPictures'
import type { Structure } from './types'
import { buildCamillaApartmentDetails, CAMILLA_PRIVATE_SPACES } from './camillaApartmentView'

export const CAMILLA_ROOM_1002 = 'tier-1-royal-residential-sector-room-1002'
export const CAMILLA_LIVING = `${CAMILLA_ROOM_1002}-living`
export const CAMILLA_DINING = `${CAMILLA_ROOM_1002}-dining`
export const CAMILLA_ENTRANCE = `${CAMILLA_ROOM_1002}-entrance`
export const CAMILLA_SPACES = [CAMILLA_LIVING, CAMILLA_DINING, CAMILLA_ENTRANCE]

export function hasCamillaModel(s: Structure): boolean {
  return (
    (CAMILLA_SPACES.includes(s.spaceId) &&
      ['seat', 'table', 'cabinet', 'painting'].includes(s.kind)) ||
    (CAMILLA_PRIVATE_SPACES.includes(s.spaceId) &&
      ['bed', 'cabinet', 'counter', 'basin'].includes(s.kind))
  )
}

/** Replace only the drawing of solids, retaining the complete walked collision plan. */
export function camillaSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  if (reveal || plan.tier.id !== 'interior-room-1002') return plan
  return { ...plan, structures: plan.structures.filter((s) => !hasCamillaModel(s)) }
}

/** Ch. 366, reading pp. 14–15; ch. 389, reading pp. 16–17. See the room audit. */
export function buildCamillaRoomDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  const { THREE, plan, spaceId, reveal } = options
  if (reveal) return null
  if (!CAMILLA_SPACES.includes(spaceId)) return buildCamillaApartmentDetails(options)
  const space = plan.spaces.find((s) => s.id === spaceId)
  if (!space) return null
  const into = new BanquetDetailBuilder(THREE)
  const floor = floorOf(space, plan.tier)
  dressCamillaArchitecture({ THREE, into, plan, space })
  for (const structure of plan.structures.filter(
    (s) => s.spaceId === spaceId && hasCamillaModel(s),
  )) {
    const surface = new CamillaSurface(into, THREE, { structure, floor })
    if (structure.kind === 'painting') dressCamillaPicture(surface)
    else dressCamillaFurniture(surface)
  }
  return into.finish(`camilla-${spaceId.split('-').at(-1)}-details`)
}
