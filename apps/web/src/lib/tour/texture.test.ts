import { describe, expect, it } from 'vitest'
import { CURVED, FORGERIES, nextForgery, nextSign, takesAMask } from './texture'

describe('the limit stated with the technique', () => {
  // The catalogue gives it in the same breath as the ability, and the walk had
  // been carrying the first half of the sentence only.
  it('refuses the round solids, which offer no flat face', () => {
    for (const kind of CURVED) expect(takesAMask(kind)).toBe(false)
  })

  it('takes on the panels, tops and fronts the blueprint is otherwise made of', () => {
    expect(takesAMask('cabinet')).toBe(true)
    expect(takesAMask('painting')).toBe(true)
    expect(takesAMask('table')).toBe(true)
  })

  // The two axes are not the same, and confusing them would shrink the trick:
  // the crate in ch. 61 becomes an armchair, so what a mask may *depict* is not
  // limited by what it may be *painted on*.
  it('goes on limiting the bearer without limiting the face', () => {
    for (const kind of CURVED) expect(FORGERIES).toContain(kind)
  })

  it('cycles a face through every appearance the ship has to copy', () => {
    expect(nextForgery(FORGERIES.at(-1)!)).toBe(FORGERIES[0])
  })
})

describe('the plaque, which is a flat limited surface with writing on it', () => {
  const deck = ['room-a', 'room-b', 'room-c']

  it('puts a neighbour’s number on the door', () => {
    expect(nextSign(deck, 'room-a', null)).toBe('room-b')
  })

  it('never puts the room’s own number on its own door', () => {
    expect(nextSign(deck, 'room-b', null)).toBe('room-a')
    expect(nextSign(deck, 'room-b', 'room-a')).toBe('room-c')
  })

  // A way back to the truth that is not a second key: press through the deck
  // and the plate comes off.
  it('comes off at the end of the deck rather than starting again', () => {
    expect(nextSign(deck, 'room-a', 'room-c')).toBeNull()
  })

  it('has nothing to write in a room with no neighbours', () => {
    expect(nextSign(['room-a'], 'room-a', null)).toBeNull()
  })
})
