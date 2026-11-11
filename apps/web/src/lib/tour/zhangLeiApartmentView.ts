import type * as Three from 'three'
import { buildApartmentReconstruction } from './apartmentReconstruction'
import type { TierPlan } from './blueprint'

export const ZHANG_LEI_PRIVATE_SPACES = [
  'living',
  'entrance',
  'bedroom',
  'kitchen',
  'servants',
  'servants-wc',
  'bathroom',
].map((suffix) => `tier-1-royal-residential-sector-room-1003-${suffix}`)

export function buildZhangLeiApartmentDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  if (!ZHANG_LEI_PRIVATE_SPACES.includes(options.spaceId)) return null
  return buildApartmentReconstruction({
    ...options,
    name: `zhang-lei-apartment-${options.spaceId}`,
  })
}
