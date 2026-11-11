import { describe, expect, it } from 'vitest'
import { applyTourActivityResult, beginTourActivity } from './activities'
import { createTourSimulation } from './state'

describe('integrated Tour activities', () => {
  it.each([
    ['INVESTIGATION', '/investigation'],
    ['INFILTRATION', '/infiltration'],
    ['HUNT', '/hunt'],
    ['STRATEGY', '/strategy'],
  ] as const)('launches %s with the same persistent world context', (mode, route) => {
    const launched = beginTourActivity(createTourSimulation({ id: 'central-world' }), mode)
    expect(launched.href).toMatch(new RegExp(`^${route}\\?tourActivity=`))
    expect(launched.handoff.simulationId).toBe('central-world')
    expect(launched.state.activities[`external:${launched.handoff.id}`].status).toBe('ACTIVE')
  })

  it('folds an activity result back into aura, knowledge, reputation and incidents', () => {
    const launched = beginTourActivity(
      createTourSimulation({ id: 'central-world', spaceId: 'tier-5-warehouse' }),
      'INVESTIGATION',
      'missing-parcel-case',
    )
    const returned = applyTourActivityResult(launched.state, {
      version: 1,
      activityId: 'missing-parcel-case',
      completed: true,
      auraDelta: -12,
      learnedFactIds: ['parcel-owner-identified'],
      reputationDelta: { hunters: 8 },
      incidentIds: ['suspect-questioned'],
    })
    expect(returned.player).toMatchObject({
      spaceId: 'tier-5-warehouse',
      aura: 88,
      knowledge: ['parcel-owner-identified'],
    })
    expect(returned.reputation.hunters).toBe(8)
    expect(returned.incidents).toContain('suspect-questioned')
  })
})
