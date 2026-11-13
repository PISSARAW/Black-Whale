import { describe, expect, it } from 'vitest'
import { articleSchema, collectionSchema, hunterWorkSchema, publisherSchema } from './schema'

describe('public discovery schemas', () => {
  it('links pages to stable publisher and work authority nodes', () => {
    const article = articleSchema({
      name: 'Bungee Gum',
      path: '/abilities/bungee-gum',
      description: 'Ability record',
      language: 'en',
      modifiedAt: '2026-11-13',
    })
    expect(article).toMatchObject({
      dateModified: '2026-11-13',
      publisher: { '@id': 'https://exploreblackwhale.com/#publisher' },
      about: { '@id': 'https://www.wikidata.org/wiki/Q696071' },
    })
    expect(publisherSchema()).toMatchObject({ '@type': 'Organization', name: 'Black Whale' })
    expect(hunterWorkSchema().sameAs).toContain('https://www.wikidata.org/wiki/Q696071')
  })

  it('expresses collection children as an ItemList', () => {
    const schema = collectionSchema({
      name: 'Abilities',
      path: '/abilities',
      description: 'Catalogue',
      modifiedAt: '2026-11-13',
      items: [{ name: 'Bungee Gum', path: '/abilities/bungee-gum' }],
    })
    expect(schema.mainEntity).toMatchObject({ '@type': 'ItemList', numberOfItems: 1 })
    expect(schema.dateModified).toBe('2026-11-13')
  })
})
