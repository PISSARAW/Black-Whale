import { describe, expect, it } from 'vitest'
import { transitionNen } from '@black-whale/nen-engine'
import { decodeTourSimulation, encodeTourSimulation } from './persistence'
import { nenSimulationFor } from './nenSession'
import { createTourSimulation } from './state'

describe('Nen simulation mode session', () => {
  it('creates no simulation for the canonical visit', () => {
    expect(
      nenSimulationFor({ mode: 'CANONICAL_VISIT', stored: null, spaceId: 'room-1004' }),
    ).toBeNull()
  })

  it('restores Free Life Nen, aura, reputation and incidents after serialization', () => {
    const saved = createTourSimulation({ id: 'free', mode: 'FREE_LIFE', spaceId: 'room-1004' })
    saved.player.aura = 37
    saved.player.nen = transitionNen(saved.player.nen, { type: 'REN' }).state
    saved.reputation['royal-army'] = -10
    saved.incidents.push('hostile-nen:room-1004')
    const restored = decodeTourSimulation(encodeTourSimulation(saved))
    expect(nenSimulationFor({ mode: 'FREE_LIFE', stored: restored })).toEqual(saved)
  })

  it('does not hydrate one simulation mode into the other', () => {
    const free = createTourSimulation({ id: 'free', mode: 'FREE_LIFE' })
    const alternate = nenSimulationFor({ mode: 'ALTERNATE_SIMULATION', stored: free })
    expect(alternate?.mode).toBe('ALTERNATE_SIMULATION')
    expect(alternate?.id).not.toBe(free.id)
  })
})
