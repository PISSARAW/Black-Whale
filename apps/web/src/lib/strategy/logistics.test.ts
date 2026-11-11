import { describe, expect, it } from 'vitest'
import {
  advanceShipLogistics,
  commandCapacityForLogistics,
  initialShipLogistics,
} from './logistics'

describe('strategy logistics', () => {
  it('lets ship incidents damage persistent infrastructure', () => {
    const blackout = advanceShipLogistics(initialShipLogistics(), {
      eventKind: 'BLACKOUT',
      conflictCount: 0,
      movementCount: 0,
      incapacitatedCount: 0,
    })
    const lockdown = advanceShipLogistics(blackout, {
      eventKind: 'LOCKDOWN',
      conflictCount: 1,
      movementCount: 4,
      incapacitatedCount: 1,
    })

    expect(lockdown).toMatchObject({ communications: 1, medical: 2, supply: 2 })
    expect(lockdown.witnessPressure).toBe(2)
  })

  it('turns shortages and witnesses into reduced command capacity', () => {
    expect(
      commandCapacityForLogistics(
        { security: 5, communications: 1, medical: 0, supply: 1, witnessPressure: 7 },
        5,
      ),
    ).toBe(2)
  })

  it('recovers witness pressure on quiet turns', () => {
    const next = advanceShipLogistics(
      { ...initialShipLogistics(), witnessPressure: 3 },
      { conflictCount: 0, movementCount: 0, incapacitatedCount: 0 },
    )
    expect(next.witnessPressure).toBe(2)
  })
})
