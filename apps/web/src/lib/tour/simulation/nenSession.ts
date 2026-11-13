import type { TourWorldMode } from './mode'
import { createTourSimulation, type TourSimulationV1 } from './state'

interface NenSessionInput {
  mode: TourWorldMode
  stored: TourSimulationV1 | null
  spaceId?: string | null
}

/** Hydrate simulations only; canonical visits never create persistent state. */
export function nenSimulationFor({
  mode,
  stored,
  spaceId,
}: NenSessionInput): TourSimulationV1 | null {
  if (mode === 'CANONICAL_VISIT') return null
  if (stored?.mode === mode) return stored
  return createTourSimulation({
    id: `${mode.toLowerCase()}:tour`,
    mode,
    spaceId: spaceId ?? undefined,
  })
}
