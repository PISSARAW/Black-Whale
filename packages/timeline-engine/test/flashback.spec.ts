import { describe, expect, it } from 'vitest'
import { compareEventOrder, isRevealed } from '../src/index.js'

const present = {
  id: 'present',
  chapterId: 'ch-400',
  chapter: { number: 400 },
  sequence: 1,
  ordinal: 20,
}
const flashback = {
  id: 'flashback',
  chapterId: 'ch-410',
  chapter: { number: 410 },
  sequence: 1,
  ordinal: 10,
}

describe('flashback chronology', () => {
  it('orders an event by occurrence rather than its revealing chapter', () => {
    expect(compareEventOrder(flashback, present)).toBeLessThan(0)
  })

  it('does not reveal a past event before its source chapter', () => {
    expect(isRevealed(flashback, 409)).toBe(false)
    expect(isRevealed(flashback, 410)).toBe(true)
  })
})
