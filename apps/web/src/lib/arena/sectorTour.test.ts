import { describe, expect, it } from 'vitest'
import { EMPTY_WORLD } from '../tour/hatsu'
import { createArenaSectorSnapshot } from './sectorPersistence'
import { arenaSectorSituation, projectArenaSectorIntoTour } from './sectorTour'

describe('Arena sector inside Tour', () => {
  it('keeps swallowed scenery absent and displaced scenery at its combat position', () => {
    const snapshot = createArenaSectorSnapshot()
    snapshot.physicalObjects = {
      stored: { id: 'stored', position: [1, 2], storedBy: 'player' },
      displaced: { id: 'displaced', position: [7, 4], storedBy: null },
    }
    const world = {
      ...EMPTY_WORLD,
      solids: { displaced: { rotation: 90 } },
    }

    const projected = projectArenaSectorIntoTour(world, snapshot)

    expect(projected.solids.stored).toEqual({ gone: true })
    expect(projected.solids.displaced).toEqual({ at: [7, 4], gone: false, rotation: 90 })
    expect(world.solids.displaced).toEqual({ rotation: 90 })
  })

  it('escalates the next duel briefing from altered to watched to lockdown', () => {
    const snapshot = createArenaSectorSnapshot()
    snapshot.fights = 1
    expect(arenaSectorSituation(snapshot).phase).toBe('altered')

    snapshot.witnesses = 1
    expect(arenaSectorSituation(snapshot).phase).toBe('watched')

    snapshot.securityAlert = 2
    expect(arenaSectorSituation(snapshot)).toMatchObject({
      phase: 'lockdown',
      fights: 1,
      witnesses: 1,
      securityAlert: 2,
    })
  })
})
