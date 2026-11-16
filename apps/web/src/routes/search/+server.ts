import { json, type RequestHandler } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { DEFAULT_LOCALE, isLocale } from '$lib/i18n/config'
import { loadSearchCatalog } from '$lib/server/siteSearchCatalog'
import { createSearchInterpreter } from '$lib/server/siteSearchIntent'
import { createSiteSearch } from '$lib/server/siteSearch'
import { askOllama, ollamaConfig } from '$lib/server/ollama'
import { readSpoilerLimit } from '$lib/server/spoiler'
import { rateLimit } from '$lib/server/rateLimit'

const config = ollamaConfig(env)
const interpret = createSearchInterpreter(config ? (question) => askOllama(config, question) : null)
const search = createSiteSearch({ catalogue: loadSearchCatalog, interpret })
const headers = { 'cache-control': 'private, no-store', vary: 'Cookie' }

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const body = await request.json().catch(() => null)
  if (typeof body?.query !== 'string' || !body.query.trim() || body.query.length > 160) {
    return json({ error: 'rejected' }, { status: 400, headers })
  }
  const verdict = rateLimit(`site:search:${getClientAddress()}`, 20, 60_000)
  if (!verdict.allowed) {
    return json(
      { error: 'busy' },
      { status: 429, headers: { ...headers, 'retry-after': String(verdict.retryAfterSeconds) } },
    )
  }
  return json(
    await search({
      query: body.query.trim(),
      locale: isLocale(body.locale) ? body.locale : DEFAULT_LOCALE,
      cap: readSpoilerLimit(cookies),
      semantic: body.semantic !== false,
    }),
    { headers },
  )
}
