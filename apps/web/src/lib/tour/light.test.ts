import { describe, expect, it } from 'vitest'
import { buildShip, ceilingOf } from './blueprint'
import {
  CATEGORY_LIGHT,
  DECK_LIGHT,
  MAX_SPACING,
  REACH_RATIO,
  deckLight,
  lampFalloff,
  lamplightOf,
  lampsOf,
} from './light'
import type { Space, SpaceCategory, Tier } from './types'

const ship = buildShip()

const tierOf = (id: string): Tier => ship.plans.get(id)!.tier

/** A room of a given category, with nothing in it but the category. */
const roomOf = (category: SpaceCategory, footprint = SQUARE): Space =>
  ({ id: `test-${category}`, category, footprint, provenance: 'plan' }) as unknown as Space

/** Forty metres square, big enough to hold a grid at any spacing on this list. */
const SQUARE = [
  [0, 0],
  [40, 0],
  [40, 40],
  [0, 40],
] as unknown as Space['footprint']

/**
 * The one thing this module is for.
 *
 * Not that the numbers are these numbers — they are a reading of the ship and
 * they will be adjusted — but that the *direction* holds all the way down the
 * five decks, because that direction is the claim: the light is the class
 * system, and a corridor is a different room on Tier 1 and in the hold without
 * either of them being declared anywhere.
 */
