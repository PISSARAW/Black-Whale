import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { TierPlan } from './blueprint'
import { dressApartmentArchitecture } from './apartmentArchitecture'
import { isPrinceApartmentSpace } from './princeApartmentAppearance'

/** Architectural fallback for every princely room not handled by a panel-specific model. */
export function buildPrinceApartmentEnvelope(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}): Three.Group | null {
  if (options.reveal) return null
  const space = options.plan.spaces.find(({ id }) => id === options.spaceId)
  if (!space || !isPrinceApartmentSpace(space)) return null

  const into = new BanquetDetailBuilder(options.THREE)
  dressApartmentArchitecture({ into, plan: options.plan, space })
  return into.finish(`prince-apartment-envelope-${space.id}`)
}
