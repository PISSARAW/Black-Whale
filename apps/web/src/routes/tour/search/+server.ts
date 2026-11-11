import { json } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { DEFAULT_LOCALE, isLocale } from '$lib/i18n/config'
import { askOllama, ollamaConfig } from '$lib/server/ollama'
import { rateLimit } from '$lib/server/rateLimit'
import { createInterpreter } from '$lib/server/tourSearch'
import type { RequestHandler } from './$types'

/**
 * The walk's finder asks here when what was typed matched no room by name.
 *
 * The answer is a handful of keywords out of the ship's own vocabulary, or an
 * empty list — never a room, never prose. Every way this can fail (no model
 * configured, model busy, too many questions, a malformed body) is the same
 * empty list with a reason beside it, because the finder does the same thing
 * in each case: it goes on saying nothing matched.
 */

const ASK_LIMIT = 12
const ASK_WINDOW_MS = 60_000

const config = ollamaConfig(env)
const interpret = createInterpreter(config ? (question) => askOllama(config, question) : null)

const NO_STORE = { 'cache-control': 'no-store' }

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const body = (await request.json().catch(() => null)) as {
    query?: unknown
    locale?: unknown
  } | null
  if (typeof body?.query !== 'string') {
    return json({ keywords: [], reason: 'rejected' }, { status: 400, headers: NO_STORE })
  }
  const locale =
    typeof body.locale === 'string' && isLocale(body.locale) ? body.locale : DEFAULT_LOCALE

  if (config) {
    const verdict = rateLimit(`tour:search:${getClientAddress()}`, ASK_LIMIT, ASK_WINDOW_MS)
    if (!verdict.allowed) {
      return json(
        { keywords: [], reason: 'busy' },
        { status: 429, headers: { ...NO_STORE, 'retry-after': String(verdict.retryAfterSeconds) } },
      )
    }
  }

  const result = await interpret(body.query, locale)
  if (result.status === 'ok') return json({ keywords: result.keywords }, { headers: NO_STORE })
  return json({ keywords: [], reason: result.status }, { headers: NO_STORE })
}
