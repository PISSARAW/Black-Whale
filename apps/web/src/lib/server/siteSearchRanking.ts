import { foldSearch, searchWords } from '$lib/search/text'
import type { Locale } from '$lib/i18n/config'
import type { SearchCategory, SearchIntent, SearchResult } from '$lib/search/types'
import { publicText } from '$lib/i18n/publicText'
import contentTexts from './public-content.json'

export interface SearchDocument extends SearchResult {
  onlyUncapped?: boolean
  titleEn: string
  titleFr: string
  text: string
  category: SearchCategory
  /** Only chapter-bound prose may participate in ranking under a cap. */
  dated: boolean
}

export function visibleSearchDocuments(
  documents: SearchDocument[],
  cap: number | undefined,
): SearchDocument[] {
  if (cap === undefined) return documents
  return documents
    .filter((doc) => !doc.onlyUncapped)
    .filter((doc) => (doc.chapter === null ? doc.kind === 'page' : doc.chapter <= cap))
    .map((doc) => (doc.dated ? doc : { ...doc, text: '', excerpt: '', category: 'none' }))
}

function relevance(doc: SearchDocument, query: string, terms: string[]): number {
  const title = foldSearch(`${doc.titleEn} ${doc.titleFr}`)
  const text = foldSearch(doc.text)
  const exact = foldSearch(query)
  if (exact && (foldSearch(doc.titleEn) === exact || foldSearch(doc.titleFr) === exact)) return 1000
  if (!terms.length) return 1
  const hits = terms.map((term) => (title.includes(term) ? 8 : Number(text.includes(term))))
  const matched = hits.filter(Boolean).length
  if (!matched) return 0
  return hits.reduce((sum, hit) => sum + hit, 0) + (10 * matched) / terms.length
}

export function rankSearchDocuments(
  documents: SearchDocument[],
  options: {
    query: string
    intent: SearchIntent
    locale: Locale
  },
) {
  const terms = options.intent.terms.flatMap(searchWords)
  const hasFilter = options.intent.kind !== 'all' || options.intent.category !== 'none'
  if (!terms.length && !hasFilter) return { results: [], total: 0 }
  const ranked = documents
    .filter((doc) => options.intent.kind === 'all' || doc.kind === options.intent.kind)
    .filter((doc) => options.intent.category === 'none' || doc.category === options.intent.category)
    .map((doc) => ({ doc, score: relevance(doc, options.query, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
  return {
    results: ranked.slice(0, 20).map(({ doc }): SearchResult => ({
      id: doc.id,
      kind: doc.kind,
      title: options.locale === 'fr' ? doc.titleFr : doc.titleEn,
      href: doc.href,
      chapter: doc.chapter,
      excerpt: publicText(doc.excerpt, options.locale, contentTexts[options.locale]).slice(0, 180),
    })),
    total: ranked.length,
  }
}
