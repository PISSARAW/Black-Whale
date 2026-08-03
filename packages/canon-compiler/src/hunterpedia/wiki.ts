/**
 * Talking to Hunterpedia.
 *
 * Kept apart from everything that reads what comes back: the parsing is the
 * part that is worth testing, and it cannot be while it sits behind a `fetch`.
 */

const API = 'https://hunterxhunter.fandom.com/api.php'
const USER_AGENT = 'Black-Whale-catalog/1.0 (dataset enrichment)'

interface WikiPage {
  title: string
  missing?: string
  revisions?: Array<{ slots?: { main?: Record<string, string> } }>
}

interface WikiResponse {
  query?: {
    pages?: Record<string, WikiPage>
    redirects?: Array<{ from: string; to: string }>
    normalized?: Array<{ from: string; to: string }>
    categorymembers?: Array<{ title: string }>
  }
}

/** Retries with a widening pause; the wiki rate-limits rather than refuses. */
async function fetchJson(url: string, attempts = 3): Promise<WikiResponse | null> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      if (response.ok) return (await response.json()) as WikiResponse
    } catch {
      // A network failure is worth one more try, not a stack trace.
    }
    await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)))
  }
  return null
}

/** Every page in a category, by title. */
export async function fetchCategoryMembers(category: string): Promise<string[]> {
  const url = new URL(API)
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'categorymembers',
    cmtitle: category,
    cmlimit: '500',
    cmnamespace: '0',
    origin: '*',
  }).toString()

  const payload = await fetchJson(url.toString())
  if (!payload) throw new Error(`Hunterpedia n'a pas répondu pour ${category}`)
  return payload.query?.categorymembers?.map((entry) => entry.title) ?? []
}

function pagesFrom(payload: WikiResponse): Map<string, string> {
  const byTitle = new Map<string, string>()
  for (const page of Object.values(payload.query?.pages ?? {})) {
    if (page.missing !== undefined) continue
    byTitle.set(page.title, page.revisions?.[0]?.slots?.main?.['*'] ?? '')
  }
  return byTitle
}

/**
 * Wikitext for a list of titles, in batches, following redirects.
 *
 * The result is keyed by the title *asked for*, not the one the wiki resolved
 * to — the caller looks a passenger up by the name the catalogue holds.
 */
export async function fetchWikitext(titles: readonly string[], batchSize = 20) {
  const pages = new Map<string, string>()

  for (let index = 0; index < titles.length; index += batchSize) {
    const batch = titles.slice(index, index + batchSize)
    const payload = await fetchJson(
      `${API}?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&redirects=1` +
        `&titles=${encodeURIComponent(batch.join('|'))}`,
    )
    if (!payload?.query) continue

    const byTitle = pagesFrom(payload)
    const redirects = new Map((payload.query.redirects ?? []).map((row) => [row.from, row.to]))
    const normalized = new Map((payload.query.normalized ?? []).map((row) => [row.from, row.to]))

    for (const title of batch) {
      const settled =
        redirects.get(normalized.get(title) ?? title) ?? normalized.get(title) ?? title
      const wikitext = byTitle.get(settled)
      if (wikitext !== undefined) pages.set(title, wikitext)
    }
  }
  return pages
}
