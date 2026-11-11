import { json } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { DEFAULT_LOCALE, isLocale } from '$lib/i18n/config'
import { createRouter } from '$lib/server/castQuestion'
import { askOllama, ollamaConfig } from '$lib/server/ollama'
import { rateLimit } from '$lib/server/rateLimit'
import type { RequestHandler } from './$types'

/**
 * The address card asks here when a typed question matched none of its phrases.
 *
 * The answer is one topic out of the six the archive answers, or `none` —
 * never a line, never prose. The card then quotes the catalogue line it
 * already holds for that topic, cut at the reader's chapter. Every failure is
 * `none` with a reason beside it, because the card does the same thing in each
 * case: it points back at the six questions it can answer.
 */

const ASK_LIMIT = 20
const ASK_WINDOW_MS = 60_000

const config = ollamaConfig(env)
const route = createRouter(config ? (question) => askOllama(config, question) : null)

const NO_STORE = { 'cache-control': 'no-store' }

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const body = (await request.json().catch(() => null)) as {
    query?: unknown
    locale?: unknown
  } | null
  if (typeof body?.query !== 'string') {
    return json({ topic: 'none', reason: 'rejected' }, { status: 400, headers: NO_STORE })
  }
  const locale =
    typeof body.locale === 'string' && isLocale(body.locale) ? body.locale : DEFAULT_LOCALE

  const verdict = rateLimit(`tour:ask:${getClientAddress()}`, ASK_LIMIT, ASK_WINDOW_MS)
  if (!verdict.allowed) {
    return json(
      { topic: 'none', reason: 'busy' },
      { status: 429, headers: { ...NO_STORE, 'retry-after': String(verdict.retryAfterSeconds) } },
    )
  }

  const result = await route(body.query, locale)
  if (result.status === 'ok') return json({ topic: result.topic }, { headers: NO_STORE })
  return json({ topic: 'none', reason: result.status }, { headers: NO_STORE })
}
