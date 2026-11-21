import type { SecretWindowState } from './secretWindow'
import type { SecretWindowListening } from './secretWindowListening'
import type { FightSide } from './types'

/**
 * The owner's private, consultable journal of what the owls actually relayed.
 * It only appends facts already received: bodily actions and spoken words, never
 * thoughts, aura, technique names or anything before the bird existed. Reading it
 * is presentation only; no engine state depends on whether it is open.
 */
export const WINDOW_JOURNAL_LIMIT = 64

/** A new bodily action joins the journal; an unchanged one is not repeated. */
export function journalObservation(feed: SecretWindowState): SecretWindowState {
  const history = feed.history ?? []
  if (history.at(-1)?.action === feed.observation.action) return { ...feed, history }
  return { ...feed, history: [...history, feed.observation].slice(-WINDOW_JOURNAL_LIMIT) }
}

export function journalWords(
  feed: SecretWindowState,
  words: { frame: number; speaker: FightSide; text: string },
): SecretWindowState {
  const recordings = [...(feed.recordings ?? []), words].slice(-WINDOW_JOURNAL_LIMIT)
  return { ...feed, words, recordings }
}

/** The shoulder owl keeps its own journal: a separate application, not the contact bird. */
export function journalOverheard(
  listening: SecretWindowListening,
  heard: { frame: number; text: string },
): SecretWindowListening {
  const log = [...(listening.log ?? []), heard].slice(-WINDOW_JOURNAL_LIMIT)
  return { ...listening, heard, log }
}
