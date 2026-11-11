import { evolveTourSimulation, type TourSimulationV1 } from './state'

export type ShipIncidentKind = 'BLACKOUT' | 'LOCKDOWN' | 'FIRE' | 'VENTILATION_FAILURE' | 'SEA_ROLL'

export function ensureShipZone(state: TourSimulationV1, spaceId: string): TourSimulationV1 {
  return evolveTourSimulation(state, (draft) => {
    draft.shipSystems[spaceId] ??= {
      power: 100,
      lighting: 100,
      ventilation: 100,
      noise: 20,
      circulation: 100,
      doorsLocked: false,
      fire: false,
    }
  })
}

export function applyShipIncident(
  state: TourSimulationV1,
  spaceId: string,
  kind: ShipIncidentKind,
): TourSimulationV1 {
  const initialized = state.shipSystems[spaceId] ? state : ensureShipZone(state, spaceId)
  return evolveTourSimulation(initialized, (draft) => {
    const zone = draft.shipSystems[spaceId]
    if (kind === 'BLACKOUT') {
      zone.power = 0
      zone.lighting = 5
      zone.circulation = Math.min(zone.circulation, 35)
    }
    if (kind === 'LOCKDOWN') {
      zone.doorsLocked = true
      zone.circulation = 0
    }
    if (kind === 'FIRE') {
      zone.fire = true
      zone.ventilation = Math.max(0, zone.ventilation - 60)
      zone.noise = Math.min(100, zone.noise + 45)
    }
    if (kind === 'VENTILATION_FAILURE') {
      zone.ventilation = 0
      zone.noise = Math.max(0, zone.noise - 10)
    }
    if (kind === 'SEA_ROLL') {
      zone.circulation = Math.max(20, zone.circulation - 25)
      zone.noise = Math.min(100, zone.noise + 20)
    }
    draft.incidents.push(`ship:${kind.toLowerCase()}:${spaceId}`)
  })
}

export function shipInteractionModifiers(state: TourSimulationV1, spaceId: string) {
  const zone = state.shipSystems[spaceId]
  if (!zone)
    return { visible: true, audible: true, traversable: true, sensingNoise: 0, moveMultiplier: 1 }
  return {
    visible: zone.lighting >= 20,
    audible: zone.noise < 80,
    traversable: !zone.doorsLocked && zone.circulation > 0,
    sensingNoise: zone.noise / 100,
    moveMultiplier: Math.max(0.25, zone.circulation / 100),
  }
}