describe('the class grid', () => {
  it('lights the royal deck closer, warmer and harder than the hold', () => {
    const royal = lamplightOf(roomOf('corridor'), tierOf('tier-1'))
    const hold = lamplightOf(roomOf('corridor'), tierOf('tier-5'))

    expect(royal.spacing).toBeLessThan(hold.spacing)
    expect(royal.power).toBeGreaterThan(hold.power)
    // Warm against cold, read as red over blue: 2 700 K against 6 500 K.
    expect(royal.glow[0] / royal.glow[2]).toBeGreaterThan(hold.glow[0] / hold.glow[2])
    // And nobody is changing the tubes down there.
    expect(hold.dead).toBeGreaterThan(0)
    expect(royal.dead).toBe(0)
  })

  it('falls monotonically from the King to the springs, deck by deck', () => {
    const decks = ['tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5'].map((id) =>
      lamplightOf(roomOf('corridor'), tierOf(id)),
    )
    for (let i = 1; i < decks.length; i++) {
      expect(
        decks[i].spacing,
        `deck ${i + 1} hangs its lamps closer than deck ${i}`,
      ).toBeGreaterThan(decks[i - 1].spacing)
      expect(decks[i].power, `deck ${i + 1} burns harder than deck ${i}`).toBeLessThan(
        decks[i - 1].power,
      )
    }
  })

  it('takes an interior for the deck it is inside', () => {
    // An interior carries the elevation of the deck it is the inside of, so a
    // prince's apartment is lit like Tier 1 without anything having to say so —
    // the same thing `hullRumble` gets from the same field.
    const inside = [...ship.plans.values()].find(
      (plan) => plan.tier.kind === 'interior' && plan.tier.elevation === tierOf('tier-1').elevation,
    )
    expect(inside, 'no interior on Tier 1 to check').toBeDefined()
    expect(lamplightOf(roomOf('quarters'), inside!.tier)).toEqual(
      lamplightOf(roomOf('quarters'), tierOf('tier-1')),
    )
  })

  it('reads a level between two decks as being between them', () => {
    const [hold, above] = DECK_LIGHT
    const between = deckLight((hold.elevation + above.elevation) / 2)
    expect(between.spacing).toBeCloseTo((hold.spacing + above.spacing) / 2, 6)
    expect(between.power).toBeCloseTo((hold.power + above.power) / 2, 6)
  })

  it('is flat below the hold and above the King', () => {
    const [hold] = DECK_LIGHT
    const royal = DECK_LIGHT[DECK_LIGHT.length - 1]
    expect(deckLight(-40).spacing).toBe(hold.spacing)
    expect(deckLight(400).spacing).toBe(royal.spacing)
  })

  it('inflects the deck by what the room is for without overruling it', () => {
    const ward = lamplightOf(roomOf('medical'), tierOf('tier-3'))
    const hall = lamplightOf(roomOf('ceremonial'), tierOf('tier-3'))
    // An infirmary is close, even and shadowless; a banquet is one source and a
    // great deal of dark. Both on the same deck, so this is the category alone.
    expect(ward.spacing).toBeLessThan(hall.spacing)
    expect(ward.power).toBeGreaterThan(hall.power)

    // But a Tier 1 ward is still a Tier 1 room: the tables multiply, and there
    // is no room on this ship whose light is not first of all a statement about
    // which deck it is on.
    expect(lamplightOf(roomOf('medical'), tierOf('tier-1')).spacing).toBeLessThan(ward.spacing)
  })

  it('keeps a lamp’s reach on the grid it hangs on', () => {
    // Load-bearing: `RoomLight.pool` searches a fixed window of cells, and it is
    // only right because the reach follows the spacing. Raise the ratio and the
    // bake starts silently missing lamps that are in range.
    for (const category of Object.keys(CATEGORY_LIGHT) as SpaceCategory[]) {
      for (const id of ['tier-1', 'tier-5']) {
        const light = lamplightOf(roomOf(category), tierOf(id))
        expect(light.reach).toBeCloseTo(light.spacing * REACH_RATIO, 9)
        expect(light.spacing).toBeLessThanOrEqual(MAX_SPACING)
      }
    }
  })

  it('lights the floor under a fitting however high the ceiling is', () => {
    // The bug this is here for: the reach is a property of the grid and the
    // drop from the ceiling is a property of the room, and cutting a lamp off
    // on the two of them together let a tall room fall out of the light
    // altogether. Six did — the King's living quarters, the banquet hall and
    // its service end, the VIP casino, the screening room and the police
    // atrium — and they are the six rooms on this ship that most obviously
    // cannot be the darkest places on board.
    for (const plan of ship.plans.values()) {
      for (const space of plan.spaces) {
        const { reach } = lamplightOf(space, plan.tier)
        const drop = ceilingOf(space, plan.tier)
        expect(
          lampFalloff(0, drop, reach),
          `${space.id} is unlit under its own lamps`,
        ).toBeGreaterThan(0)
      }
    }
  })

  it('reads the height of a room without letting it settle the class', () => {
    // A high room is a dimmer room — that much is a lamp. What it must not be
    // is a room of another class: Tier 1 hangs its lamps closest, so a reach
    // spent on the drop punished the royal deck hardest, and the ladder the
    // deck table builds came out upside down.
    const royal = lamplightOf(roomOf('quarters'), tierOf('tier-1'))
    const hold = lamplightOf(roomOf('quarters'), tierOf('tier-5'))
    const under = (light: { reach: number }, ceiling: number) =>
      lampFalloff(0, ceiling, light.reach)

    // Seven metres of ceiling in the King's quarters against three in a cell in
    // the hold, which is the worst case the ship actually holds.
    expect(under(royal, 7)).toBeLessThan(under(royal, 3))
    expect(under(royal, 7)).toBeGreaterThan(0)
    // And the pool a lamp throws still narrows as the room gets taller rather
    // than snapping shut: half the ceiling, more than half the light.
    expect(under(royal, 3.5)).toBeGreaterThan(under(royal, 7) * 2)
    expect(hold.reach).toBeGreaterThan(royal.reach)
  })

  it('leaves a lamp burning in the hold however many the hash kills', () => {
    // A room whose every lamp went out would be a sealed room rather than a
    // badly lit one, which is not what a dead tube says about the ship.
    for (const plan of ship.plans.values()) {
      for (const space of plan.spaces) {
        const light = lamplightOf(space, plan.tier)
        expect(
          lampsOf(space.footprint, light).length,
          `${space.id} has no light in it`,
        ).toBeGreaterThan(0)
      }
    }
  })

  it('puts the same lamps out every time it is asked', () => {
    // The deck is baked afresh on every load. A lamp that was out last time has
    // to be out this time, or the hold flickers at the rate the visitor changes
    // decks — which is the one thing a dead lamp must not do.
    const plan = ship.plans.get('tier-5')!
    const space = plan.spaces.find((entry) => entry.category === 'storage') ?? plan.spaces[0]
    const light = lamplightOf(space, plan.tier)
    expect(lampsOf(space.footprint, light)).toEqual(lampsOf(space.footprint, light))
  })

  it('actually loses some of the hold’s lamps to the dark', () => {
    const plan = ship.plans.get('tier-5')!
    let all = 0
    let lit = 0
    for (const space of plan.spaces) {
      const light = lamplightOf(space, plan.tier)
      all += lampsOf(space.footprint, { ...light, dead: 0 }).length
      lit += lampsOf(space.footprint, light).length
    }
    expect(lit).toBeLessThan(all)
    // About one in twelve, which is what the deck table claims.
    expect(1 - lit / all).toBeGreaterThan(0.03)
    expect(1 - lit / all).toBeLessThan(0.16)
  })
})
