import { describe, expect, it } from 'vitest'
import { advanceAirMovement, startJump } from './airMovement'
import { initialFighter } from './types'

describe('Arena airborne movement', () => {
  it('launches, drifts in the take-off direction and lands deterministically', () => {
    const rival = initialFighter([4, 0])
    let fighter = startJump(initialFighter([0, 0]), [1, 0])
    fighter = advanceAirMovement({ fighter, rival, walls: [], dt: 0.2 })
    expect(fighter.height).toBeGreaterThan(0)
    expect(fighter.position[0]).toBeGreaterThan(0)

    fighter = advanceAirMovement({ fighter, rival, walls: [], dt: 1 })
    expect(fighter).toMatchObject({ height: 0, jump: null })
  })

  it('refuses a second jump while airborne', () => {
    const airborne = advanceAirMovement({
      fighter: startJump(initialFighter([0, 0]), [0, 0]),
      rival: initialFighter([4, 0]),
      walls: [],
      dt: 0.1,
    })

    expect(startJump(airborne, [1, 0])).toBe(airborne)
  })
})
