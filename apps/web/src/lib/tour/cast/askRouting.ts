/**
 * A question typed to a body, routed to one of the six the archive answers.
 *
 * ADR-004 §2.4 says the body only ever quotes the catalogue. A free question
 * does not change that: what the visitor types picks *which* line is quoted,
 * and nothing else. No sentence is composed here or anywhere downstream.
 *
 * Two routes, tried in this order:
 *
 * - **Phrases.** A short list per topic, matched on folded text. Most
 *   questions a visitor types ("tu bosses pour qui ?", "what's your Nen?") are
 *   settled here, without a model and without a network.
 * - **The model**, on the server, only when no phrase matched. Its reply is
 *   one word out of `ASKED_TOPICS`, and `parseTopic` re-checks that, because a
 *   word outside the list is the only way a model could smuggle anything in.
 *
 * Pure: shared by the server, which routes what the phrases missed, and by the
 * card, which tries the phrases before asking.
 */
import { ADDRESS_TOPICS, type AddressTopic } from './address'

/** Longest question sent to the server: a body is asked a line, not a letter. */
export const ASK_QUERY_MAX = 160

/** What a question can be routed to: one of the six, or nothing the archive holds. */
export const ASKED_TOPICS = [...ADDRESS_TOPICS, 'none'] as const

export type AskedTopic = (typeof ASKED_TOPICS)[number]

/**
 * Phrases per topic, folded (no accents, lower case, single spaces).
 *
 * Checked in this order, so "pour qui" is read as an allegiance before "qui"
 * is read as an identity. A phrase matches at the start of a word and may end
 * mid-word: "technique" covers "techniques", "arrive" covers "arrivé".
 */
const PHRASES: readonly (readonly [AddressTopic, readonly string[]])[] = [
  [
    'allegiance',
    [
      'pour qui',
      'pour le compte',
      'faction',
      'allegeance',
      'allegiance',
      'loyal',
      'ton camp',
      'votre camp',
      'quel camp',
      'ton maitre',
      'votre maitre',
      'ton patron',
      'votre patron',
      'sers qui',
      'servez qui',
      'work for',
      'who do you serve',
      'whose side',
      'which side',
      'your master',
      'your boss',
    ],
  ],
  [
    'since',
    [
      'depuis quand',
      'depuis combien',
      'quand es tu arrive',
      'quand etes vous arrive',
      'since when',
      'how long',
      'when did you arrive',
      'when did you get',
    ],
  ],
  [
    'route',
    [
      'par ou',
      'ou es tu alle',
      'ou etes vous alle',
      'ou etais',
      'ou etiez',
      'ton parcours',
      'votre parcours',
      'ton trajet',
      'votre trajet',
      'where have you been',
      'where did you go',
      'where were you',
      'your route',
      'your path',
    ],
  ],
  [
    'techniques',
    ['technique', 'pouvoir', 'capacite', 'hatsu', 'ability', 'abilities', 'power', 'skill'],
  ],
  ['nen', ['nen', 'aura', 'categorie', 'category']],
  [
    'who',
    [
      'qui es',
      'qui etes',
      'ton nom',
      'votre nom',
      'tu t appelles',
      'vous vous appelez',
      'presente toi',
      'presentez vous',
      'que fais tu',
      'que faites vous',
      'ton role',
      'votre role',
      'ton metier',
      'votre metier',
      'who are you',
      'your name',
      'introduce yourself',
      'what do you do',
      'your job',
      'your role',
    ],
  ],
]

/** Accents folded, case dropped, everything but letters and digits made a space. */
export function foldQuestion(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** Whether a typed line is a question at all: some letters, and not a page of them. */
export function worthRouting(query: string): boolean {
  const text = query.trim()
  return text.length <= ASK_QUERY_MAX && /\p{L}{2}/u.test(text)
}

/** The topic a phrase settles, or null when none of them is in the question. */
export function matchTopic(query: string): AddressTopic | null {
  const padded = ` ${foldQuestion(query)}`
  for (const [topic, phrases] of PHRASES) {
    if (phrases.some((phrase) => padded.includes(` ${phrase}`))) return topic
  }
  return null
}

const isAskedTopic = (value: unknown): value is AskedTopic =>
  typeof value === 'string' && (ASKED_TOPICS as readonly string[]).includes(value)

/** The topic under `topic` in a model's reply, and `none` for anything else. */
export function parseTopic(raw: string | null): AskedTopic {
  if (!raw) return 'none'
  try {
    const topic = (JSON.parse(raw) as { topic?: unknown } | null)?.topic
    return isAskedTopic(topic) ? topic : 'none'
  } catch {
    return 'none'
  }
}

/** The same check for a server's answer, which the card reads as untrusted too. */
export function readTopic(value: unknown): AskedTopic {
  return isAskedTopic(value) ? value : 'none'
}
