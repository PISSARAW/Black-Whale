import { describe, expect, it } from 'vitest'
import { theShip } from './blueprint'
import {
  findByKeywords,
  groundKeywords,
  LOOSE_KEYWORDS_MAX,
  vocabularyOf,
  worthAsking,
} from './looseSearch'
import { findPlaces, type Naming } from './search'

const ship = theShip()
const french: Naming = {
  nameOf: (entity) => entity.nameFr,
  sourceOf: (entity) => entity.sourceFr,
  insideOf: (room) => `dans ${room}`,
}
const vocabulary = vocabularyOf(ship, french.nameOf)

describe('vocabularyOf', () => {
  it('holds the words rooms are named with, and none of the hollow ones', () => {
    expect(vocabulary).toContain('cuisine')
    expect(vocabulary).toContain('halkenburg')
    expect(vocabulary).not.toContain('des')
    expect(vocabulary).not.toContain('avec')
  })

  it('leaves numbers out: a room number is typed, never guessed', () => {
    expect(vocabulary.some((word) => /^\d+$/.test(word))).toBe(false)
  })
})

describe('worthAsking', () => {
  it('asks about a question, not about one mistyped word', () => {
    expect(worthAsking('où dorment les gardes')).toBe(true)
    expect(worthAsking('cuisinne')).toBe(false)
    expect(worthAsking('mot '.repeat(60))).toBe(false)
  })
})

describe('groundKeywords', () => {
  it('drops what the ship does not have and restores the accents it does', () => {
    const keywords = groundKeywords({
      query: 'où peut-on se restaurer',
      proposed: ['refectoire', 'piscine', 'Cuisine'],
      vocabulary,
    })
    expect(keywords).toEqual(['réfectoire', 'cuisine'])
  })

  it('keeps a typed room number and a typed name the model left out', () => {
    const keywords = groundKeywords({
      query: 'la chambre de Halkenburg au 1009',
      proposed: [],
      vocabulary,
    })
    expect(keywords).toContain('halkenburg')
    expect(keywords).toContain('1009')
  })

  it('does not take the grammar of a question for a place', () => {
    expect(vocabulary).toContain('est')
    expect(groundKeywords({ query: 'quelle heure est-il', proposed: [], vocabulary })).toEqual([])
    expect(groundKeywords({ query: 'quelle heure est-il', proposed: ['est'], vocabulary })).toEqual(
      ['est'],
    )
  })

  it('never keeps more of the model than it was allowed to say', () => {
    const keywords = groundKeywords({ query: '', proposed: vocabulary.slice(0, 20), vocabulary })
    expect(keywords).toHaveLength(LOOSE_KEYWORDS_MAX)
  })
})

describe('findByKeywords', () => {
  it('finds nothing without keywords', () => {
    expect(findByKeywords(ship, french, { keywords: [] }).total).toBe(0)
  })

  it('answers a question the name search cannot', () => {
    const question = 'où dort le prince Halkenburg'
    expect(findPlaces(ship, french, { text: question }).total).toBe(0)

    const found = findByKeywords(ship, french, { keywords: ['halkenburg', 'chambre'] })
    expect(found.total).toBeGreaterThan(0)
    expect(found.shown[0].label.toLowerCase()).toContain('halkenburg')
  })

  it('puts the places carrying the most keywords first and says how many matched', () => {
    const found = findByKeywords(ship, french, { keywords: ['cuisine', 'benjamin'], limit: 3 })
    expect(found.shown.length).toBeLessThanOrEqual(3)
    expect(found.total).toBeGreaterThanOrEqual(found.shown.length)
    const first = `${found.shown[0].label} ${found.shown[0].place}`.toLowerCase()
    expect(first).toContain('cuisine')
    expect(first).toContain('benjamin')
  })
})
