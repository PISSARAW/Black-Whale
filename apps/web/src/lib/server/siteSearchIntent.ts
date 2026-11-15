import type { Locale } from '$lib/i18n/config'
import { SEARCH_CATEGORIES, SEARCH_KINDS, type SearchIntent } from '$lib/search/types'
import type { OllamaQuestion } from './ollama'
import type { Asker } from './tourSearch'

export function searchQuestion(query: string, locale: Locale): OllamaQuestion {
  return {
    system: [
      'Extract website search filters. Return only JSON with a search object containing kind, category and terms.',
      `The request is in ${locale === 'fr' ? 'French' : 'English'}. Do not answer it. Do not add facts or names.`,
      'kind: character for people, ability for powers, event for chronology, place for rooms, faction for groups, page for tools and games, all otherwise.',
      'category: enhancer, transmuter, emitter, conjurer, manipulator, specialist, or none if no Nen category is requested.',
      'French categories: renforcement=enhancer, transformation=transmuter, emission=emitter, materialisation=conjurer, manipulation=manipulator, specialisation=specialist.',
      'terms: zero to four short English search words or proper names from the request. Preserve proper names. Remove filler words.',
      'Do not repeat the kind or Nen category in terms. For a category-only search leave terms empty.',
      'For a question about rubber and chewing gum use kind ability, category none, terms ["rubber","gum"].',
      'For places to eat use kind place and terms ["kitchen","dining"]. Never invent an answer, URL, chapter or character.',
    ].join('\n'),
    user: query,
    schema: {
      type: 'object',
      properties: {
        search: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: SEARCH_KINDS },
            category: { type: 'string', enum: SEARCH_CATEGORIES },
            terms: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 60 } },
          },
          required: ['kind', 'category', 'terms'],
          additionalProperties: false,
        },
      },
      required: ['search'],
      additionalProperties: false,
    },
    maxTokens: 64,
  }
}

export function parseSearchIntent(raw: string | null): SearchIntent | null {
  try {
    const intent = JSON.parse(raw ?? '').search
    if (
      !intent ||
      !SEARCH_KINDS.includes(intent.kind) ||
      !SEARCH_CATEGORIES.includes(intent.category)
    )
      return null
    if (!Array.isArray(intent.terms) || intent.terms.length > 4) return null
    if (intent.terms.some((term: unknown) => typeof term !== 'string' || term.length > 60))
      return null
    return { kind: intent.kind, category: intent.category, terms: intent.terms }
  } catch {
    return null
  }
}

/** Only intent is cached: it contains no catalogue facts, results or chapter state. */
export function createSearchInterpreter(ask: Asker | null) {
  const cache = new Map<string, { intent: SearchIntent; until: number }>()
  let busy = false
  return async (query: string, locale: Locale): Promise<SearchIntent | null> => {
    if (!ask) return null
    const key = `${locale}:${query.toLowerCase()}`
    const known = cache.get(key)
    if (known && known.until > Date.now()) return known.intent
    if (busy) return null
    busy = true
    try {
      const intent = parseSearchIntent(await ask(searchQuestion(query, locale)))
      if (intent) {
        if (cache.size >= 200) cache.delete(cache.keys().next().value!)
        cache.set(key, { intent, until: Date.now() + 600_000 })
      }
      return intent
    } finally {
      busy = false
    }
  }
}
