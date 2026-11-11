import { describe, expect, it } from 'vitest'
import { advanceDynamicEvents, scheduleWorldEvent } from './events'
import { createTourSimulation } from './state'

describe('dynamic Tour events', () => {
  it('lets an incident trigger an off-screen security response later', () => {
    let state = createTourSimulation({ id: 'events' })
    state.incidents.push('warehouse-door-forced')
    state = scheduleWorldEvent(state, {
      id: 'warehouse-sweep',
      kind: 'SECURITY_SWEEP',
      dueAt: 10,
      spaceId: 'tier-5-warehouse',
      requiresIncident: 'warehouse-door-forced',
    })
    state = advanceDynamicEvents(state, 11)
    expect(state.incidents).toContain('security-sweep:tier-5-warehouse')
    expect(state.activities['dynamic-event:warehouse-sweep'].status).toBe('RESOLVED')
  })

  it('does not fire a conditional event before its evidence exists', () => {
    let state = scheduleWorldEvent(createTourSimulation({ id: 'waiting' }), {
      id: 'rumor',
      kind: 'RUMOR_SPREAD',
      dueAt: 1,
      spaceId: 'tier-4',
      requiresIncident: 'witness-report',
    })
    state = advanceDynamicEvents(state, 10)
    expect(state.activities['dynamic-event:rumor'].status).toBe('ACTIVE')
  })
})
