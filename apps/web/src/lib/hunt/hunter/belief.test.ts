import { describe, it, expect } from 'vitest'
import {
  BELIEF_FADES_AFTER,
  beliefIsStale,
  clearRoom,
  forget,
  initialBelief,
  updateBelief,
  type Percept,
} from './belief'

const sharp: Percept = { kind: 'en', at: [3, 4], spaceId: 'salon', sharp: true }
const vague: Percept = { kind: 'sound', at: [9, 1], spaceId: 'cuisine', sharp: false }

describe('what the hunter believes', () => {
  it('believes nothing to begin with', () => {
    const belief = initialBelief()
    expect(belief.at).toBeNull()
    expect(beliefIsStale(belief)).toBe(true)
  })

  it('takes a percept whole, and knows which sense it came from', () => {
    const belief = updateBelief(initialBelief(), 0, sharp)
    expect(belief.at).toEqual([3, 4])
    expect(belief.from).toBe('en')
    expect(belief.sharp).toBe(true)
  })

  it('marks a sound as the vaguer reading it is', () => {
    expect(updateBelief(initialBelief(), 0, vague).sharp).toBe(false)
  })

  it('lets a newer percept overwrite an older one', () => {
    const first = updateBelief(initialBelief(), 0, sharp)
    const second = updateBelief(first, 1, vague)
    expect(second.at).toEqual([9, 1])
    expect(second.age).toBe(0)
  })
})

describe('going cold', () => {
  it('ages while nothing new comes in', () => {
    let belief = updateBelief(initialBelief(), 0, sharp)
    belief = updateBelief(belief, 5, null)
    expect(belief.age).toBe(5)
    expect(beliefIsStale(belief)).toBe(false)
  })

  it('goes stale after half a minute', () => {
    let belief = updateBelief(initialBelief(), 0, sharp)
    belief = updateBelief(belief, BELIEF_FADES_AFTER, null)
    expect(beliefIsStale(belief)).toBe(true)
  })

  it('does not age a belief that was never held', () => {
    expect(updateBelief(initialBelief(), 100, null).age).toBe(0)
  })
})

describe('rooms already searched', () => {
  it('drops the belief and remembers the room was empty', () => {
    const belief = clearRoom(updateBelief(initialBelief(), 0, sharp), 'salon')
    expect(belief.cleared).toEqual(['salon'])
    expect(belief.at).toBeNull()
  })

  it('does not list the same room twice, or a room that is nowhere', () => {
    const once = clearRoom(initialBelief(), 'salon')
    expect(clearRoom(once, 'salon').cleared).toEqual(['salon'])
    expect(clearRoom(once, null)).toBe(once)
  })

  it('keeps the cleared rooms when the trail itself is forgotten', () => {
    const belief = forget(clearRoom(initialBelief(), 'salon'))
    expect(belief.cleared).toEqual(['salon'])
    expect(belief.at).toBeNull()
  })
})

describe('invariant I5, as a property of the type', () => {
  it('has no way in for a position that is not a percept', () => {
    // The only argument that carries a position is `Percept`, which is minted
    // by the loop out of something that was actually perceived. If this ever
    // gains a `playerPosition`, the invariant has been lost.
    expect(updateBelief.length).toBe(3)
    expect(Object.keys(sharp).sort()).toEqual(['at', 'kind', 'sharp', 'spaceId'])
  })
})
