import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { blueprint } from '../../tour/blueprint'
import { resolveRegionLocationSlug } from '../../map/mapAssetRegistry'
import {
  tierOverviewBand,
  tierOverviewSpan,
  tierOverviewY,
} from '../../components/map/markerProjection'
import locations from '../../../../../../data/locations/locations.json'
import type { Space, Tier } from '../../tour/types'

/**
 * The section of `/ship` is the same ship as the decks and the walk.
 *
 * `deckMaps.test.ts` holds the five deck plans to the blueprint corner for
 * corner. This does the same for the drawing at right angles to them: the
 * longitudinal section that `scripts/generate-section-map.py` writes, which is
 * the only place the reconstruction says what is *above* what.
 *
 * It matters more here than on a deck plan, because the section is the drawing
 * that makes a claim nobody can check by eye: that the ship has thirteen metres
 * of unreconstructed deck between each pair of the five it walks. Get that band
 * wrong and the page quietly asserts a solid ship, or a hollow one.
 */

const VIEW_W = 1000
const VIEW_H = 600
const PAD_X = 44
const TOP_ROOM = 74
const SEA_ROOM = 92

const decks = blueprint.tiers.filter((tier) => tier.kind === 'deck')
const xOf = (polygon: readonly (readonly [number, number])[]) => polygon.map(([x]) => x)
const X_MIN = Math.min(...decks.flatMap((tier) => xOf(tier.hull)))
const X_MAX = Math.max(...decks.flatMap((tier) => xOf(tier.hull)))
const TOP = Math.max(...decks.map((tier) => tier.elevation + tier.ceiling))

const SCALE = Math.min((VIEW_W - 2 * PAD_X) / (X_MAX - X_MIN), (VIEW_H - TOP_ROOM - SEA_ROOM) / TOP)
const BASE = VIEW_H - SEA_ROOM

const px = (x: number) => PAD_X + (x - X_MIN) * SCALE
const py = (y: number) => BASE - y * SCALE

/**
 * Where the cut crosses a footprint, or `null` where it passes beside it —
 * the same reading `span_along` makes in the generator, and the thing `cut`
 * on every room is supposed to record.
 *
 * The plane is `z = 0` and the span is measured in `x`, because `x` is the
 * axis the ship is long on: every deck hull is a parallel midbody between two
 * caps at the extremes of `x`, each cap symmetric about `z = 0`. Cut the other
 * way — as this drawing once was — and the section is a transverse one wearing
 * a longitudinal caption, 175 m of beam where the page shows 318 m of ship.
 */
function spanAlong(polygon: readonly (readonly [number, number])[]) {
  const zs = polygon.map(([, z]) => z)
  // A wall resting on the centreline is not a cut through the room: the
  // courthouse and the police station share that wall, one to each side.
  if (!(Math.min(...zs) < 0 && 0 < Math.max(...zs))) return null
  const xs: number[] = []
  for (let i = 0; i < polygon.length; i++) {
    const [x1, z1] = polygon[i]
    const [x2, z2] = polygon[(i + 1) % polygon.length]
    if (z1 * z2 < 0) xs.push(x1 + ((x2 - x1) * (0 - z1)) / (z2 - z1))
    else if (z1 === 0) xs.push(x1)
  }
  return xs.length ? ([Math.min(...xs), Math.max(...xs)] as const) : null
}

/** How long the ship is at a deck, measured where the cut crosses its hull. */
const hullSpan = (tier: Tier) =>
  spanAlong(tier.hull) ?? ([Math.min(...xOf(tier.hull)), Math.max(...xOf(tier.hull))] as const)

interface Room {
  id: string
  tier: string
  region: string | null
  x: number
  y: number
  w: number
  h: number
  label: string
  name: string
  size: number
  cut: boolean
  through: boolean
  inferred: boolean
}

const source = readFileSync(new URL('./black-whale-overview.svelte', import.meta.url), 'utf8')

const between = (open: string, close: string) => {
  const start = source.indexOf(open)
  expect(start, `${open} missing from the generated section`).toBeGreaterThan(-1)
  return source.slice(start, source.indexOf(close, start))
}

