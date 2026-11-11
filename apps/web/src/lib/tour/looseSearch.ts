/**
 * Finding a place from a question rather than from its name.
 *
 * `search.ts` is strict on purpose: every term typed has to appear in what a
 * place offers, so "where do the guards sleep" finds nothing — no room carries
 * "where". This is what runs when that strict search comes back empty. A
 * language model on the server turns the question into a few words taken from
 * the ship's own vocabulary, and the places are ranked by how many of those
 * words they carry.
 *
 * The model never names a room and never writes a sentence the visitor reads.
 * It picks words out of a list this module built from the plan, anything it
 * says outside that list is dropped, and the rooms shown are found by the same
 * text match as before. A wrong answer is a list of real rooms that were not
 * the ones wanted, which is the worst it can do.
 *
 * Pure: shared by the server, which builds the vocabulary and grounds the
 * answer, and by the finder, which ranks the places.
 */
import type { Ship } from './blueprint'
import { findPlaces, searchTerms, type FoundPlace, type Naming } from './search'

/** Longest question sent to the server; a room is not found by a paragraph. */
export const LOOSE_QUERY_MAX = 120

/** How many words the model may hand back. */
export const LOOSE_KEYWORDS_MAX = 5

/** Shortest typed word kept as a keyword without the model having said it. */
const TYPED_WORD_MIN = 4

/**
 * Words that appear in room names and say nothing about which room: "Chambre
 * funéraire des princes" should not make every question containing "des" match.
 */
const HOLLOW = new Set([
  'avec',
  'sans',
  'vers',
  'sous',
  'même',
  'les',
  'des',
  'with',
  'the',
  'and',
  'for',
  'from',
  'same',
])

/** Accents folded and case dropped, so "refectoire" meets "Réfectoire". */
export function foldWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/** A text cut into its words: letters and digits, nothing else. */
export function wordsOf(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
}

/**
 * Every word a place on this ship is named with, in the language being read.
 *
 * Numbers are left out: "1004" is typed, never guessed, and `groundKeywords`
 * lets a typed number through on its own.
 */
export function vocabularyOf(ship: Ship, nameOf: Naming['nameOf']): string[] {
  const words = new Set<string>()
  for (const entity of [...ship.blueprint.spaces, ...ship.tiers]) {
    for (const word of wordsOf(nameOf(entity))) {
      if (word.length < 3 || /^\p{N}+$/u.test(word) || HOLLOW.has(word)) continue
      words.add(word)
    }
  }
  return [...words].sort()
}

/**
 * Whether a query that matched nothing is worth a model's time. One word that
 * matched nothing is a typo, not a question.
 */
export function worthAsking(query: string): boolean {
  const text = query.trim()
  return text.length <= LOOSE_QUERY_MAX && searchTerms(text).length >= 2
}

/** What the visitor typed, what the model proposed, and what the ship has. */
export interface Grounding {
  query: string
  proposed: readonly string[]
  vocabulary: readonly string[]
}

/**
 * The keywords the finder may search with: the model's words that really are
 * in the vocabulary, then whatever the visitor typed that already was — a room
 * number, or a name the model left out.
 */
export function groundKeywords({ query, proposed, vocabulary }: Grounding): string[] {
  const known = new Map(vocabulary.map((word) => [foldWord(word), word]))
  const kept = new Set<string>()
  for (const word of proposed.flatMap(wordsOf)) {
    const match = known.get(foldWord(word))
    if (match && kept.size < LOOSE_KEYWORDS_MAX) kept.add(match)
  }
  for (const word of wordsOf(query)) {
    if (/^\p{N}+$/u.test(word)) kept.add(word)
    // A short typed word is as likely grammar as a place: "est" is east in a
    // corridor's name and a verb in every French question.
    else if (word.length >= TYPED_WORD_MIN && known.has(foldWord(word))) {
      kept.add(known.get(foldWord(word))!)
    }
  }
  return [...kept]
}

/** The keywords to rank by, and how much of the answer the caller can show. */
export interface KeywordQuery {
  keywords: readonly string[]
  limit?: number
}

/**
 * Places carrying at least one keyword in their name or in where they are, the
 * ones carrying the most first.
 *
 * The source line is left out of the match, unlike the strict search: it is
 * prose about a manga page, and a keyword found in it is a coincidence.
 */
export function findByKeywords(
  ship: Ship,
  words: Naming,
  { keywords, limit = 40 }: KeywordQuery,
): { shown: FoundPlace[]; total: number } {
  const wanted = keywords.map(foldWord).filter(Boolean)
  if (!wanted.length) return { shown: [], total: 0 }

  const everywhere = findPlaces(ship, words, { text: '', limit: Number.POSITIVE_INFINITY }).shown
  const scored = everywhere
    .map((place, order) => {
      const text = foldWord(`${place.label} ${place.place}`)
      return { place, order, score: wanted.filter((word) => text.includes(word)).length }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)

  return { shown: scored.slice(0, limit).map((entry) => entry.place), total: scored.length }
}
