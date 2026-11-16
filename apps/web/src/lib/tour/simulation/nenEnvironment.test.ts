import { describe, expect, it } from 'vitest'
import { createTourSimulation } from './state'
import { ensureNenPilotZone, targetsInNenSpace, TIER_5_NEN_PILOT_SPACE } from './nenEnvironment'

describe('Nen-compatible Tour environment', () => {
  it('seeds the pilot zone once with a non-Nen route', () => {
    const first = ensureNenPilotZone(createTourSimulation({ id: 'pilot' }))
    const second = ensureNenPilotZone(first)
    const targets = targetsInNenSpace(second, TIER_5_NEN_PILOT_SPACE)

    expect(second).toBe(first)
    expect(targets.map(({ kind }) => kind)).toEqual(['door', 'device', 'object', 'person'])
    expect(targets.find(({ kind }) => kind === 'door')?.ordinarySolution).toContain('badge')
  })
})
