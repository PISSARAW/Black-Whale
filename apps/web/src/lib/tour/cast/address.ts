/**
 * Addressing a body: six questions, and the catalogue's own answers.
 *
 * The walk had a gesture for asking a pillar why it is there and none for
 * asking the man standing next to it anything at all. This is that gesture, and
 * ADR-004 §2.4 fixes what it may return: not a written reply — there are no
 * dialogues in `data/`, and inventing 224 of them would be the largest
 * invention the site has ever made — but the line of the catalogue that answers
 * the question, with the chapter it is dated at.
 *
 * So nothing here composes prose. Every `said` below is a value out of
 * `CastDossier`, wrapped by a translated frame sentence, and every one of them
 * can be checked against `data/` by a reader who cares to. Where the archive is
 * silent, the answer *is* the silence, said plainly: a body whose entry
 * declares no Nen answers that the catalogue declares none, which is a
 * different statement from "I have no aura" and the only one we are entitled to.
 *
 * Pure: no store, no clock, no canvas. The words come in as a parameter so the
 * module never touches i18n, exactly as `exhibit.ts` and `provenance.ts` do.
 */
import type { CastDossier } from './dossier'

/** The six things a body can be asked, in the order they are asked. */
export const ADDRESS_TOPICS = ['who', 'allegiance', 'since', 'route', 'nen', 'techniques'] as const

export type AddressTopic = (typeof ADDRESS_TOPICS)[number]

/** What Body and Soul takes, which is asked of the body rather than of the person. */
export const UNSEALED_TOPICS = ['allegiance-sealed', 'identity-sealed'] as const

export type UnsealedTopic = (typeof UNSEALED_TOPICS)[number]

/** One exchange: what was asked, what the archive answers, and from when. */
export interface Answer {
  topic: AddressTopic | UnsealedTopic
  question: string
  /** The catalogue's line, or null when there is none to give. */
  said: string | null
  /** Why there is no line: the archive's silence, or the reader's chapter. */
  refusal: string | null
  /** The chapter the line is dated at, as the archive writes it. */
  chapter: string | null
}

/** A whole exchange with one body. */
export interface Interview {
  characterId: string
  name: string
  answers: Answer[]
  /**
   * How many steps of the route the cap held back.
   *
   * Carried out of the interview rather than turned into an answer: it is a
   * fact about the reader's own chapter, and the panel says it once at the
   * bottom instead of interrupting the exchange.
   */
  withheld: number
}

/** How the exchange is worded, in the language being read. */
export interface AddressWords {
  /** The six questions, and the two Body and Soul takes. */
  question: (topic: AddressTopic | UnsealedTopic) => string
  /** "Aboard as: Nen teacher/protector" */
  role: (role: string) => string
  /** "Answers to the Prince Woble faction" */
  faction: (faction: string) => string
  /** "Here since ch. 358" */
  since: (chapter: string) => string
  /** One step of the route: "ch. 365 — Room 1003" */
  step: (chapter: string, place: string) => string
  /** The steps, joined into the one line the panel shows. */
  route: (steps: string[]) => string
  /** "Declared a Conjurer by the catalogue" */
  category: (label: string) => string
  /** The techniques, by name, and which of them the walk performs. */
  techniques: (names: string[]) => string
  /** What the archive does not hold. One sentence, reused everywhere. */
  silent: string
  /** What the reader's own chapter is keeping from them. */
  capped: string
}

/** Everything an interview needs that is not in the dossier. */
export interface AddressOptions {
  dossier: CastDossier
  /** The name the body travels under at the cap — never re-derived here. */
  name: string
  /** The chapter its current position starts at, as the cast payload writes it. */
  since: string | null
  /** A catalogue location slug, named in the visitor's language, or null. */
  placeOf: (location: string) => string | null
  words: AddressWords
}

/** An answer the archive cannot give, which is still an answer. */
function silence(topic: Answer['topic'], options: AddressOptions): Answer {
  return {
    topic,
    question: options.words.question(topic),
    said: null,
    refusal: options.words.silent,
    chapter: null,
  }
}

