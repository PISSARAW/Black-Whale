import { describe, expect, it } from 'vitest'
import { GUM_TAUT_METRES, aimGum, gumLanding, gumStretch, gumTension } from './gum'

const strand = { solidId: 'cabinet', rest: 2 }

describe('what a strand is holding', () => {
  it('reads nothing until the visitor has moved off what they stuck', () => {
    expect(gumStretch(strand, 2)).toBe(0)
    expect(gumTension(strand, 1)).toBe(0)
  })

  /** The one property the catalogue states outright: force rises with stretch. */
  it('rises with the stretch and never falls', () => {
    const readings = [2, 4, 6, 8, 10].map((metres) => gumTension(strand, metres))
    expect(readings).toEqual([...readings].sort((a, b) => a - b))
    expect(new Set(readings).size).toBe(readings.length)
  })

  it('reads full at the ten metres the archive puts on this aura', () => {
    expect(gumTension(strand, strand.rest + GUM_TAUT_METRES)).toBe(1)
    expect(gumTension(strand, strand.rest + GUM_TAUT_METRES * 3)).toBe(1)
  })
})

describe('where a thing comes to rest when the gum brings it in', () => {
  it('stops it short of the visitor rather than inside them', () => {
    const landing = gumLanding({ at: [0, 0], anchorAt: [10, 0], clearance: 1.5 })
    expect(landing).toEqual([1.5, 0])
  })

  it('never sends it further out than it already was', () => {
    const landing = gumLanding({ at: [0, 0], anchorAt: [1, 0], clearance: 4 })
    expect(landing).toEqual([1, 0])
  })
})

describe('casting the gum at the thing down the reticle', () => {
  const aim = (over: Partial<Parameters<typeof aimGum>[0]> = {}) =>
    aimGum({
      strand: null,
      solidId: 'cabinet',
      at: [0, 0],
      anchorAt: [4, 0],
      clearance: 1,
      together: true,
      ...over,
    })

  it('sticks, and remembers how long the filament was when it did', () => {
    expect(aim()).toEqual({ act: 'stick', rest: 4 })
  })

  it('contracts when the same thing is cast at again', () => {
    const act = aim({ strand: { solidId: 'cabinet', rest: 4 } })
    expect(act).toMatchObject({ act: 'reel', landing: [1, 0], metres: 3 })
  })

  // A cabinet dragged through a bulkhead would be a claim about the ship.
  it('goes taut instead of crossing a bulkhead', () => {
    const act = aim({ strand: { solidId: 'cabinet', rest: 4 }, together: false })
    expect(act).toEqual({ act: 'taut', metres: 4 })
  })

  it('joins the two when a second thing is aimed at', () => {
    expect(aim({ strand: { solidId: 'bunk', rest: 3 } })).toEqual({ act: 'pair' })
  })
})
