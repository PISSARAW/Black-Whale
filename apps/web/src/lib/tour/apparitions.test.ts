import { describe, expect, it } from 'vitest'
import { buildShip, ceilingOf, floorOf } from './blueprint'
import {
  PORTAL_REACH,
  SHOAL,
  apparitionsOn,
  flashFor,
  wormMouthAt,
  wormMouths,
  type Apparition,
} from './apparitions'
import {
  EMPTY_WORLD,
  castInTour,
  centroid,
  fishBite,
  openTheBook,
  turnTheBook,
  type TourWorld,
} from './hatsu'

const ship = buildShip()

const furnished = [...ship.spaces.values()].find((space) =>
  ship.structures.some((structure) => structure.spaceId === space.id),
)!
const elsewhere = [...ship.spaces.values()].find((space) => space.tierId !== furnished.tierId)!

const of = (world: TourWorld, kind: Apparition['kind']) =>
  apparitionsOn(ship, world).filter((seen) => seen.kind === kind)

const cast = (world: TourWorld, kind: Parameters<typeof castInTour>[1], targetId: string) =>
  castInTour(world, kind, { ship, targetId, standingIn: furnished.id, at: [0, 0] })

describe('what a quiet ship shows', () => {
  it('shows nothing at all', () => {
    expect(apparitionsOn(ship, EMPTY_WORLD)).toEqual([])
  })
})

describe('the book', () => {
  const walking = { at: [0, 0] as [number, number], tierId: furnished.tierId }
  const dealt = openTheBook(() => 0)
  const carrying: TourWorld = { ...EMPTY_WORLD, holding: 'bookmark', book: dealt }

  it('is held open in front of whoever is carrying the bookmark', () => {
    // Carried rather than placed, like the hoover and the chain: the scene puts
    // it under the eye every frame, so what this says is only which deck.
    const [book] = apparitionsOn(ship, carrying, walking).filter((seen) => seen.kind === 'book')
    expect(book.tierId).toBe(furnished.tierId)
    expect(book.at).toEqual(walking.at)

    // And it is the bookmark's own: no aura, no book.
    expect(
      apparitionsOn(ship, { ...carrying, holding: null }, walking).filter(
        (seen) => seen.kind === 'book',
      ),
    ).toEqual([])
  })

  it('puts the ribbon on the page the bookmark is holding, and moves it with it', () => {
    const [before] = apparitionsOn(ship, carrying, walking).filter((seen) => seen.kind === 'book')
    expect(before.stage).toBe(dealt.pages.indexOf(dealt.bookmark!))

    const turned = { ...carrying, book: turnTheBook(dealt) }
    const [after] = apparitionsOn(ship, turned, walking).filter((seen) => seen.kind === 'book')
    expect(after.stage).not.toBe(before.stage)
  })
})

describe('the owl', () => {
  it('perches in the room Secret Window was cast on, and nowhere else', () => {
    const world = cast(EMPTY_WORLD, 'surveillance', elsewhere.id).world
    expect(world.owl).toBe(elsewhere.id)
    const [owl] = of(world, 'owl')
    expect(owl.spaceId).toBe(elsewhere.id)
    // Where the aura came down, which the cast remembered.
    expect(owl.at).toEqual(world.landed[elsewhere.id])
  })

  it('moves rather than multiplying, and is recalled from where it sits', () => {
    const attached = cast(EMPTY_WORLD, 'surveillance', elsewhere.id).world
    const moved = cast(attached, 'surveillance', furnished.id).world
    expect(of(moved, 'owl')).toHaveLength(1)
    expect(moved.owl).toBe(furnished.id)

    const recalled = cast(moved, 'surveillance', furnished.id)
    expect(recalled.report).toMatchObject({ kind: 'owl-recalled' })
    expect(of(recalled.world, 'owl')).toEqual([])
  })

  it('never perches through the deckhead of the room it is in', () => {
    const world = cast(EMPTY_WORLD, 'surveillance', furnished.id).world
    const tier = ship.tiers.find((candidate) => candidate.id === furnished.tierId)!
    const [owl] = of(world, 'owl')
    expect(owl.y).toBeLessThan(floorOf(furnished, tier) + ceilingOf(furnished, tier))
  })
})

describe('the cards', () => {
  it('lays one card per stage of the tribunal, in the stage’s own colour', () => {
    let world = cast(EMPTY_WORLD, 'tribunal', elsewhere.id).world
    expect(of(world, 'card')[0].stage).toBe(1)
    world = cast(world, 'tribunal', elsewhere.id).world
    const [yellow] = of(world, 'card')
    expect(yellow.stage).toBe(2)
    expect(yellow.colour).toBe(0xf0c94d)
    // The same card turned over rather than a second one laid beside it.
    expect(of(world, 'card')).toHaveLength(1)
  })
})

