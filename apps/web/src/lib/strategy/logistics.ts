import type { ScenarioEventKind } from './scenario'

const MIN_SYSTEM = 0
const MAX_SYSTEM = 5

export interface ShipLogistics {
  security: number
  communications: number
  medical: number
  supply: number
  witnessPressure: number
}

export interface LogisticsTurn {
  eventKind?: ScenarioEventKind
  conflictCount: number
  movementCount: number
  incapacitatedCount: number
}

function clampSystem(value: number): number {
  return Math.max(MIN_SYSTEM, Math.min(MAX_SYSTEM, value))
}

export function initialShipLogistics(): ShipLogistics {
  return { security: 3, communications: 3, medical: 3, supply: 4, witnessPressure: 0 }
}

/** Persist the operational consequences of alerts, violence and troop movement. */
export function advanceShipLogistics(current: ShipLogistics, turn: LogisticsTurn): ShipLogistics {
  let { security, communications, medical, supply, witnessPressure } = current

  if (turn.eventKind === 'ALERT') security += 1
  if (turn.eventKind === 'BLACKOUT') {
    communications -= 2
    security -= 1
  }
  if (turn.eventKind === 'LOCKDOWN') {
    security += 1
    supply -= 1
  }

  supply -= Math.floor(turn.movementCount / 4)
  medical -= turn.incapacitatedCount
  witnessPressure += turn.conflictCount * 2
  if (turn.conflictCount === 0) witnessPressure -= 1
  if (witnessPressure >= 4) security += 1

  return {
    security: clampSystem(security),
    communications: clampSystem(communications),
    medical: clampSystem(medical),
    supply: clampSystem(supply),
    witnessPressure: Math.max(0, witnessPressure),
  }
}

/** Damaged communications, shortages and witnesses reduce the orders a faction can coordinate. */
export function commandCapacityForLogistics(
  logistics: ShipLogistics,
  baseCapacity: number,
): number {
  const penalties =
    Number(logistics.communications <= 1) +
    Number(logistics.supply <= 1) +
    Number(logistics.witnessPressure >= 6)
  return Math.max(2, baseCapacity - penalties)
}
