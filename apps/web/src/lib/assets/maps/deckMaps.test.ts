import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { blueprint } from '../../tour/blueprint'
import { resolveRegionLocationSlug } from '../../map/mapAssetRegistry'
import locations from '../../../../../../data/locations/locations.json'
import type { Polygon, Space, Tier } from '../../tour/types'

/**
 * The deck maps of `/ship` and the walk of `/tour` are the same ship.
 *
 * Both are projections of `data/ship/blueprint.json` — the maps through
 * `scripts/generate-deck-maps.py`, the walk through `buildShip` — and the whole
 * point of generating the maps was that the two can no longer disagree. That
 * only holds while the generated files are in step with the blueprint, though,
 * and a checked-in artefact drifts the moment someone edits a footprint and
 * does not rerun the generator. Then `/ship` draws a room where `/tour` no
 * longer walks one, which is exactly the mismatch the generation was meant to
 * end.
 *
 * So this reads the five committed maps back and holds them to the blueprint:
 * same rooms, same corners, same hull, same reading of what is a corridor and
 * what the reconstruction invented. It fails on drift rather than waiting for a
 * reader to spot it.
 */

/**
 * The scale contract of the deck plans: one unit is 0.35 m, midship at 500,300.
 * Two decimals, and never none — the generator writes them the way Python
 * prints a rounded float, so a whole number still carries its `.0`.
 */
const unit = (metres: number, origin: number) =>
  (metres / 0.35 + origin).toFixed(2).replace(/0$/, '')

const drawn = (polygon: Polygon) =>
  polygon.map(([x, z]) => `${unit(x, 500)},${unit(z, 300)}`).join(' ')

interface Region {
  id: string
  region: string | null
  points: string
  label: string
  size: number
  turned: boolean
  through: boolean
  inferred: boolean
}

// Read the way prettier leaves the file rather than the way the generator
// writes it: a name with an apostrophe in it — the queens' corridor, the King's
// quarters — comes back in double quotes, and a long run of points comes back
// on a line of its own.
const ENTRY =
  /\{\s*id:\s*'([^']+)',\s*region:\s*(null|'[^']+'),\s*points:\s*'([^']+)',\s*label:\s*(?:'((?:[^'\\]|\\.)*)'|"([^"]*)"),\s*size:\s*(\d+),\s*at:\s*\[[^\]]*\],\s*turned:\s*(true|false),\s*through:\s*(true|false),\s*inferred:\s*(true|false),\s*\}/g

function readMap(tierId: string) {
  const source = readFileSync(new URL(`./${tierId}.svelte`, import.meta.url), 'utf8')
  const regions: Region[] = []
  for (const match of source.matchAll(ENTRY)) {
    regions.push({
      id: match[1],
      region: match[2] === 'null' ? null : match[2].slice(1, -1),
      points: match[3],
      label: (match[4] ?? match[5]).replace(/\\'/g, "'"),
      size: Number(match[6]),
      turned: match[7] === 'true',
      through: match[8] === 'true',
      inferred: match[9] === 'true',
    })
  }
  const hull = source.match(/class="hull"[\s\S]*?points="([^"]+)"/)
  return { regions, hull: hull?.[1] ?? null }
}

const catalogued = new Set((locations as { id: string }[]).map((location) => location.id))
const decks = blueprint.tiers.filter((tier) => tier.kind === 'deck')
const spacesOf = (tier: Tier): Space[] =>
  blueprint.spaces.filter((space) => space.tierId === tier.id)

describe.each(decks.map((tier) => [tier.id, tier] as const))('%s', (_id, tier) => {
  const { regions, hull } = readMap(tier.id)
  const rooms = spacesOf(tier)
  const byId = new Map(regions.map((region) => [region.id, region]))

  it('draws the hull the blueprint gives this deck', () => {
    expect(hull).toBe(drawn(tier.hull))
  })

  it('draws every room the walk holds, and no room it does not', () => {
    expect([...byId.keys()].sort()).toEqual(rooms.map((room) => room.id).sort())
    expect(regions).toHaveLength(rooms.length)
  })

  it('puts every room where the blueprint puts it, corner for corner', () => {
    for (const room of rooms) {
      expect(byId.get(room.id)!.points, room.id).toBe(drawn(room.footprint))
    }
  })

  it('reads circulation and invention off the blueprint rather than by eye', () => {
    for (const room of rooms) {
      const region = byId.get(room.id)!
      expect(region.through, room.id).toBe(room.category === 'corridor')
      expect(region.inferred, room.id).toBe(room.provenance === 'inferred')
    }
  })

  it('names rooms by the name the walk shows, or leaves them unnamed', () => {
    for (const room of rooms) {
      const region = byId.get(room.id)!
      expect(region.label, room.id).toBe(region.size > 0 ? room.name : '')
    }
  })

  /**
   * A click has to land somewhere. `MapContainer` reads the region id twice —
   * once for the plan to zoom into, once for the record to show beside it — and
   * the second is the one that must never come up empty: an area with no plan
   * drawn for it still names a place the archive holds, and says so. A region
   * naming nothing would open a blank panel on a room that looks clickable.
   */
  it('names a place the archive holds on every room it invites a click on', () => {
    for (const region of regions) {
      if (!region.region) continue
      const slug = resolveRegionLocationSlug(region.region)
      expect(slug, `${region.id} → ${region.region}`).not.toBeNull()
      const known = catalogued.has(slug!) || slug!.includes('royal-residential-sector-room-10')
      expect(known, `${region.id} → ${slug}`).toBe(true)
    }
  })

  it('only invites a click on a room the catalogue has a record for', () => {
    for (const room of rooms) {
      if (room.locationId) continue
      expect(byId.get(room.id)!.region, room.id).toBeNull()
    }
  })
})
