import type { Locale } from '$lib/i18n/config'
import type { SearchResponse } from './types'

export class SiteSearchState {
  pending = $state(false)
  error = $state(false)
  cursor = $state(0)
  response = $state<SearchResponse | null>(null)
  query = $state('')
  scope = $state('')
  #request: AbortController | null = null

  clear() {
    this.#request?.abort()
    this.#request = null
    this.pending = false
    this.error = false
    this.response = null
    this.query = ''
    this.scope = ''
    this.cursor = 0
  }

  responseFor(query: string, locale: Locale, cap: number | null): SearchResponse | null {
    if (this.query !== query.trim() || this.scope !== `${locale}:${cap}`) return null
    return this.response?.spoilerLimit === cap ? this.response : null
  }

  move(direction: number, count: number) {
    if (count) this.cursor = (this.cursor + direction + count) % count
  }

  async run(query: string, locale: Locale, cap: number | null) {
    this.clear()
    this.query = query.trim()
    if (!this.query) return
    this.scope = `${locale}:${cap}`
    const request = new AbortController()
    this.#request = request
    this.pending = true
    try {
      const response = await fetch('/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: this.query, locale }),
        signal: request.signal,
      })
      if (!response.ok) throw new Error('Search unavailable')
      const result = (await response.json()) as SearchResponse
      if (this.#request !== request) return
      this.response = result
    } catch {
      if (this.#request === request) this.error = true
    } finally {
      if (this.#request === request) this.pending = false
    }
  }
}
