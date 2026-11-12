import { describe, expect, it } from 'vitest'
import { createTourSimulation } from './state'
import { advanceNPCRoutines, interruptNPCRoutine, routeBetweenSpaces } from './routines'

const graph = {
  post: ['corridor'],
  corridor: ['post', 'clinic'],
  clinic: ['corridor'],
}

describe('autonomous Tour NPC routines', () => {
  it('finds and walks inter-room routes one step at a time', () => {
    expect(routeBetweenSpaces(graph, 'post', 'clinic')).toEqual(['post', 'corridor', 'clinic'])
    let state = createTourSimulation({ id: 'routines' })
    state.actors.guard = { spaceId: 'post', objective: 'watch', memory: [], nextDecisionAt: 0 }
    const routine = {
      actorId: 'guard',
      repeatsEvery: 24,
      stops: [{ at: 0, spaceId: 'clinic', activity: 'escort-medicines' }],
    }
    state = advanceNPCRoutines(state, { routines: [routine], graph, dt: 1 })
    expect(state.actors.guard.spaceId).toBe('corridor')
    state = advanceNPCRoutines(state, { routines: [routine], graph, dt: 1 })
    expect(state.actors.guard.spaceId).toBe('clinic')
  })

  it('interrupts a schedule when an actor notices an incident', () => {
    let state = createTourSimulation({ id: 'incident' })
    state.actors.guard = { spaceId: 'post', objective: 'watch', memory: [], nextDecisionAt: 0 }
    state = interruptNPCRoutine(state, {
      actorId: 'guard',
      incidentId: 'door-open',
      responseSpaceId: 'warehouse',
    })
    expect(state.actors.guard).toMatchObject({
      spaceId: 'warehouse',
      objective: 'respond:door-open',
      memory: ['door-open'],
    })
  })
})
