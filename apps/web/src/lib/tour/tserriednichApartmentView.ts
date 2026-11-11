import type * as Three from 'three'
import { buildApartmentReconstruction } from './apartmentReconstruction'
import type { TierPlan } from './blueprint'

export const TSERRIEDNICH_PRIVATE_SPACES = [
  'dining',
  'entrance',
  'bedroom',
  'kitchen',
  'servants',
  'servants-wc',
  'bathroom',
].map((suffix) => `tier-1-royal-residential-sector-room-1004-${suffix}`)

export function buildTserriednichApartmentDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  if (!TSERRIEDNICH_PRIVATE_SPACES.includes(options.spaceId)) return null
  return buildApartmentReconstruction({
    ...options,
    name: `tserriednich-apartment-${options.spaceId}`,
  })
}
