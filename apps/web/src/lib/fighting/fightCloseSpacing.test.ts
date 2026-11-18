import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { closeFightPosition } from './fightCloseSpacing'

describe('point-blank presentation spacing', () => {
  it.each(['franklin', 'illumi'] as const)('separates %s on both sides', (id) => {
    const state = {
      ...createFightState(id, 'chrollo'),
      phase: 'fighting' as const,
    }
    for (const direction of [1, -1]) {
      const body = { x: 50, y: 0 }
      const rival = { x: 50 + 4.7 * direction, y: 0 }
      const rendered = closeFightPosition(state, 'player', { body, rival })
      const opposite = closeFightPosition(state, 'opponent', { body: rival, rival: body })
      expect(Math.abs(rendered.x - opposite.x)).toBeGreaterThan(7.2)
      expect(rendered.z).toBeGreaterThan(opposite.z)
      expect(rendered.x + opposite.x).toBeCloseTo(body.x + rival.x)
      expect(body.x).toBe(50)
    }
  })

  it('returns to the combat plane at range and when bodies are vertically separated', () => {
    const state = {
      ...createFightState('franklin', 'chrollo'),
      phase: 'fighting' as const,
    }
    const body = { x: 50, y: 0 }
    for (const rival of [
      { x: 62.1, y: 0 },
      { x: 54, y: 3 },
    ])
      expect(closeFightPosition(state, 'player', { body, rival })).toEqual({ ...body, z: 0 })
  })
})
