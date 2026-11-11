import type * as Three from 'three'
import type { TierPlan } from './blueprint'
import { buildApartmentReconstruction } from './apartmentReconstruction'

export const CAMILLA_PRIVATE_SPACES = [
  'bedroom',
  'kitchen',
  'servants',
  'servants-wc',
  'bathroom',
].map((suffix) => `tier-1-royal-residential-sector-room-1002-${suffix}`)

export function buildCamillaApartmentDetails(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  if (!CAMILLA_PRIVATE_SPACES.includes(options.spaceId)) return null
  return buildApartmentReconstruction({
    ...options,
    name: `camilla-apartment-${options.spaceId.split('-').at(-1)}`,
  })
}
