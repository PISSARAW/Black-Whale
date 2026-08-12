/**
 * The claim the whole of `/tour` rests on, held to.
 *
 * "There is no ambient light aboard a ship and none in the walk" is the one
 * sentence in `docs/carte/05-la-visite.md` that every other decision about the
 * picture defers to, and until now nothing enforced it. `light.test.ts` checks
 * the class grid, `mesh.test.ts` checks the bake — but what a visitor actually
 * sees is neither of those on its own. It is
 *
 *     albedo × baked shade × the hour's wash
 *
 * and the third term lives in a different file from the first two, so no test
 * owned the product. The consequence is on the record: `regime.ts` documents a
 * commit called « Améliore l'ambiance visuelle » that changed
 * `AmbientLight(0xffffff, 2.2)` to `AmbientLight(0xf6e5c1, 2.2)` — a change of
 * hue that was a third of a stop of *level*, because a warm white has a
 * luminance below one. It went unnoticed long enough that later tables took the
 * dimmed ship for the reference and were built on top of it.
 *
 * That is the regression class this file exists for, and it is a class rather
 * than an incident: every one of these numbers is one a future commit could
 * move while meaning something else, and none of them announces itself when it
 * moves. `docs/tour-2.0.md` §7.2 wanted reference captures here and gave up on
 * them for a good reason — without a GPU on the runner, a capture tests the CI
 * machine's driver. Nothing about these invariants needs a GPU: the wash is
 * arithmetic and the bake is an array.
 */
import { describe, expect, it } from 'vitest'
import { theShip } from './blueprint'
import { luminance } from './illuminant'
import { buildTierMesh } from './mesh'
import { REFERENCE_REGIME, regimeOf } from './regime'
import { NIGHT_LIGHT_INTENSITY } from './TourAtmosphereView'
import { NIGHT_LIGHT_RANGE } from './comfort'

/** The level a wash actually lights the ship at: its colour is not free of it. */
const levelOf = (ambient: { colour: readonly number[]; intensity: number }) =>
  luminance(ambient.colour as [number, number, number]) * ambient.intensity

/** Every hour of the ship's day, finely enough to catch a peak between states. */
const HOURS = Array.from({ length: 24 * 12 }, (_, i) => i / 12)

describe('the ambient is an exposure and not a light', () => {
  it('keeps every hour of the day at unit luminance, so a hue cannot dim the ship', () => {
    // The exact shape of the « Améliore l'ambiance visuelle » bug. `wash`
    // normalises the hour's colour to luminance one and carries the level in
    // the intensity alone, which makes the two separable — and this is the test
    // that says they must stay separable. Retint the ship all you like; you
    // cannot darken it by accident from the colour any more.
    for (const hour of HOURS) {
      expect(luminance(regimeOf(hour).ambient.colour), `hour ${hour}`).toBeCloseTo(1, 6)
    }
  })

  it('anchors the reference hour at the level the walk was tuned against', () => {
    // 2.2 is what the four lights this replaced averaged over a surface, and
    // `RoomLight` in `mesh.ts` was built so its mean shade comes out near unity
    // *against that figure*. Moving it is not a mood, it is re-exposing every
    // room on the ship — so it is written down here as well as there.
    expect(levelOf(REFERENCE_REGIME.ambient)).toBeCloseTo(2.2, 6)
  })

  it('never lights the ship brighter than the anchor, at any hour', () => {
    // The reference is noon. An hour that came out over it would be a hole in
    // the exposure: the bake's mean shade of one would land above one, and the
    // rooms that are meant to be at the top of the curve would clip there
    // instead of resolving.
    for (const hour of HOURS) {
      expect(levelOf(regimeOf(hour).ambient), `hour ${hour}`).toBeLessThanOrEqual(2.2 + 1e-9)
    }
  })

  it('moves the level between hours rather than holding it flat', () => {
    // The other direction of the same guard: an hour dial that changed nothing
    // would pass every assertion above.
    const levels = HOURS.map((hour) => levelOf(regimeOf(hour).ambient))
    expect(Math.max(...levels)).toBeGreaterThan(Math.min(...levels) * 1.3)
  })
})

describe('the visitor is not a lamp', () => {
  it('keeps the night-light an order below the headlamp it replaced', () => {
    // The headlamp was eighteen units screwed to the visitor's head, and it is
    // the single thing that made five decks look like one deck: every room was
    // lit by the same source, which was you, so no room was lit by itself.
    // Anything that creeps back towards that figure has undone the wave, and
    // will do it while looking like a readability fix.
    expect(NIGHT_LIGHT_INTENSITY).toBeLessThan(18 / 10)
  })

  it('lets the visitor put it out entirely, and stops it well short of a torch', () => {
    // Both ends matter and for opposite reasons. Zero has to be reachable
    // because the whole picture is the bake and someone has to be able to see
    // it with nothing of their own added; the ceiling has to be short because a
    // reach long enough to cross a corridor is a headlamp whatever it is called.
    const [floor, ceiling] = NIGHT_LIGHT_RANGE
    expect(floor).toBe(0)
    expect(ceiling).toBeLessThanOrEqual(12)
  })
})

describe('an unlit floor is unlit in the picture and not only in the bake', () => {
  const ship = theShip()
  const anchor = levelOf(REFERENCE_REGIME.ambient)

  /** The luminance of every floor vertex of a deck, as the screen would get it. */
  const floorOf = (tierId: string) => {
    const plan = ship.plans.get(tierId)!
    const mesh = buildTierMesh(plan)
    const values: number[] = []
    for (let i = 0; i < mesh.positions.length; i += 3) {
      if (Math.abs(mesh.positions[i + 1] - plan.tier.elevation) > 0.001) continue
      values.push(luminance([mesh.colors[i], mesh.colors[i + 1], mesh.colors[i + 2]]) * anchor)
    }
    return values.sort((a, b) => a - b)
  }

  const king = floorOf('tier-1')
  const hold = floorOf('tier-5')
  const median = (values: number[]) => values[values.length >> 1]

  it('has floor to read on both ends of the ship', () => {
    expect(king.length).toBeGreaterThan(10_000)
    expect(hold.length).toBeGreaterThan(10_000)
  })

  it('keeps the darkest floor on the ship near black', () => {
    // The claim of `docs/tour-immersion.md` §4.4, held to at the only place it
    // can be checked: a surface with no fitting in reach of it gets the bare
    // fill and the wash, and nothing else. The margin is deliberately loose —
    // what is being caught is a stop, not a percent. Anything that reads a
    // tenth of the ship's brightest floor is not a corridor that has gone grey.
    expect(king[0]).toBeLessThan(0.1)
    expect(hold[0]).toBeLessThan(0.1)
  })

  it('keeps real range on the deck, so black is a place and not the whole ship', () => {
    // The opposite failure, and the one the plan explicitly refused to risk:
    // « une surface que la reconstruction a inventée reste une surface, et doit
    // pouvoir être parcourue ». A deck whose brightest floor is not several
    // times its darkest has lost the pools of light, not gained darkness.
    expect(king[king.length - 1]).toBeGreaterThan(king[0] * 3)
    expect(hold[hold.length - 1]).toBeGreaterThan(hold[0] * 2)
  })

  it('carries the class system all the way to the screen', () => {
    // The argument of the whole lighting wave, and the one thing here that no
    // single-file test can state: the King's deck and the hold are lit by
    // different grids, and the difference has to survive the bake *and* the
    // wash. If it ever does not, the five decks are one deck again.
    expect(median(hold)).toBeLessThan(median(king) * 0.95)
  })
})