/** An answer with a line behind it. */
function said(topic: Answer['topic'], line: string, chapter: string | null = null): Answer {
  return { topic, question: '', said: line, refusal: null, chapter }
}

function whoAnswer(options: AddressOptions): Answer {
  const { role } = options.dossier
  if (!role) return silence('who', options)
  return said('who', options.words.role(role))
}

function allegianceAnswer(options: AddressOptions): Answer {
  const { faction } = options.dossier
  if (!faction) return silence('allegiance', options)
  return said('allegiance', options.words.faction(faction))
}

function sinceAnswer(options: AddressOptions): Answer {
  if (!options.since) return silence('since', options)
  return said('since', options.words.since(options.since), options.since)
}

/**
 * The route, which is the answer this whole module exists for.
 *
 * Six lines of `mapTrajectory` are, read in order, where somebody has been on
 * this ship and when they moved — the one thing the archive holds about a
 * person that no page of the site showed before. A step whose location the
 * blueprint cannot name is dropped rather than shown by its slug: a room the
 * walk cannot take you to is a room it should not be naming at you.
 */
function routeAnswer(options: AddressOptions): Answer {
  const steps: string[] = []
  for (const step of options.dossier.route) {
    const place = options.placeOf(step.location)
    if (!place) continue
    steps.push(options.words.step(step.label, place))
  }
  if (steps.length === 0) {
    const empty = silence('route', options)
    if (options.dossier.withheld > 0) empty.refusal = options.words.capped
    return empty
  }
  const last = options.dossier.route[options.dossier.route.length - 1]
  return said('route', options.words.route(steps), last?.label ?? null)
}

function nenAnswer(options: AddressOptions): Answer {
  const { category } = options.dossier
  if (!category) return silence('nen', options)
  return said('nen', options.words.category(category))
}

function techniquesAnswer(options: AddressOptions): Answer {
  const { techniques } = options.dossier
  if (techniques.length === 0) return silence('techniques', options)
  return said('techniques', options.words.techniques(techniques.map((technique) => technique.name)))
}

const ANSWERS: Record<AddressTopic, (options: AddressOptions) => Answer> = {
  who: whoAnswer,
  allegiance: allegianceAnswer,
  since: sinceAnswer,
  route: routeAnswer,
  nen: nenAnswer,
  techniques: techniquesAnswer,
}

/**
 * The whole exchange with one body.
 *
 * Every topic is asked, including the ones the archive cannot answer: an
 * interview that quietly dropped its silences would let the panel look complete
 * when it is not, and the silences are the most honest thing on it.
 */
export function interview(options: AddressOptions): Interview {
  return {
    characterId: options.dossier.characterId,
    name: options.name,
    answers: ADDRESS_TOPICS.map((topic) => ({
      ...ANSWERS[topic](options),
      question: options.words.question(topic),
    })),
    withheld: options.dossier.withheld,
  }
}

/**
 * What Body and Soul takes, which is what the body would not have volunteered.
 *
 * The two undated fields of the catalogue, and only for a reader who has set no
 * cap — see `dossier.ts`, which is where that decision is enforced by simply
 * not sending them. A capped reader gets the refusal, and the refusal is the
 * point: the one punch in the walk cannot obtain more than the archive gives,
 * so it is not a way around the spoiler filter, and it never becomes one.
 */
export function unseal(options: AddressOptions): Answer[] {
  const sealed = options.dossier.sealed
  if (!sealed) return [silence('allegiance-sealed', options)]
  const found: Answer[] = []
  if (sealed.allegiance)
    found.push({
      ...said('allegiance-sealed', sealed.allegiance),
      question: options.words.question('allegiance-sealed'),
    })
  if (sealed.identity)
    found.push({
      ...said('identity-sealed', sealed.identity),
      question: options.words.question('identity-sealed'),
    })
  return found.length > 0 ? found : [silence('allegiance-sealed', options)]
}
