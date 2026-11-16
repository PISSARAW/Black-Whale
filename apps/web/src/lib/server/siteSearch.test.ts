import { describe, expect, it, vi } from 'vitest'
import { createSiteSearch } from './siteSearch'
import type { SearchIntent } from '$lib/search/types'
import type { Asker } from './tourSearch'
import { loadSearchCatalog } from './siteSearchCatalog'
import { createSearchInterpreter, parseSearchIntent, searchQuestion } from './siteSearchIntent'
import { visibleSearchDocuments, type SearchDocument } from './siteSearchRanking'

const emptyIntent = { kind: 'all', category: 'none', terms: [] } as const
const context = { query: 'Komiya', locale: 'fr', cap: undefined, semantic: true } as const

describe('site-wide spoiler-safe search', () => {
  it('indexes the supported content types and every public mode', async () => {
    const catalogue = await loadSearchCatalog()
    expect(new Set(catalogue.documents.map((doc) => doc.kind))).toEqual(
      new Set(['character', 'ability', 'event', 'place', 'faction', 'page']),
    )
    for (const href of [
      '/ship',
      '/tour',
      '/timeline',
      '/strategy',
      '/hunt',
      '/fighting',
      '/simulations',
      '/investigation',
      '/tour/morena',
    ]) {
      expect(catalogue.documents.some((doc) => doc.href === href)).toBe(true)
    }
  })

  it('withholds undated narrative game pages under a cap', async () => {
    const catalogue = await loadSearchCatalog()
    expect(
      visibleSearchDocuments(catalogue.documents, 399).some((doc) => doc.href === '/tour/morena'),
    ).toBe(false)
    expect(
      visibleSearchDocuments(catalogue.documents, undefined).some(
        (doc) => doc.href === '/tour/morena',
      ),
    ).toBe(true)
  })

  it('isolates full and capped readers in both request orders, including zero', async () => {
    const search = createSiteSearch({
      catalogue: loadSearchCatalog,
      interpret: vi.fn(async () => null),
    })
    for (const caps of [
      [undefined, 399, 0, 415],
      [0, 415, 399, undefined],
    ]) {
      for (const cap of caps) {
        const result = await search({ ...context, cap })
        const person = result.results.find((doc) => doc.id === 'character:komiya')
        if (cap === undefined || cap >= 415) expect(person?.title).toBe('Komiya')
        else expect(JSON.stringify(result)).not.toContain('Komiya')
        expect(result.spoilerLimit).toBe(cap ?? null)
      }
    }
  })

  it('never sends catalogue facts or spoiler context to the model', async () => {
    const ask = vi
      .fn<Asker>()
      .mockResolvedValue('{"search":{"kind":"character","category":"none","terms":["Komiya"]}}')
    const search = createSiteSearch({
      catalogue: loadSearchCatalog,
      interpret: createSearchInterpreter(ask),
    })
    const response = await search({ ...context, query: 'trouve cette personne', cap: 399 })
    expect(response.mode).toBe('ai')
    expect(response.results).toEqual([])
    expect(ask.mock.calls[0][0].system).not.toContain('Komiya')
    expect(ask.mock.calls[0][0].user).toBe('trouve cette personne')
    expect(ask.mock.calls[0][0]).not.toHaveProperty('spoilerLimit')
  })

  it('withholds unknown dates, undated aliases, biographies and Nen filters under a cap', () => {
    const base: SearchDocument = {
      id: 'character:early',
      kind: 'character',
      title: 'Early',
      titleEn: 'Early',
      titleFr: 'Précoce',
      href: '/characters/early',
      chapter: 1,
      text: 'SECRET_BIOGRAPHY SECRET_ALIAS',
      excerpt: 'Secret',
      category: 'manipulator',
      dated: false,
    }
    const docs = visibleSearchDocuments([base, { ...base, id: 'unknown', chapter: null }], 10)
    expect(docs).toHaveLength(1)
    expect(docs[0]).toMatchObject({ text: '', excerpt: '', category: 'none' })
    expect(docs[0].title).toBe('Early')
  })

  it('does not use hidden fields to match or rank otherwise visible characters', async () => {
    const search = createSiteSearch({
      catalogue: loadSearchCatalog,
      interpret: vi.fn(async () => null),
    })
    const full = await search({ ...context, query: 'Grim Reaper', semantic: false })
    expect(full.results.some((doc) => doc.id === 'character:hisoka')).toBe(true)
    const capped = await search({ ...context, query: 'Grim Reaper', cap: 350, semantic: false })
    expect(capped.results.some((doc) => doc.id === 'character:hisoka')).toBe(false)
    const byName = await search({ ...context, query: 'Hisoka Morrow', cap: 350, semantic: false })
    expect(byName.results.find((doc) => doc.id === 'character:hisoka')?.excerpt).toBe('')
  })

  it('withholds names introduced by undated identity corrections', async () => {
    const search = createSiteSearch({
      catalogue: loadSearchCatalog,
      interpret: vi.fn(async () => null),
    })
    const capped = await search({ ...context, query: "Oito's Nephew", cap: 399, semantic: false })
    expect(JSON.stringify(capped)).not.toContain('oito-nephew-fake-woble')
    const full = await search({ ...context, query: "Oito's Nephew", semantic: false })
    expect(full.results.some((doc) => doc.id === 'character:oito-nephew-fake-woble')).toBe(true)
  })

  it('falls back to classic search when inference fails', async () => {
    const search = createSiteSearch({
      catalogue: loadSearchCatalog,
      interpret: vi.fn(async () => null),
    })
    const result = await search({ ...context, query: 'find Kurapika' })
    expect(result.mode).toBe('fallback')
    expect(result.results.some((doc) => doc.id === 'character:kurapika')).toBe(true)
    expect(
      result.results.every((doc) => doc.href.startsWith('/') && !doc.href.startsWith('//')),
    ).toBe(true)
  })

  it('localizes the original excerpt before truncating or mixing search aliases', async () => {
    const search = createSiteSearch({
      catalogue: loadSearchCatalog,
      interpret: vi.fn(async () => null),
    })
    const result = await search({ ...context, query: 'Bungee Gum', semantic: false })
    expect(result.results.find((doc) => doc.id === 'ability:bungee-gum')?.excerpt).toMatch(
      /caoutchouc/i,
    )
  })

  it('applies semantic type/category filters only after visibility filtering', async () => {
    const interpret = vi.fn(async (): Promise<SearchIntent> => ({
      ...emptyIntent,
      kind: 'ability',
      category: 'manipulator',
      terms: [],
    }))
    const search = createSiteSearch({ catalogue: loadSearchCatalog, interpret })
    const full = await search({ ...context, query: 'les pouvoirs de manipulation' })
    expect(full.mode).toBe('ai')
    expect(full.results.length).toBeGreaterThan(0)
    expect(full.results.every((doc) => doc.kind === 'ability')).toBe(true)
    const capped = await search({ ...context, query: 'les pouvoirs de manipulation', cap: 350 })
    expect(capped.results).toEqual([])
  })
})

describe('intent parsing and bounded caching', () => {
  it('allows only search filters, never generated answers or URLs', () => {
    for (const raw of [
      'bad JSON',
      '{"search":{"kind":"admin","category":"none","terms":[]}}',
      '{"search":{"kind":"all","category":"none","terms":[42]}}',
    ])
      expect(parseSearchIntent(raw)).toBeNull()
    const parsed = parseSearchIntent(
      '{"search":{"kind":"page","category":"none","terms":["hunt"],"href":"https://evil.test"}}',
    )
    expect(parsed).toEqual({ kind: 'page', category: 'none', terms: ['hunt'] })
    expect(searchQuestion('query', 'fr').schema).toHaveProperty('properties.search')
  })

  it('shares only intent across readers and does not remember failures', async () => {
    const ask = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValue('{"search":{"kind":"ability","category":"manipulator","terms":[]}}')
    const interpret = createSearchInterpreter(ask)
    expect(await interpret('powers using manipulation', 'en')).toBeNull()
    expect((await interpret('powers using manipulation', 'en'))?.kind).toBe('ability')
    await interpret('powers using manipulation', 'en')
    expect(ask).toHaveBeenCalledTimes(2)
  })
})
