import { describe, expect, it } from 'vitest'
import { activeFactionTypesAt } from './affiliations.js'

const at = (chapter: number, sequence: number) => ({ chapter: { number: chapter }, sequence })

const membership = (
  characterId: string,
  type: string,
  fromEvent: ReturnType<typeof at>,
  untilEvent?: ReturnType<typeof at>,
) => ({ characterId, faction: { type }, fromEvent, untilEvent })

describe('activeFactionTypesAt', () => {
  it('includes a membership already started and not yet ended', () => {
    const active = activeFactionTypesAt(
      [membership('c1', 'ROYAL_GUARD', at(1, 1), at(9, 1))],
      at(4, 1),
    )

    expect(active.get('c1')).toEqual(['ROYAL_GUARD'])
  })

  it('excludes a membership that has not started', () => {
    const active = activeFactionTypesAt([membership('c1', 'ROYAL_GUARD', at(7, 1))], at(4, 1))

    expect(active.has('c1')).toBe(false)
  })

  /** The window is half-open: ending *at* the viewed event means it is over. */
  it('excludes a membership ending exactly at the viewed event', () => {
    const active = activeFactionTypesAt(
      [membership('c1', 'ROYAL_GUARD', at(1, 1), at(4, 1))],
      at(4, 1),
    )

    expect(active.has('c1')).toBe(false)
  })

  it('includes a membership starting exactly at the viewed event', () => {
    const active = activeFactionTypesAt([membership('c1', 'MAFIA', at(4, 1))], at(4, 1))

    expect(active.get('c1')).toEqual(['MAFIA'])
  })

  it('keeps an open-ended membership active', () => {
    const active = activeFactionTypesAt([membership('c1', 'MAFIA', at(1, 1))], at(99, 1))

    expect(active.get('c1')).toEqual(['MAFIA'])
  })

  it('collects every active faction of the same character', () => {
    const active = activeFactionTypesAt(
      [membership('c1', 'MAFIA', at(1, 1)), membership('c1', 'ROYAL_GUARD', at(2, 1))],
      at(4, 1),
    )

    expect(active.get('c1')).toEqual(['MAFIA', 'ROYAL_GUARD'])
  })

  it('returns nothing when no event is selected', () => {
    expect(activeFactionTypesAt([membership('c1', 'MAFIA', at(1, 1))], null).size).toBe(0)
  })
})
