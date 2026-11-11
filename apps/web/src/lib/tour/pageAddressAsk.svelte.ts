/**
 * A question typed on the address card, and the topic it was routed to.
 *
 * The phrases in `cast/askRouting.ts` are tried here first, so most questions
 * never leave the browser. Only what they miss goes to `/tour/ask`, and every
 * failure there — offline, no model, model busy, a reply that is not a topic —
 * is read as `none`: the card then points back at its six questions.
 *
 * Holds a topic, never a line. The line is the catalogue's, already in the
 * interview the card is showing.
 */
import { matchTopic, readTopic, worthRouting, type AskedTopic } from './cast/askRouting'

export class AddressAsk {
  /** What the visitor typed last, as they typed it. */
  asked = $state('')
  /** The topic it was routed to, or null while nothing has been asked. */
  topic = $state<AskedTopic | null>(null)
  pending = $state(false)

  #request: AbortController | null = null

  /** Route a question. An empty line clears the card back to its six questions. */
  ask(query: string, locale: string): void {
    this.clear()
    const text = query.trim()
    if (!text) return
    this.asked = text
    if (!worthRouting(text)) {
      this.topic = 'none'
      return
    }
    const phrased = matchTopic(text)
    if (phrased) {
      this.topic = phrased
      return
    }
    this.pending = true
    void this.#send(text, locale)
  }

  /** Forget the question: a new body, or the card put away. */
  clear(): void {
    this.#request?.abort()
    this.#request = null
    this.asked = ''
    this.topic = null
    this.pending = false
  }

  async #send(query: string, locale: string): Promise<void> {
    const request = new AbortController()
    this.#request = request
    let topic: AskedTopic = 'none'
    try {
      const response = await fetch('/tour/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, locale }),
        signal: request.signal,
      })
      topic = readTopic(((await response.json()) as { topic?: unknown }).topic)
    } catch {
      // Aborted, offline or not JSON: all of them mean the archive has no line for it.
    }
    if (this.#request !== request) return
    this.#request = null
    this.topic = topic
    this.pending = false
  }
}
