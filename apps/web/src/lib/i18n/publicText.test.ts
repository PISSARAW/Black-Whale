import { describe, expect, it } from 'vitest'
import { publicMetadata, publicText } from './publicText'
import { localizedVoyageLabel, matchTextPattern, textPatterns } from './publicTextPatterns'
import { localizedLoad, pageTranslations } from '$lib/server/localized-load'

describe('public text localization', () => {
  it('localizes room labels and keeps surrounding spacing', () => {
    expect(publicText(' Kitchen ', 'fr')).toBe(' Cuisine ')
    expect(publicText('Cuisine', 'en')).toBe('Kitchen')
  })

  it('localizes capitals and composite locations without changing links', () => {
    expect(publicText('KITCHEN', 'fr')).toBe('CUISINE')
    expect(publicText('Cuisine → Chambre', 'en')).toBe('Kitchen → Bedroom')
    expect(publicText('/characters/kurapika', 'fr')).toBe('/characters/kurapika')
    expect(publicText('Hunter × Hunter', 'fr')).toBe('Hunter × Hunter')
    expect(publicText('CC BY 4.0', 'fr')).toBe('CC BY 4.0')
    expect(publicText(' · enhancer · emitter', 'fr')).toBe(' · Renforcement · Émission')
    expect(publicText('LOVELY GHOSTWRITER · FICHE APOCRYPHE', 'fr')).toBe(
      'LOVELY GHOSTWRITER · FICHE APOCRYPHE',
    )
  })

  it('uses only the editorial translations supplied by the current page', () => {
    const content = { 'A passenger record.': 'Une fiche de passager.' }
    expect(publicText('A passenger record.', 'fr', content)).toBe('Une fiche de passager.')
    expect(publicText('A passenger record.', 'en')).toBe('A passenger record.')
  })

  it('keeps non-text values and unknown names intact', () => {
    const value = { id: 'prince-woble', status: 'ACTIVE' }
    expect(publicText(value, 'fr')).toBe(value)
    expect(publicText(42, 'fr')).toBe(42)
    expect(publicText('Some New Canonical Name', 'fr')).toBe('Some New Canonical Name')
    expect(publicText('constructor', 'fr')).toBe('constructor')
    expect(publicText('  {\n    "id": "body-1"\n  }\n', 'fr')).toBe(
      '  {\n    "id": "body-1"\n  }\n',
    )
  })

  it('preserves and reorders dynamic values in translated sentences', () => {
    const patterns = textPatterns({
      'ZXARG000ZX of ZXARG001ZX passengers': 'ZXARG000ZX passagers sur ZXARG001ZX',
    })
    expect(matchTextPattern('2 of 12 passengers', patterns)).toBe('2 passagers sur 12')
    expect(matchTextPattern('Not the same sentence', patterns)).toBeNull()
  })

  it('localizes voyage-clock labels in both languages', () => {
    expect(localizedVoyageLabel('≈ Day 12 · Friday · 14:20', 'fr')).toBe(
      '≈ Jour 12 · vendredi · 14:20',
    )
    expect(localizedVoyageLabel('Day 4 – Day 8', 'fr')).toBe('Jour 4 – Jour 8')
    expect(localizedVoyageLabel('Jour 3 · mardi · 01:27', 'en')).toBe('Day 3 · Tuesday · 01:27')
  })

  it('keeps the spoiler-filtered dictionary limited to the returned response', () => {
    const data = { id: 'character-a', description: 'Already revealed.', chapter: 360 }
    const dictionary = {
      'Already revealed.': 'Déjà révélé.',
      'A future identity reveal.': 'Une identité révélée plus tard.',
    }
    const before = structuredClone(data)
    expect(pageTranslations(data, 'fr', dictionary)).toEqual({
      'Already revealed.': 'Déjà révélé.',
    })
    expect(data).toEqual(before)
  })

  it('translates generated server sentences without changing their model values', () => {
    const data = { note: 'Corps de Kurapika' }
    expect(pageTranslations(data, 'en', { 'Corps de ZXARG000ZX': 'Body of ZXARG000ZX' })).toEqual({
      'Corps de Kurapika': 'Body of Kurapika',
    })
    expect(data.note).toBe('Corps de Kurapika')
  })

  it('translates structured metadata text while preserving schema identifiers', () => {
    const metadata = { '@type': 'Kitchen', '@id': 'Kitchen', name: 'Kitchen', url: '/ship' }
    expect(publicMetadata(metadata, 'fr')).toEqual({
      '@type': 'Kitchen',
      '@id': 'Kitchen',
      name: 'Cuisine',
      url: '/ship',
    })
    expect(metadata.name).toBe('Kitchen')
  })

  it('does not replace model fields or nested identities in loaders', async () => {
    const body = { id: 'body-1', state: 'ACTIVE' }
    const data = { body, cursor: { ordinal: 12, eventId: 'event-12' } }
    const load = localizedLoad(async (_event: { url: URL }) => data)
    const result = await load({ url: new URL('https://example.test/fr/characters/a') })
    expect(result.body).toBe(body)
    expect(result.cursor).toBe(data.cursor)
  })

  it('merges a nested layout dictionary into the page dictionary', async () => {
    const load = localizedLoad(async (_event: { url: URL }) => ({
      localizedContent: { inherited: 'hérité' },
      title: 'Elastic Love',
    }))
    const result = await load({ url: new URL('https://example.test/fr/ship') })
    expect(result.localizedContent).toMatchObject({
      inherited: 'hérité',
      'Elastic Love': 'Amour élastique',
    })
  })
})
