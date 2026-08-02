import { describe, expect, it } from 'vitest'
import { caseById, listCases } from './catalog'

describe('investigation case registry', () => {
  it('loads a localized case by stable slug', () => {
    expect(caseById('eleven-seconds', 'fr')?.content.title).toBe('Onze secondes')
    expect(caseById('eleven-seconds', 'en')?.content.title).toBe('Eleven seconds')
  })

  it('returns null for an unknown case', () => {
    expect(caseById('missing', 'fr')).toBeNull()
  })

  it('lists lightweight metadata in publication order', () => {
    expect(listCases('fr').map((item) => item.slug)).toEqual(['eleven-seconds'])
  })
})
