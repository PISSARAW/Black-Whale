import { afterEach, expect, it, vi } from 'vitest'
import { SiteSearchState } from './SiteSearchState.svelte'
import type { SearchResponse } from './types'

afterEach(() => vi.unstubAllGlobals())

const result = (cap: number | null): SearchResponse => ({
  results: [
    {
      id: 'character:late',
      kind: 'character',
      title: 'Late name',
      href: '/characters/late',
      chapter: 415,
      excerpt: '',
    },
  ],
  total: 1,
  mode: 'ai',
  spoilerLimit: cap,
})

it('never displays old results under a changed query, language or chapter', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(result(null)))),
  )
  const search = new SiteSearchState()
  await search.run('a question', 'en', null)
  expect(search.responseFor('a question', 'en', null)?.results).toHaveLength(1)
  expect(search.responseFor('a question', 'en', 350)).toBeNull()
  expect(search.responseFor('a question', 'fr', null)).toBeNull()
  expect(search.responseFor('another question', 'en', null)).toBeNull()
})

it('discards late responses after a new search or closing the palette', async () => {
  let release = (_response: Response) => {}
  const first = new Promise<Response>((resolve) => {
    release = resolve
  })
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockReturnValueOnce(first)
      .mockResolvedValue(new Response(JSON.stringify(result(350)))),
  )
  const search = new SiteSearchState()
  const old = search.run('old question', 'en', null)
  await search.run('new question', 'fr', 350)
  release(new Response(JSON.stringify(result(null))))
  await old
  expect(search.query).toBe('new question')
  expect(search.responseFor('new question', 'fr', 350)?.spoilerLimit).toBe(350)
  search.clear()
  expect(search.response).toBeNull()
  expect(search.pending).toBe(false)
})
