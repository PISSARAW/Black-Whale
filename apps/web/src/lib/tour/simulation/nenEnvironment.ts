import { evolveTourSimulation, type TourSimulationV1 } from './state'

export type NenTargetKind = 'door' | 'object' | 'device' | 'person'

export interface TourNenTarget {
  id: string
  spaceId: string
  kind: NenTargetKind
  label: string
  resistance: number
  mass?: number
  fragile?: boolean
  movable?: boolean
  locked?: boolean
  damaged?: boolean
  powered?: boolean
  markedBy?: string
  rescued?: boolean
  ordinarySolution?: string
}

export interface PersistentNenTrace {
  id: string
  spaceId: string
  sourceActionId: string
  ownerId: string
  hiddenWithIn: boolean
  createdAt: number
  expiresAt: number | null
  detectedBy: string[]
}

export interface TourNenEnvironment {
  targets: Record<string, TourNenTarget>
  traces: Record<string, PersistentNenTrace>
}

export const TIER_5_NEN_PILOT_SPACE = 'tier-5-service-pilot'

const PILOT_TARGETS: readonly TourNenTarget[] = [
  {
    id: 'pilot-service-door',
    spaceId: TIER_5_NEN_PILOT_SPACE,
    kind: 'door',
    label: 'Porte de service verrouillée',
    resistance: 60,
    locked: true,
    damaged: false,
    ordinarySolution: 'Récupérer le badge de maintenance auprès du responsable de quart.',
  },
  {
    id: 'pilot-control-panel',
    spaceId: TIER_5_NEN_PILOT_SPACE,
    kind: 'device',
    label: 'Panneau intérieur',
    resistance: 20,
    powered: true,
  },
  {
    id: 'pilot-cargo-crate',
    spaceId: TIER_5_NEN_PILOT_SPACE,
    kind: 'object',
    label: 'Caisse de fret',
    resistance: 45,
    mass: 180,
    movable: true,
    fragile: false,
  },
  {
    id: 'pilot-injured-worker',
    spaceId: TIER_5_NEN_PILOT_SPACE,
    kind: 'person',
    label: 'Employé blessé',
    resistance: 0,
    rescued: false,
    ordinarySolution: 'Ouvrir avec le badge puis appeler les secours du Tier 5.',
  },
]

export function createTourNenEnvironment(): TourNenEnvironment {
  return { targets: {}, traces: {} }
}

export function ensureNenPilotZone(state: TourSimulationV1): TourSimulationV1 {
  if (PILOT_TARGETS.every(({ id }) => state.nenEnvironment.targets[id])) return state
  return evolveTourSimulation(state, (draft) => {
    for (const target of PILOT_TARGETS)
      draft.nenEnvironment.targets[target.id] ??= structuredClone(target)
  })
}

export function targetsInNenSpace(
  state: TourSimulationV1,
  spaceId: string,
): TourNenTarget[] {
  return Object.values(state.nenEnvironment.targets).filter((target) => target.spaceId === spaceId)
}
