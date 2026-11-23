import type { CombatState } from '../combat/types'
import {
  TIER5_PARCEL_ACTIVITY,
  actOnTier5Parcel,
  startTier5ParcelLoop,
} from '../tour/simulation/tier5Loop'
import {
  createTourSimulation,
  evolveTourSimulation,
  type TourSimulationV1,
} from '../tour/simulation/state'
import { WAREHOUSE_SECTOR_ID } from './terrain'

export const ARENA_SECTOR_STORAGE_KEY = 'black-whale:arena-sector:tier-5-warehouse'
export const ARENA_SECTOR_VERSION = 1 as const

export type ArenaSectorResolution = 'controlled' | 'exposed' | 'intercepted' | 'rival-held'

export interface ArenaSectorSnapshot {
  version: typeof ARENA_SECTOR_VERSION
  terrainId: typeof WAREHOUSE_SECTOR_ID
  fights: number
  witnesses: number
  securityAlert: number
  physicalObjects: CombatState['physicalObjects']
  opponentMemory: CombatState['opponentMemory']
  lastOutcome: CombatState['outcome'] | null
  lastResolution: ArenaSectorResolution | null
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
    opponentMemory: emptyOpponentMemory(),
    lastOutcome: null,
    lastResolution: null,
    simulation,
  }
}

export function restoreArenaSector(state: CombatState, snapshot: ArenaSectorSnapshot): CombatState {
  return {
    ...state,
    player: {
      ...state.player,
      aura: Math.max(0, Math.min(state.player.capacity, snapshot.simulation.player.aura)),
    },
    physicalObjects: clonePhysicalObjects(snapshot.physicalObjects),
    opponentMemory: {
      ...cloneOpponentMemory(snapshot.opponentMemory),
      observedEventAt: null,
    },
    environment: {
      ...state.environment,
      context: 'CLANDESTINE',
      witnesses: snapshot.witnesses,
      securityAlert: snapshot.securityAlert,
      interventionIn: sectorUnderIntervention(snapshot) ? 8 : null,
      intervened: false,
    },
  }
}

/** Adopts Tour's active world while retaining Arena history created before the bridge existed. */
export function connectArenaSectorToTour(
  snapshot: ArenaSectorSnapshot,
  tour: TourSimulationV1,
): ArenaSectorSnapshot {
  const simulation = startTier5ParcelLoop(
    evolveTourSimulation(tour, (draft) => mergeSectorHistory(draft, snapshot.simulation)),
  )
  return { ...snapshot, simulation }
}

export function captureArenaSector(
  state: CombatState,
  previous: ArenaSectorSnapshot,
  playerSpaceId: string,
): ArenaSectorSnapshot {
  const witnessed = state.environment.witnesses > previous.witnesses
  const resolution = resolveSectorFight(state, previous)
  let simulation = recordFight(previous.simulation, {
    state,
    playerSpaceId,
    fight: previous.fights + 1,
    resolution,
  })
  if (witnessed) simulation = actOnTier5Parcel(simulation, 'HEAR_DISPUTE')
  return {
    ...previous,
    fights: previous.fights + 1,
    witnesses: Math.max(previous.witnesses, state.environment.witnesses),
    securityAlert: Math.max(previous.securityAlert, state.environment.securityAlert),
    physicalObjects: clonePhysicalObjects(state.physicalObjects),
    opponentMemory: cloneOpponentMemory(state.opponentMemory),
    lastOutcome: state.outcome,
    lastResolution: resolution,
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
  event: {
    state: CombatState
    playerSpaceId: string
    fight: number
    resolution: ArenaSectorResolution
  },
): TourSimulationV1 {
  const { state, playerSpaceId, fight, resolution } = event
  return evolveTourSimulation(simulation, (draft) => {
    draft.clock += state.clock
    draft.player.spaceId = playerSpaceId
    draft.player.aura = state.player.aura
    const incident = `arena-duel:${fight}:${state.outcome}`
    if (!draft.incidents.includes(incident)) draft.incidents.push(incident)
    draft.incidents.push(`arena-sector:${fight}:${resolution}`)
    if (state.environment.witnesses > 0) recordWorkerWitness(draft, incident)
    if (Object.keys(state.physicalObjects).length > 0) {
      draft.incidents.push(`arena-scenery-altered:${fight}`)
    }
  })
}

function resolveSectorFight(
  state: CombatState,
  previous: ArenaSectorSnapshot,
): ArenaSectorResolution {
  if (state.environment.intervened) return 'intercepted'
  if (state.outcome !== 'won') return 'rival-held'
  if (
    state.environment.securityAlert > previous.securityAlert ||
    state.environment.witnesses > previous.witnesses
  )
    return 'exposed'
  return 'controlled'
}

function sectorUnderIntervention(snapshot: ArenaSectorSnapshot): boolean {
  return snapshot.securityAlert >= 2 || snapshot.witnesses >= 3
}

function mergeSectorHistory(target: TourSimulationV1, sector: TourSimulationV1): void {
  target.clock = Math.max(target.clock, sector.clock)
  appendUnique(target.incidents, sector.incidents)
  appendUnique(target.witnesses, sector.witnesses)
  for (const [witness, knowledge] of Object.entries(sector.witnessKnowledge)) {
    appendUnique((target.witnessKnowledge[witness] ??= []), knowledge)
  }
  const parcel = sector.activities[TIER5_PARCEL_ACTIVITY]
  if (parcel && !target.activities[TIER5_PARCEL_ACTIVITY]) {
    target.activities[TIER5_PARCEL_ACTIVITY] = JSON.parse(JSON.stringify(parcel))
  }
  const worker = sector.actors['warehouse-worker']
  if (!worker) return
  const targetWorker = (target.actors['warehouse-worker'] ??= JSON.parse(JSON.stringify(worker)))
  appendUnique(targetWorker.memory, worker.memory)
}

function appendUnique(target: string[], additions: readonly string[]): void {
  for (const value of additions) if (!target.includes(value)) target.push(value)
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

function cloneOpponentMemory(memory: CombatState['opponentMemory']): CombatState['opponentMemory'] {
  return JSON.parse(JSON.stringify(memory)) as CombatState['opponentMemory']
}

function emptyOpponentMemory(): CombatState['opponentMemory'] {
  return {
    observedEventAt: null,
    zones: { head: 0, torso: 0, arms: 0, legs: 0 },
    hypothesis: {
      preferredZone: null,
      confidence: 0,
      concealedAttacks: 0,
      knownHatsuIds: [],
    },
  }
}
