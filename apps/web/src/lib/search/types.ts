export const SEARCH_KINDS = [
  'all',
  'character',
  'ability',
  'event',
  'place',
  'faction',
  'page',
] as const
export const SEARCH_CATEGORIES = [
  'none',
  'enhancer',
  'transmuter',
  'emitter',
  'conjurer',
  'manipulator',
  'specialist',
] as const
export type SearchKind = (typeof SEARCH_KINDS)[number]
export type SearchCategory = (typeof SEARCH_CATEGORIES)[number]

export interface SearchIntent {
  kind: SearchKind
  category: SearchCategory
  terms: string[]
}

export interface SearchResult {
  id: string
  kind: Exclude<SearchKind, 'all'>
  title: string
  href: string
  chapter: number | null
  excerpt: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  mode: 'literal' | 'ai' | 'fallback'
  spoilerLimit: number | null
}
