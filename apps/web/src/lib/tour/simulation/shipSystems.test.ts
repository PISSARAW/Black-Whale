import { describe, expect, it } from 'vitest'
import { createTourSimulation } from './state'
import { applyShipIncident, shipInteractionModifiers } from './shipSystems'

describe('simulated Black Whale systems', () => {
  it('turns a blackout and lockdown into visibility and access constraints', () => {
    let state = createTourSimulation({ id: 'systems' })
    state = applyShipIncident(state, 'tier-3-elevator-lobby', 'BLACKOUT')
    state = applyShipIncident(state, 'tier-3-elevator-lobby', 'LOCKDOWN')
    expect(shipInteractionModifiers(state, 'tier-3-elevator-lobby')).toMatchObject({
      visible: false,
      traversable: false,
    })
  })

  it('lets fire alter acoustics, ventilation and future sensing', () => {
    const state = applyShipIncident(
      createTourSimulation({ id: 'fire' }),
      'tier-5-warehouse',
      'FIRE',
    )
    expect(state.shipSystems['tier-5-warehouse']).toMatchObject({
      fire: true,
      ventilation: 40,
      noise: 65,
    })
    expect(shipInteractionModifiers(state, 'tier-5-warehouse').sensingNoise).toBe(0.65)
  })
})
