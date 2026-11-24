import type { TourWorld } from '../tour/hatsu'
import { TIER5_PARCEL_ACTIVITY } from '../tour/simulation/tier5Loop'
import type { ArenaSectorResolution, ArenaSectorSnapshot } from './sectorPersistence'

export type ArenaSectorPhase = 'quiet' | 'altered' | 'watched' | 'lockdown'

export interface ArenaSectorSituation {
  phase: ArenaSectorPhase
  fights: number
  witnesses: number
  securityAlert: number
  changedObjects: number
  storedObjects: number
  parcelStage: string
  objective: 'take-control' | 'break-adaptation' | 'stay-unseen' | 'beat-intervention'
  opponentReads: number
  interventionSeconds: number | null
  lastResolution: ArenaSectorResolution | null
}

/** Replays Arena scenery changes through the Tour renderer's native solid overrides. */
export function projectArenaSectorIntoTour(
  world: TourWorld,
  snapshot: ArenaSectorSnapshot | null,
): TourWorld {
  if (!snapshot || Object.keys(snapshot.physicalObjects).length === 0) return world
  const solids = { ...world.solids }
  for (const object of Object.values(snapshot.physicalObjects)) {
    const previous = solids[object.id] ?? {}
    solids[object.id] = object.storedBy
      ? { gone: true, ...previous }
      : { at: object.position, gone: false, ...previous }
  }
  return { ...world, solids }
}

/** One shared reading for the Tour entry card and Arena's pre-fight briefing. */
export function arenaSectorSituation(snapshot: ArenaSectorSnapshot): ArenaSectorSituation {
  const objects = Object.values(snapshot.physicalObjects)
  const phase = sectorPhase(snapshot, objects.length)
  return {
    phase,
    fights: snapshot.fights,
    witnesses: snapshot.witnesses,
    securityAlert: snapshot.securityAlert,
    changedObjects: objects.length,
    storedObjects: objects.filter((object) => object.storedBy !== null).length,
    parcelStage: snapshot.simulation.activities[TIER5_PARCEL_ACTIVITY]?.stage ?? 'UNNOTICED',
    objective: objectiveFor(phase),
    opponentReads: Object.values(snapshot.opponentMemory.zones).reduce(
      (total, count) => total + count,
      0,
    ),
    interventionSeconds: phase === 'lockdown' ? 8 : null,
    lastResolution: snapshot.lastResolution,
  }
}

function objectiveFor(phase: ArenaSectorPhase): ArenaSectorSituation['objective'] {
  if (phase === 'lockdown') return 'beat-intervention'
  if (phase === 'watched') return 'stay-unseen'
  if (phase === 'altered') return 'break-adaptation'
  return 'take-control'
}

function sectorPhase(snapshot: ArenaSectorSnapshot, changedObjects: number): ArenaSectorPhase {
  if (snapshot.securityAlert >= 2 || snapshot.witnesses >= 3) return 'lockdown'
  if (snapshot.securityAlert > 0 || snapshot.witnesses > 0) return 'watched'
  if (snapshot.fights > 0 || changedObjects > 0) return 'altered'
  return 'quiet'
}