describe('the curse', () => {
  it('marks the victim openly and hides the sacrifice until the ship is laid open', () => {
    const world = cast(EMPTY_WORLD, 'curse', elsewhere.id).world
    const marks = of(world, 'mark')
    const victim = marks.find((mark) => mark.spaceId === world.curse!.victim)!
    expect(victim.hidden).toBe(false)
    const hidden = marks.filter((mark) => mark.hidden)
    // A victim whose sacrifice is itself has one mark and nothing to find.
    if (world.curse!.sacrifice !== world.curse!.victim) {
      expect(hidden).toHaveLength(1)
      expect(of({ ...world, laidOpen: true }, 'mark').every((mark) => !mark.hidden)).toBe(true)
    }
  })
})

describe('the baton', () => {
  it('leaves a star over the room whose Hatsu it took, and nothing over a living one', () => {
    const emptied = cast(EMPTY_WORLD, 'vacuum', elsewhere.id).world
    const taken = cast(emptied, 'inherit', elsewhere.id)
    expect(taken.report).toMatchObject({ kind: 'inherited' })
    expect(of(taken.world, 'star').map((star) => star.spaceId)).toEqual([elsewhere.id])

    const refused = cast(EMPTY_WORLD, 'inherit', elsewhere.id)
    expect(refused.report).toMatchObject({ kind: 'not-eligible' })
    expect(of(refused.world, 'star')).toEqual([])
  })
})

describe('the double', () => {
  it('stands in the room it was left in', () => {
    const world = cast(EMPTY_WORLD, 'guardian', elsewhere.id).world
    expect(of(world, 'double').map((seen) => seen.spaceId)).toEqual([elsewhere.id])
  })
})

describe('the tunnel', () => {
  const paired = (() => {
    const first = cast(EMPTY_WORLD, 'portal', furnished.id).world
    return cast(first, 'portal', elsewhere.id).world
  })()

  it('stands one mouth at each end, and pairs them with each other', () => {
    const mouths = of(paired, 'portal')
    expect(mouths.map((mouth) => mouth.spaceId).sort()).toEqual([furnished.id, elsewhere.id].sort())
    expect(mouths[0].pair?.spaceId).toBe(mouths[1].spaceId)
    expect(mouths[1].pair?.spaceId).toBe(mouths[0].spaceId)
  })

  it('leaves a half-placed tunnel a mouth with nothing on the other side', () => {
    const half = cast(EMPTY_WORLD, 'portal', furnished.id).world
    const mouths = of(half, 'portal')
    expect(mouths).toHaveLength(1)
    expect(mouths[0].pair).toBeUndefined()
  })

  it('is crossed by walking into the doorway rather than into the room', () => {
    const mouth = wormMouths(ship, paired).find((end) => end.spaceId === furnished.id)!
    expect(wormMouthAt(ship, paired, mouth.tierId, mouth.at)).toBe(furnished.id)
    // A step past the mouth is still the same room, and is not a crossing.
    const aside: [number, number] = [mouth.at[0] + PORTAL_REACH + 1, mouth.at[1]]
    expect(wormMouthAt(ship, paired, mouth.tierId, aside)).toBeNull()
    // Nor is standing where the far mouth is, on the wrong deck.
    expect(wormMouthAt(ship, paired, 'nowhere', mouth.at)).toBeNull()
  })
})

describe('the fish', () => {
  it('swims a shoal in the room it was loosed in, spread over the room itself', () => {
    const loosed = cast(EMPTY_WORLD, 'devour', elsewhere.id).world
    const shoal = of(loosed, 'fish')
    expect(shoal).toHaveLength(SHOAL)
    expect(new Set(shoal.map((fish) => fish.stage)).size).toBe(SHOAL)
    // Every fish is given the room's own reach to swim, and it is a room's.
    expect(shoal.every((fish) => (fish.spread ?? 0) > 0)).toBe(true)

    // An open room is loosed in too, and keeps its doorways.
    const alone = cast(EMPTY_WORLD, 'devour', elsewhere.id).world
    expect(alone.shut).toEqual([])
    expect(of(alone, 'fish')).toHaveLength(SHOAL)
  })

  it('eats one thing at a time, and stops when the room is bare', () => {
    let world = cast(EMPTY_WORLD, 'devour', furnished.id).world
    const there = ship.structures.filter((solid) => solid.spaceId === furnished.id).length

    for (let i = 0; i < there; i++) {
      const bite = fishBite(world, ship, furnished.id)!
      expect(bite.report).toMatchObject({ kind: 'fish-fed', spaceId: furnished.id })
      world = bite.world
    }
    expect(fishBite(world, ship, furnished.id)).toBeNull()
    // And a room the fish were never loosed in is never touched.
    expect(fishBite(world, ship, elsewhere.id)).toBeNull()
  })
})

describe('the paper dolls', () => {
  it('sticks one to everything standing in the room, and throws a few more besides', () => {
    const world = cast(EMPTY_WORLD, 'paper-spy', furnished.id).world
    const scraps = of(world, 'paper')
    const there = ship.structures.filter((solid) => solid.spaceId === furnished.id)
    expect(scraps.length).toBe(there.length + 5)
    for (const solid of there) {
      expect(scraps.some((scrap) => scrap.at === solid.at || scrap.id.endsWith(solid.id))).toBe(
        true,
      )
    }
  })
})