// Read the way prettier leaves the file: a name carrying an apostrophe — the
// King's quarters, the queens' corridor — comes back in double quotes.
const ROOM =
  /\{\s*id:\s*'([^']+)',\s*tier:\s*'([^']+)',\s*region:\s*(null|'[^']+'),\s*x:\s*(-?[\d.]+),\s*y:\s*(-?[\d.]+),\s*w:\s*(-?[\d.]+),\s*h:\s*(-?[\d.]+),\s*label:\s*(?:'((?:[^'\\]|\\.)*)'|"([^"]*)"),\s*name:\s*(?:'((?:[^'\\]|\\.)*)'|"([^"]*)"),\s*size:\s*([\d.]+),\s*at:\s*\[[^\]]*\],\s*cut:\s*(true|false),\s*through:\s*(true|false),\s*inferred:\s*(true|false),\s*\}/g

const rooms: Room[] = [...between('const rooms: Room[] = [', '\n  ]').matchAll(ROOM)].map((m) => ({
  id: m[1],
  tier: m[2],
  region: m[3] === 'null' ? null : m[3].slice(1, -1),
  x: Number(m[4]),
  y: Number(m[5]),
  w: Number(m[6]),
  h: Number(m[7]),
  label: (m[8] ?? m[9]).replace(/\\'/g, "'"),
  name: (m[10] ?? m[11]).replace(/\\'/g, "'"),
  size: Number(m[12]),
  cut: m[13] === 'true',
  through: m[14] === 'true',
  inferred: m[15] === 'true',
}))

const DECK =
  /\{\s*id:\s*'([^']+)',\s*name:\s*'((?:[^'\\]|\\.)*)',\s*nameFr:\s*'((?:[^'\\]|\\.)*)',\s*child:\s*(true|false),\s*x0:\s*(-?[\d.]+),\s*x1:\s*(-?[\d.]+),\s*floor:\s*(-?[\d.]+),\s*ceiling:\s*(-?[\d.]+),\s*elevation:\s*(-?[\d.]+),\s*\}/g
const drawnDecks = [...between('const decks = [', '\n  ]').matchAll(DECK)].map((m) => ({
  id: m[1],
  name: m[2].replace(/\\'/g, "'"),
  nameFr: m[3].replace(/\\'/g, "'"),
  child: m[4] === 'true',
  x0: Number(m[5]),
  x1: Number(m[6]),
  floor: Number(m[7]),
  ceiling: Number(m[8]),
  elevation: Number(m[9]),
}))

const GAP =
  /\{\s*id:\s*'([^']+)',\s*x:\s*(-?[\d.]+),\s*y:\s*(-?[\d.]+),\s*w:\s*(-?[\d.]+),\s*h:\s*(-?[\d.]+),\s*metres:\s*([\d.]+),\s*\}/g
const gaps = [...between('const gaps = [', '\n  ]').matchAll(GAP)].map((m) => ({
  id: m[1],
  x: Number(m[2]),
  y: Number(m[3]),
  w: Number(m[4]),
  h: Number(m[5]),
  metres: Number(m[6]),
}))

const deckSpaces: Space[] = blueprint.spaces.filter((space) =>
  decks.some((tier) => tier.id === space.tierId),
)
const tierOf = new Map(decks.map((tier) => [tier.id, tier] as const))
const catalogued = new Set((locations as { id: string }[]).map((location) => location.id))

describe('the longitudinal section', () => {
  it('draws every room the walk holds on a deck, and no room it does not', () => {
    expect(rooms.map((room) => room.id).sort()).toEqual(deckSpaces.map((s) => s.id).sort())
  })

  it('puts every room at the height and the length the blueprint gives it', () => {
    const byId = new Map(rooms.map((room) => [room.id, room] as const))
    for (const space of deckSpaces) {
      const room = byId.get(space.id)!
      const tier = tierOf.get(space.tierId) as Tier
      const cut = spanAlong(space.footprint)
      const [fore, aft] = cut ?? [
        Math.min(...xOf(space.footprint)),
        Math.max(...xOf(space.footprint)),
      ]
      const floor = tier.elevation + (space.floor ?? 0)
      const head = space.ceiling ?? tier.ceiling

      expect(room.x, `${space.id} fore`).toBeCloseTo(px(fore), 1)
      expect(room.x + room.w, `${space.id} aft`).toBeCloseTo(px(aft), 1)
      expect(room.y + room.h, `${space.id} floor`).toBeCloseTo(py(floor), 1)
      expect(room.y, `${space.id} ceiling`).toBeCloseTo(py(floor + head), 1)
    }
  })

  /**
   * The one claim the drawing makes that the deck plans cannot: a room is in
   * the cut, or it is behind it. Get this backwards and a room to starboard is
   * drawn as though the section ran through it.
   */
  it('marks a room as cut exactly when the centreline crosses it', () => {
    const byId = new Map(rooms.map((room) => [room.id, room] as const))
    for (const space of deckSpaces) {
      expect(byId.get(space.id)!.cut, space.id).toBe(spanAlong(space.footprint) !== null)
    }
    expect(rooms.some((room) => room.cut)).toBe(true)
    expect(rooms.some((room) => !room.cut)).toBe(true)
  })

  it('reads circulation and invention off the blueprint rather than by eye', () => {
    const byId = new Map(rooms.map((room) => [room.id, room] as const))
    for (const space of deckSpaces) {
      const room = byId.get(space.id)!
      expect(room.through, space.id).toBe(space.category === 'corridor')
      expect(room.inferred, space.id).toBe(space.provenance === 'inferred')
      expect(room.name, space.id).toBe(space.name)
    }
  })

  it('labels only what the cut passes through, and only where a label fits', () => {
    for (const room of rooms) {
      expect(room.label, room.id).toBe(room.size > 0 ? room.name : '')
      if (room.size > 0) expect(room.cut, `${room.id} is labelled behind the cut`).toBe(true)
    }
  })

  it('names a place the archive holds on every room it invites a click on', () => {
    for (const room of rooms) {
      if (!room.region || !room.cut) continue
      const slug = resolveRegionLocationSlug(room.region)
      expect(slug, `${room.id} → ${room.region}`).not.toBeNull()
      const known = catalogued.has(slug!) || slug!.includes('royal-residential-sector-room-10')
      expect(known, `${room.id} → ${slug}`).toBe(true)
    }
  })

  it('opens the deck a room stands on', () => {
    for (const room of rooms) expect(tierOf.has(room.tier), room.id).toBe(true)
  })
})

describe('the decks of the section', () => {
  it('draws every deck the reconstruction walks, from the top down', () => {
    expect(drawnDecks.map((deck) => deck.id)).toEqual(
      [...decks].sort((a, b) => b.elevation - a.elevation).map((tier) => tier.id),
    )
  })

  /**
   * A deck of the liner is labelled to starboard, on one line. Three tabs on
   * the port margin three and a half metres apart is three labels written over
   * each other, which is what the first drawing of the split did.
   */
  it('says which decks belong to a tier rather than being one', () => {
    for (const deck of drawnDecks) {
      expect(deck.child, deck.id).toBe(Boolean(tierOf.get(deck.id)!.parentTierId))
    }
    expect(drawnDecks.filter((deck) => deck.child).length).toBeGreaterThan(0)
  })

  /**
   * The tabs are the only labels on the section drawn from the blueprint rather
   * than from the dictionary, so both of a deck's names have to travel with it.
   * One name on the drawing is one language reading the other's ship, which is
   * what the first cut did: an English reader was told to click `Pont 1`.
   */
  it('carries each deck name in both languages, as the blueprint gives them', () => {
    for (const deck of drawnDecks) {
      const tier = tierOf.get(deck.id) as Tier
      expect(deck.name, `${deck.id} name`).toBe(tier.name)
      expect(deck.nameFr, `${deck.id} nameFr`).toBe(tier.nameFr)
    }
  })

  it('puts each at its own elevation and its own length', () => {
    for (const deck of drawnDecks) {
      const tier = tierOf.get(deck.id) as Tier
      expect(deck.elevation).toBe(tier.elevation)
      expect(deck.floor, `${deck.id} floor`).toBeCloseTo(py(tier.elevation), 1)
      expect(deck.ceiling, `${deck.id} ceiling`).toBeCloseTo(py(tier.elevation + tier.ceiling), 1)
      // Where the cut crosses the hull, not the hull's widest point: tier 5 is
      // the one deck whose outline is not symmetric about the centreline, and
      // its bow reaches half a metre further out to port than on the cut.
      const [fore, aft] = hullSpan(tier)
      expect(deck.x0, `${deck.id} bow`).toBeCloseTo(px(fore), 1)
      expect(deck.x1, `${deck.id} stern`).toBeCloseTo(px(aft), 1)
    }
  })

  /**
   * A marker on a deck and no finer sits at that deck's mid height. The numbers
   * live in `markerProjection` because that is what places markers, but they
   * are a fact about this drawing, so they are checked against it: redraw the
   * section without moving them and a passenger floats between two decks.
   */
  /**
   * Every deck, not only every tier. A marker is filed on the deck that draws
   * its room, so the decks of the liner carry markers of their own and need a
   * band of their own to sit in — the first split gave them none, and the
   * queens' block ended up on the royal deck's floor.
   */
  it('is where markerProjection thinks each deck is, and as tall', () => {
    for (const deck of drawnDecks) {
      const middle = ((deck.floor + deck.ceiling) / 2 / VIEW_H) * 100
      const band = ((deck.floor - deck.ceiling) / VIEW_H) * 100
      expect(tierOverviewY[deck.id], deck.id).toBeCloseTo(middle, 1)
      expect(tierOverviewBand[deck.id], deck.id).toBeCloseTo(band, 0)
    }
  })

  /**
   * And as long. The whale tapers, so a fixed fan-out ran the short decks'
   * passengers out past their own stern and into the sea the section draws.
   */
  it('is as long as markerProjection lets a crowd spread', () => {
    for (const deck of drawnDecks) {
      const [fore, aft] = tierOverviewSpan[deck.id] ?? []
      expect(fore, `${deck.id} has no span`).toBeDefined()
      expect(fore, `${deck.id} bow`).toBeCloseTo((deck.x0 / VIEW_W) * 100, 1)
      expect(aft, `${deck.id} stern`).toBeCloseTo((deck.x1 / VIEW_W) * 100, 1)
    }
  })
})

describe('the decks the reconstruction does not hold', () => {
  it('bands the space between one deck and the next, and nothing else', () => {
    const order = [...decks].sort((a, b) => a.elevation - b.elevation)
    const expected = order
      .slice(0, -1)
      .map((lower, index) => {
        const upper = order[index + 1]
        return {
          id: `${lower.id}-${upper.id}`,
          metres: Number((upper.elevation - (lower.elevation + lower.ceiling)).toFixed(1)),
        }
      })
      // Under a metre is a slab, not a deck nobody reconstructed: the guest
      // deck sits half a metre over the garrison deck's ceiling, and hatching
      // that would claim a storey in the thickness of a floor.
      .filter((gap) => gap.metres >= 1)
    expect(gaps.map(({ id, metres }) => ({ id, metres }))).toEqual(expected)
  })

  /**
   * The ship has 41 decks and this walks 5. The band is what stands for the
   * other 36, so it must be the taller part of the ship: a section that showed
   * the five as most of the hull would be claiming the reconstruction is nearly
   * complete.
   */
  it('accounts for more of the hull than the five decks do', () => {
    const banded = gaps.reduce((total, gap) => total + gap.metres, 0)
    const walked = decks.reduce((total, tier) => total + tier.ceiling, 0)
    expect(banded).toBeGreaterThan(walked)
  })

  /**
   * Tier 1 is a liner — the ch. 369 exterior shows a dozen terraced levels over
   * the one floor of it anyone has drawn a plan for. Its band therefore runs to
   * the top edge of the drawing instead of closing at a height: closing it would
   * be a claim about how tall the liner is, which no page makes.
   */
  it('leaves the liner over tier 1 open at the top', () => {
    const band = source.match(
      /const superstructure = \{\s*x:\s*(-?[\d.]+),\s*y:\s*(-?[\d.]+),\s*w:\s*(-?[\d.]+),\s*h:\s*(-?[\d.]+),\s*\}/,
    )
    expect(band, 'the section draws no superstructure over tier 1').not.toBeNull()
    const [, x, y, w, h] = band!.map(Number)

    const top = [...decks].sort((a, b) => b.elevation - a.elevation)[0]
    expect(y, 'the band stops short of the top edge').toBe(0)
    expect(y + h, 'the band starts at the top deck’s ceiling').toBeCloseTo(
      py(top.elevation + top.ceiling),
      1,
    )
    const xs = xOf(top.hull)
    expect(x).toBeCloseTo(px(Math.min(...xs)), 1)
    expect(x + w).toBeCloseTo(px(Math.max(...xs)), 1)
    // Open means faded out, not cut off.
    expect(source).toMatch(/mask="url\(#fade-up\)"/)
  })

  it('sits between the decks it separates and never over one', () => {
    for (const gap of gaps) {
      const [lower, upper] = gap.id.split('-tier-')
      const below = tierOf.get(lower) as Tier
      const above = tierOf.get(`tier-${upper}`) as Tier
      expect(gap.y, `${gap.id} top`).toBeCloseTo(py(above.elevation), 1)
      expect(gap.y + gap.h, `${gap.id} bottom`).toBeCloseTo(py(below.elevation + below.ceiling), 1)
    }
  })
})
