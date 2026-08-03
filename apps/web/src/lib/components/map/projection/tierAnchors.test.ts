import { describe, expect, it } from 'vitest'
import type { Location } from '@black-whale/domain'
import locations from '../../../../../../../data/locations/locations.json'
import { blueprint, buildShip, spaceForLocation } from '$lib/tour/blueprint'

import { anchorFor, resolveTierSlug } from './tierAnchors'

/** Catalogue rows that hold rooms rather than being one, as blueprint.test names them. */
const CONTAINER_LOCATIONS = new Set([
  'tier-1-queens-living-quarters',
  'tier-1-royal-residential-sector',
  'tier-3-political-ward',
])

/**
 * A marker has to land on the deck that draws its room.
 *
 * The two are not the same question any more. Tier 1 is a liner of three decks
 * and every room on all three still carries a `tier-1-` slug, so filing a
 * marker by that prefix put the casino, the cells, the court, the barracks and
 * the eight queens on the royal deck — at the coordinates where those blocks
 * used to be drawn and where the royal deck now has the bare floor they left.
 * Eighteen passengers stood in rooms that had moved out from under them, and
 * every test passed.
 *
 * So this walks the catalogue: for every location the reconstruction gives a
 * volume, the deck the projection files it under is the deck the blueprint
 * draws it on. It fails on the next block that moves without its anchors.
 */
describe('the deck a marker is filed under', () => {
  const catalogue = locations as unknown as { id: string; parentLocationId: string | null }[]
  const asLocation = (row: { id: string; parentLocationId: string | null }) =>
    ({ ...row, slug: row.id }) as unknown as Location
  const byId = new Map(catalogue.map((row) => [row.id, asLocation(row)]))
  const ship = buildShip()

  it('is the deck the blueprint draws the room on', () => {
    const wrong: string[] = []
    let checked = 0
    for (const row of catalogue) {
      const space = spaceForLocation(ship, row.id)
      if (!space) continue
      checked++
      const filed = resolveTierSlug(asLocation(row), byId)
      if (filed !== space.tierId)
        wrong.push(`${row.id}: filed on ${filed}, drawn on ${space.tierId}`)
    }
    expect(checked).toBeGreaterThan(50)
    expect(wrong).toEqual([])
  })

  /**
   * And every deck the blueprint holds can anchor someone the archive places on
   * it and no finer, which is what a passenger with a tier and no room gets.
   */
  it('anchors every deck for a passenger placed no finer than one', () => {
    for (const deck of blueprint.tiers.filter((tier) => tier.kind === 'deck')) {
      const anchor = resolveTierSlug(
        { slug: deck.id, parentLocationId: null } as unknown as Location,
        byId,
      )
      expect(anchor, `${deck.id} anchors nobody`).toBe(deck.id)
    }
  })
})

/**
 * And a room the catalogue holds is a room a marker can be put *in*.
 *
 * Without an anchor of its own a marker falls back to the nearest parent, and
 * from there to the middle of the deck — which reads as a passenger loitering
 * in a corridor rather than standing where the page puts them. The two rooms
 * the ch. 380 census added arrived exactly like that: catalogued, reconstructed,
 * and with nowhere on the map to stand.
 */
describe('anchors', () => {
  const catalogue = locations as unknown as { id: string; parentLocationId: string | null }[]
  const byId = new Map(
    catalogue.map((row) => [row.id, { ...row, slug: row.id } as unknown as Location]),
  )
  const ship = buildShip()

  it('gives every reconstructed room a place of its own to stand', () => {
    const homeless: string[] = []
    for (const row of catalogue) {
      const space = spaceForLocation(ship, row.id)
      // A tier and the blocks that only hold rooms are not rooms themselves.
      if (!space || CONTAINER_LOCATIONS.has(row.id)) continue
      const deck = resolveTierSlug(byId.get(row.id)!, byId)
      if (!deck) continue
      if (!anchorFor(deck, row.id)) homeless.push(`${row.id} on ${deck}`)
    }
    expect(homeless).toEqual([])
  })
})
