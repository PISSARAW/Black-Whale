/**
 * Turning a visitor's question into keywords the finder can search with.
 *
 * This is the server half of `lib/tour/looseSearch.ts`. It owns the three
 * things that keep a small model on a small machine from hurting the site:
 *
 * - **One question at a time.** A CPU model answers one request at once; a
 *   second visitor is told it is busy rather than queued behind the first, and
 *   the finder simply keeps saying nothing matched.
 * - **A memory.** The same question in the same language gets the same answer,
 *   so it is asked once per process.
 * - **A fixed prompt.** The vocabulary sits in the system message, identical
 *   for every question in a language, so the model's own prefix cache covers
 *   it and only the visitor's line is evaluated.
 *
 * The reply is constrained to words of that vocabulary by the schema, and
 * grounded again here because a constraint the model server enforces is not a
 * guarantee this code can read.
 */
import type { Locale } from '$lib/i18n/config'
import { theShip } from '$lib/tour/blueprint'
import {
  groundKeywords,
  LOOSE_KEYWORDS_MAX,
  vocabularyOf,
  worthAsking,
} from '$lib/tour/looseSearch'
import type { OllamaQuestion } from './ollama'

export type Interpretation =
  | { status: 'ok'; keywords: string[] }
  | { status: 'busy' }
  | { status: 'off' }
  | { status: 'rejected' }

/** How the model is reached; `null` from it means it did not answer. */
export type Asker = (question: OllamaQuestion) => Promise<string | null>

const CACHE_LIMIT = 500

const LANGUAGE: Record<Locale, string> = { en: 'English', fr: 'French' }

export function interpreterQuestion(
  query: string,
  locale: Locale,
  vocabulary: readonly string[],
): OllamaQuestion {
  return {
    system: [
      'You help a visitor find a room aboard a ship.',
      `The visitor writes in ${LANGUAGE[locale]}. Reply with JSON: {"keywords": [...]}.`,
      `Give one to ${LOOSE_KEYWORDS_MAX} keywords naming the kind of room, or the person whose room it is.`,
      'Every keyword must be copied exactly from the vocabulary below.',
      'Prefer the few words most likely to appear in the name of the room wanted.',
      'If nothing in the vocabulary fits, reply {"keywords": []}.',
      '',
      `Vocabulary: ${vocabulary.join(', ')}`,
    ].join('\n'),
    user: query,
    schema: {
      type: 'object',
      properties: {
        keywords: {
          type: 'array',
          maxItems: LOOSE_KEYWORDS_MAX,
          items: { type: 'string', enum: vocabulary },
        },
      },
      required: ['keywords'],
    },
  }
}

/** The strings under `keywords` in a reply, or nothing if it is not that shape. */
export function parseKeywords(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    const keywords = (parsed as { keywords?: unknown } | null)?.keywords
    if (!Array.isArray(keywords)) return []
    return keywords.filter((word): word is string => typeof word === 'string')
  } catch {
    return []
  }
}

/**
 * An interpreter bound to one way of asking. `ask` is `null` when no model is
 * configured, and every question is then answered `off`.
 */
export function createInterpreter(ask: Asker | null) {
  const cache = new Map<string, string[]>()
  const vocabularies = new Map<Locale, string[]>()
  let busy = false

  const vocabularyFor = (locale: Locale): string[] => {
    let words = vocabularies.get(locale)
    if (!words) {
      words = vocabularyOf(theShip(), (entity) => (locale === 'fr' ? entity.nameFr : entity.name))
      vocabularies.set(locale, words)
    }
    return words
  }

  const remember = (key: string, keywords: string[]) => {
    if (cache.size >= CACHE_LIMIT) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) cache.delete(oldest)
    }
    cache.set(key, keywords)
  }

  return async function interpret(query: string, locale: Locale): Promise<Interpretation> {
    if (!ask) return { status: 'off' }
    const text = query.trim().replace(/\s+/g, ' ')
    if (!worthAsking(text)) return { status: 'rejected' }

    const key = `${locale}:${text.toLowerCase()}`
    const known = cache.get(key)
    if (known) return { status: 'ok', keywords: known }
    if (busy) return { status: 'busy' }

    busy = true
    try {
      const vocabulary = vocabularyFor(locale)
      const raw = await ask(interpreterQuestion(text, locale, vocabulary))
      // A model that did not answer is not remembered: the next visitor to
      // ask the same thing deserves a real attempt.
      if (raw === null) return { status: 'busy' }
      const keywords = groundKeywords({ query: text, proposed: parseKeywords(raw), vocabulary })
      remember(key, keywords)
      return { status: 'ok', keywords }
    } finally {
      busy = false
    }
  }
}
