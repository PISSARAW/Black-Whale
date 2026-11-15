import { describe, expect, it } from 'vitest'
import { abilitiesRevealedByChapter } from './chapterGate'

describe('Strategy chapter gate', () => {
  it('does not expose abilities before their canonical reveal', () => {
    expect(abilitiesRevealedByChapter(['benjamin-aura', 'cats-name', 'culdcept'], 363)).toEqual([
      'benjamin-aura',
    ])
    expect(abilitiesRevealedByChapter(['cats-name'], 400)).toEqual(['cats-name'])
  })

  it('keeps unknown abilities closed rather than guessing a reveal chapter', () => {
    expect(abilitiesRevealedByChapter(['invented-hatsu'], 999)).toEqual([])
  })
})
