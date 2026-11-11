/**
 * The finder's second attempt, when the name search found nothing.
 *
 * Holds the keywords the server made of the question and whether an answer is
 * still on its way. It waits for the typing to stop before asking, drops an
 * answer that arrives for a question no longer on screen, and treats every
 * failure — offline, no model, model busy — as "no keywords": the finder then
 * says what it always said.
 */
import { worthAsking } from './looseSearch'

/** Long enough that a sentence being typed is not asked word by word. */
const SETTLE_MS = 650

export class LooseSearch {
  keywords = $state<string[]>([])
  pending = $state(false)

  #timer: ReturnType<typeof setTimeout> | null = null
  #request: AbortController | null = null
  #asked = ''

  /** Ask about a query that matched nothing. Asking the same one twice is free. */
  ask(query: string, locale: string): void {
    const text = query.trim()
    const key = `${locale}:${text}`
    if (key === this.#asked) return
    this.clear()
    if (!worthAsking(text)) return
    this.#asked = key
    this.pending = true
    this.#timer = setTimeout(() => void this.#send(text, locale), SETTLE_MS)
  }

  /** Forget the question: the visitor typed something the name search found. */
  clear(): void {
    if (this.#timer) clearTimeout(this.#timer)
    this.#request?.abort()
    this.#timer = null
    this.#request = null
    this.#asked = ''
    this.keywords = []
    this.pending = false
  }

  async #send(query: string, locale: string): Promise<void> {
    const request = new AbortController()
    this.#request = request
    let keywords: string[] = []
    try {
      const response = await fetch('/tour/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, locale }),
        signal: request.signal,
      })
      const payload = (await response.json()) as { keywords?: unknown }
      if (Array.isArray(payload.keywords)) {
        keywords = payload.keywords.filter((word): word is string => typeof word === 'string')
      }
    } catch {
      // Aborted, offline or not JSON: all of them mean there is nothing to add.
    }
    if (this.#request !== request) return
    this.keywords = keywords
    this.pending = false
  }
}
