import { describe, expect, it } from 'vitest'
import { COMMAND_POINTS_PER_TURN, intelCertainty, objectiveProgress, planCost } from './rules'

describe('strategy rules', () => {
  it('prices a mixed plan against the command budget', () => {
    const cost = planCost([
      { characterId: 'a', locationId: 'room-1', type: 'MOVE' },
      { characterId: 'b', locationId: 'room-2', type: 'SCOUT' },
      { characterId: 'c', locationId: 'room-3', type: 'GUARD' },
    ])

    expect(cost).toBe(4)
    expect(cost).toBeLessThanOrEqual(COMMAND_POINTS_PER_TURN)
  })

  it('measures the objective with distinct occupied locations', () => {
    expect(objectiveProgress(['room-1', 'room-1', 'room-2'], 3)).toEqual({
      current: 2,
      target: 3,
      complete: false,
    })
    expect(objectiveProgress(['room-1'], 1).complete).toBe(true)
  })

  it('degrades sightings as turns pass', () => {
    expect(intelCertainty(0)).toBe('CONFIRMED')
    expect(intelCertainty(1)).toBe('PROBABLE')
    expect(intelCertainty(4)).toBe('LAST_KNOWN')
  })
})
