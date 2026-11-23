import type { CombatState } from '../combat/types'
import { actOnTier5Parcel, startTier5ParcelLoop } from '../tour/simulation/tier5Loop'
import {
  createTourSimulation,
  evolveTourSimulation,
  type TourSimulationV1,
} from '../tour/simulation/state'
import { WAREHOUSE_SECTOR_ID } from './terrain'

export const ARENA_SECTOR_STORAGE_KEY = 'black-whale:arena-sector:tier-5-warehouse'
export const ARENA_SECTOR_VERSION = 1 as const

export interface ArenaSectorSnapshot {
  version: typeof ARENA_SECTOR_VERSION
  terrainId: typeof WAREHOUSE_SECTOR_ID
  fights: number
  witnesses: number
  securityAlert: number
  physicalObjects: CombatState['physicalObjects']
  lastOutcome: CombatState['outcome'] | null
  simulation: TourSimulationV1
}

export function createArenaSectorSnapshot(): ArenaSectorSnapshot {
  const simulation = startTier5ParcelLoop(
    createTourSimulation({
      id: 'arena-tier-5-sector',
      mode: 'ALTERNATE_SIMULATION',
      spaceId: WAREHOUSE_SECTOR_ID,
    }),
  )
  return {
    version: ARENA_SECTOR_VERSION,
    terrainId: WAREHOUSE_SECTOR_ID,
    fights: 0,
    witnesses: 0,
    securityAlert: 0,
    physicalObjects: {},
    lastOutcome: null,
    simulation,
  }
}

export function restoreArenaSector(state: CombatState, snapshot: ArenaSectorSnapshot): CombatState {
  return {
    ...state,
    physicalObjects: clonePhysicalObjects(snapshot.physicalObjects),
    environment: {
      ...state.environment,
      context: 'CLANDESTINE',
      witnesses: snapshot.witnesses,
      securityAlert: snapshot.securityAlert,
    },
  }
}

export function captureArenaSector(
  state: CombatState,
  previous: ArenaSectorSnapshot,
  playerSpaceId: string,
): ArenaSectorSnapshot {
  const witnessed = state.environment.witnesses > previous.witnesses
  let simulation = recordFight(previous.simulation, {
    state,
    playerSpaceId,
    fight: previous.fights + 1,
  })
  if (witnessed) simulation = actOnTier5Parcel(simulation, 'HEAR_DISPUTE')
  return {
    ...previous,
    fights: previous.fights + 1,
    witnesses: Math.max(previous.witnesses, state.environment.witnesses),
    securityAlert: Math.max(previous.securityAlert, state.environment.securityAlert),
    physicalObjects: clonePhysicalObjects(state.physicalObjects),
    lastOutcome: state.outcome,
    simulation,
  }
}

export function serializeArenaSector(snapshot: ArenaSectorSnapshot): string {
  return JSON.stringify(snapshot)
}

export function parseArenaSector(value: string | null): ArenaSectorSnapshot {
  if (!value) return createArenaSectorSnapshot()
  try {
    const parsed = JSON.parse(value) as Partial<ArenaSectorSnapshot>
    if (parsed.version !== ARENA_SECTOR_VERSION || parsed.terrainId !== WAREHOUSE_SECTOR_ID) {
      return createArenaSectorSnapshot()
    }
    return { ...createArenaSectorSnapshot(), ...parsed } as ArenaSectorSnapshot
  } catch {
    return createArenaSectorSnapshot()
  }
}

function recordFight(
  simulation: TourSimulationV1,
  event: { state: CombatState; playerSpaceId: string; fight: number },
): TourSimulationV1 {
  const { state, playerSpaceId, fight } = event
  return evolveTourSimulation(simulation, (draft) => {
    draft.clock += state.clock
    draft.player.spaceId = playerSpaceId
    const incident = `arena-duel:${fight}:${state.outcome}`
    if (!draft.incidents.includes(incident)) draft.incidents.push(incident)
    if (state.environment.witnesses > 0) recordWorkerWitness(draft, incident)
    if (Object.keys(state.physicalObjects).length > 0) {
      draft.incidents.push(`arena-scenery-altered:${fight}`)
    }
  })
}

function recordWorkerWitness(simulation: TourSimulationV1, incident: string): void {
  if (!simulation.witnesses.includes('warehouse-worker')) {
    simulation.witnesses.push('warehouse-worker')
  }
  const knowledge = (simulation.witnessKnowledge['warehouse-worker'] ??= [])
  if (!knowledge.includes(incident)) knowledge.push(incident)
  const worker = simulation.actors['warehouse-worker']
  if (worker && !worker.memory.includes(incident)) worker.memory.push(incident)
}

function clonePhysicalObjects(
  physicalObjects: CombatState['physicalObjects'],
): CombatState['physicalObjects'] {
  return JSON.parse(JSON.stringify(physicalObjects)) as CombatState['physicalObjects']
}
