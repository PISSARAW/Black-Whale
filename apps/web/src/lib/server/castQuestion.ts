/**
 * Routing a question typed to a body, when no phrase settled it.
 *
 * The server half of `lib/tour/cast/askRouting.ts`, and the same three guards
 * as `tourSearch.ts`: one question at a time, a memory, a fixed prompt.
 *
 * What makes this safe against the spoiler cap is what the model is *not*
 * given and what it cannot return. It sees the typed line and the list of
 * topics — no name, no dossier, no chapter — and its reply is one word of that
 * list, re-checked by `parseTopic`. A model that knows the whole manga still
 * has nowhere to put it: the card quotes the catalogue line for the topic, cut
 * at the reader's chapter in the browser, exactly as the buttons always did.
 */
import type { Locale } from '$lib/i18n/config'
import {
  ASKED_TOPICS,
  matchTopic,
  parseTopic,
  worthRouting,
  type AskedTopic,
} from '$lib/tour/cast/askRouting'
import type { OllamaQuestion } from './ollama'
import type { Asker } from './tourSearch'

export type Routing =
  | { status: 'ok'; topic: AskedTopic }
  | { status: 'busy' }
  | { status: 'off' }
  | { status: 'rejected' }

const CACHE_LIMIT = 500

const LANGUAGE: Record<Locale, string> = { en: 'English', fr: 'French' }

export function routerQuestion(query: string, locale: Locale): OllamaQuestion {
  return {
    system: [
      'A visitor is asking a question to a person aboard a ship.',
      `The visitor writes in ${LANGUAGE[locale]}. Do not answer the question.`,
      'Only say which of these topics it asks about. Reply with JSON: {"topic": "..."}.',
      '- who: their name, identity, role or job aboard',
      '- allegiance: who they serve, their faction, their side',
      '- since: when they arrived, how long they have been here',
      '- route: where they have been, the path they took aboard',
      '- nen: their aura, their Nen category',
      '- techniques: their specific abilities, powers or techniques',
      '- none: anything else (feelings, opinions, the future, other people, plot)',
    ].join('\n'),
    user: query,
    schema: {
      type: 'object',
      properties: { topic: { type: 'string', enum: [...ASKED_TOPICS] } },
      required: ['topic'],
    },
    maxTokens: 16,
  }
}

/**
 * A router bound to one way of asking. `ask` is `null` when no model is
 * configured: the phrases still answer, and everything else is `off`.
 */
export function createRouter(ask: Asker | null) {
  const cache = new Map<string, AskedTopic>()
  let busy = false

  const remember = (key: string, topic: AskedTopic) => {
    if (cache.size >= CACHE_LIMIT) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) cache.delete(oldest)
    }
    cache.set(key, topic)
  }

  return async function route(query: string, locale: Locale): Promise<Routing> {
    const text = query.trim().replace(/\s+/g, ' ')
    if (!worthRouting(text)) return { status: 'rejected' }
    const phrased = matchTopic(text)
    if (phrased) return { status: 'ok', topic: phrased }
    if (!ask) return { status: 'off' }

    const key = `${locale}:${text.toLowerCase()}`
    const known = cache.get(key)
    if (known) return { status: 'ok', topic: known }
    if (busy) return { status: 'busy' }

    busy = true
    try {
      const raw = await ask(routerQuestion(text, locale))
      if (raw === null) return { status: 'busy' }
      const topic = parseTopic(raw)
      remember(key, topic)
      return { status: 'ok', topic }
    } finally {
      busy = false
    }
  }
}
