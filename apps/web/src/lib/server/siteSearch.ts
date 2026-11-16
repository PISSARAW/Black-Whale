import type { Locale } from '$lib/i18n/config'
import { foldSearch, searchWords } from '$lib/search/text'
import type { SearchIntent, SearchResponse } from '$lib/search/types'
import { normalizeSearchIntent } from './siteSearchFacets'
import {
  rankSearchDocuments,
  visibleSearchDocuments,
  type SearchDocument,
} from './siteSearchRanking'

export interface SearchContext {
  query: string
  locale: Locale
  cap: number | undefined
  semantic: boolean
}

export function createSiteSearch(ports: {
  catalogue: () => Promise<{ documents: SearchDocument[]; latestChapter: number }>
  interpret: (query: string, locale: Locale) => Promise<SearchIntent | null>
}) {
  return async (context: SearchContext): Promise<SearchResponse> => {
    const { documents, latestChapter } = await ports.catalogue()
    const cap = context.cap !== undefined && context.cap < latestChapter ? context.cap : undefined
    const visible = visibleSearchDocuments(documents, cap)
    const exact = visible.some((doc) =>
      [doc.titleEn, doc.titleFr].some((title) => foldSearch(title) === foldSearch(context.query)),
    )
    let intent: SearchIntent | null = null
    if (context.semantic && !exact) {
      intent = await ports.interpret(context.query, context.locale)
    }
    const fallback: SearchIntent = {
      kind: 'all',
      category: 'none',
      terms: searchWords(context.query).slice(0, 4),
    }
    return {
      ...rankSearchDocuments(visible, {
        query: context.query,
        locale: context.locale,
        intent: normalizeSearchIntent(context.query, intent ?? fallback),
      }),
      mode: intent ? 'ai' : context.semantic && !exact ? 'fallback' : 'literal',
      spoilerLimit: context.cap ?? null,
    }
  }
}
