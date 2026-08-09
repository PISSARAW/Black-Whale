import { describe, expect, it } from 'vitest'
import { theShip } from '$lib/tour/blueprint'
import { mainSceneSpace } from './sceneEntry'

describe('living reconstruction scene entry', () => {
  const ship = theShip()

  it('opens an apartment event in its main living room', () => {
    expect(mainSceneSpace(ship, 'tier-1-royal-residential-sector-room-1014')?.id).toBe(
      'tier-1-royal-residential-sector-room-1014-living',
    )
  })

  it('opens the King’s quarters in the authored royal salon', () => {
    expect(mainSceneSpace(ship, 'tier-1-king-living-quarters')?.id).toBe(
      'tier-1-king-living-quarters-living',
    )
  })

  it('opens a single-room interior in its detailed main room', () => {
    expect(mainSceneSpace(ship, 'tier-1-princes-burial-chamber')?.id).toBe(
      'tier-1-princes-burial-chamber-rotunda',
    )
  })

  it('returns no destination when the event has no mapped room', () => {
    expect(mainSceneSpace(ship, null)).toBeNull()
    expect(mainSceneSpace(ship, 'unknown-location')).toBeNull()
  })
})