describe('the relay', () => {
  it('shows the cargo only while the relay is the aura being held', () => {
    const solid = ship.structures.find((structure) => structure.spaceId === furnished.id)!
    const loaded = { ...EMPTY_WORLD, pairing: solid.id }
    expect(of(loaded, 'cargo')).toEqual([])
    expect(
      of({ ...loaded, holding: 'relay' as const }, 'cargo').map((seen) => seen.spaceId),
    ).toEqual([furnished.id])
  })
})

describe('The Sun and Moon', () => {
  const marked = (mark: 'sun' | 'moon') => {
    const solid = ship.structures.find((structure) => structure.spaceId === furnished.id)!
    const world = castInTour(EMPTY_WORLD, 'polarity', {
      ship,
      targetId: furnished.id,
      targetSolidId: solid.id,
      standingIn: furnished.id,
      at: [0, 0],
      mark,
    }).world
    return { solid, world }
  }

  it('wears the mark the hand that cast put on it, over the thing itself', () => {
    for (const [mark, kind] of [
      ['sun', 'sun-mark'],
      ['moon', 'moon-mark'],
    ] as const) {
      const { solid, world } = marked(mark)
      const [seen] = of(world, kind)
      expect(seen.spaceId).toBe(furnished.id)
      // On the thing, give or take the drift a woken thing is under: what the
      // mark must not do is stay behind where the thing used to stand.
      expect(Math.hypot(seen.at[0] - solid.at[0], seen.at[1] - solid.at[1])).toBeLessThan(1.5)
      // Over the top of it, never through the deckhead.
      const tier = ship.tiers.find((candidate) => candidate.id === furnished.tierId)!
      expect(seen.y).toBeGreaterThan(floorOf(furnished, tier))
      expect(seen.y).toBeLessThan(floorOf(furnished, tier) + ceilingOf(furnished, tier))
      expect(of(world, mark === 'sun' ? 'moon-mark' : 'sun-mark')).toEqual([])
    }
  })

  it('rides the thing it is on rather than the spot it was put on', () => {
    const { world } = marked('sun')
    const [still] = apparitionsOn(ship, world, undefined, 0).filter(
      (seen) => seen.kind === 'sun-mark',
    )
    const [later] = apparitionsOn(ship, world, undefined, 3).filter(
      (seen) => seen.kind === 'sun-mark',
    )
    expect(later.at).not.toEqual(still.at)
  })
})

describe('the two that happen rather than stand', () => {
  it('blows the gust from the visitor to the room the blast was aimed at', () => {
    const from: [number, number] = [12, 34]
    const seen = flashFor(
      { kind: 'stripped', spaceId: elsewhere.id, count: 0 },
      ship,
      EMPTY_WORLD,
      from,
    )!
    expect(seen.kind).toBe('gust')
    expect(seen.from).toEqual(from)
    expect(seen.at).toEqual(centroid(elsewhere))
    expect(seen.tierId).toBe(elsewhere.tierId)
  })

  it('rises as a sun on the visitor rather than on a room', () => {
    const seen = flashFor({ kind: 'sun-risen', metres: 12, solids: 3 }, ship, EMPTY_WORLD, [4, 5])!
    expect(seen.kind).toBe('sun')
    expect(seen.at).toEqual([4, 5])
    expect(seen.metres).toBe(12)
  })

  it('brings the fist up out of the floor under the solid that was struck', () => {
    const struck = ship.structures.find((structure) => structure.spaceId === furnished.id)!
    const tier = ship.tiers.find((candidate) => candidate.id === furnished.tierId)!
    const seen = flashFor(
      { kind: 'came-up-under', solidId: 'whoever', otherId: struck.id },
      ship,
      EMPTY_WORLD,
      [0, 0],
    )!
    expect(seen.kind).toBe('punch')
    expect(seen.at).toEqual(struck.at)
    expect(seen.y).toBe(floorOf(furnished, tier))
  })

  it('says nothing for a report that is neither', () => {
    expect(flashFor({ kind: 'no-target' }, ship, EMPTY_WORLD, [0, 0])).toBeNull()
    expect(flashFor(null, ship, EMPTY_WORLD, [0, 0])).toBeNull()
  })
})

describe('Air Blow', () => {
  it('blows off what the later waves hung on a room, not only the early ones', () => {
    let world = cast(EMPTY_WORLD, 'surveillance', elsewhere.id).world
    world = cast(world, 'guardian', elsewhere.id).world
    world = cast(world, 'tribunal', elsewhere.id).world
    const blown = cast(world, 'blast', elsewhere.id)
    expect(blown.report).toMatchObject({ kind: 'stripped', count: 3 })
    expect(apparitionsOn(ship, blown.world)).toEqual([])
  })
})
