import { describe, expect, it } from 'vitest'
import { ADDRESS_TOPICS, interview, unseal, type AddressWords } from './address'
import type { CastDossier } from './dossier'

/** The words, said plainly, so a test reads what the panel would show. */
const WORDS: AddressWords = {
  question: (topic) => `Q:${topic}`,
  role: (role) => `role:${role}`,
  faction: (faction) => `faction:${faction}`,
  since: (chapter) => `since:${chapter}`,
  step: (chapter, place) => `${chapter}@${place}`,
  route: (steps) => steps.join(' · '),
  category: (label) => `category:${label}`,
  techniques: (names) => `techniques:${names.join(',')}`,
  silent: 'the archive says nothing',
  capped: 'past your chapter',
}

const DOSSIER: CastDossier = {
  characterId: 'kurapika',
  role: 'Nen teacher/protector',
  faction: 'the Phantom Troupe',
  factionId: 'phantom-troupe',
  category: 'Conjurer',
  techniques: [{ name: 'Chain Jail', carried: true }],
  route: [
    { location: 'room-1014', chapter: 358, label: '358' },
    { location: 'room-1003', chapter: 365, label: '365' },
  ],
  withheld: 0,
  sealed: null,
}

const options = (dossier: CastDossier = DOSSIER) => ({
  dossier,
  name: 'Kurapika',
  since: '358',
  placeOf: (location: string) => (location === 'nowhere' ? null : `place:${location}`),
  words: WORDS,
})

const answerTo = (topic: string, dossier?: CastDossier) =>
  interview(options(dossier)).answers.find((answer) => answer.topic === topic)!

describe('the six questions', () => {
  it('asks every one of them, in the order they are asked', () => {
    const talk = interview(options())
    expect(talk.answers.map((answer) => answer.topic)).toEqual([...ADDRESS_TOPICS])
    expect(talk.name).toBe('Kurapika')
    expect(talk.characterId).toBe('kurapika')
  })

  it('answers each of them with the catalogue’s own line', () => {
    expect(answerTo('who').said).toBe('role:Nen teacher/protector')
    expect(answerTo('allegiance').said).toBe('faction:the Phantom Troupe')
    expect(answerTo('since').said).toBe('since:358')
    expect(answerTo('nen').said).toBe('category:Conjurer')
    expect(answerTo('techniques').said).toBe('techniques:Chain Jail')
  })

  it('dates what the archive dates', () => {
    expect(answerTo('since').chapter).toBe('358')
    expect(answerTo('route').chapter).toBe('365')
    expect(answerTo('who').chapter).toBeNull()
  })

  /** An interview that dropped its silences would look complete when it is not. */
  it('keeps asking what the archive cannot answer, and says so', () => {
    const bare: CastDossier = {
      ...DOSSIER,
      role: '',
      faction: null,
      category: null,
      techniques: [],
      route: [],
    }
    const talk = interview({ ...options(bare), since: null })
    expect(talk.answers).toHaveLength(ADDRESS_TOPICS.length)
    for (const answer of talk.answers) {
      expect(answer.said).toBeNull()
      expect(answer.refusal).toBe(WORDS.silent)
      expect(answer.question).toBe(`Q:${answer.topic}`)
    }
  })
})

describe('the route as an answer', () => {
  it('reads the steps in order, named in the visitor’s own language', () => {
    expect(answerTo('route').said).toBe('358@place:room-1014 · 365@place:room-1003')
  })

  /** A room the walk cannot take you to is a room it should not name at you. */
  it('drops a step the blueprint cannot name rather than showing its slug', () => {
    const partly: CastDossier = {
      ...DOSSIER,
      route: [
        { location: 'nowhere', chapter: 358, label: '358' },
        { location: 'room-1003', chapter: 365, label: '365' },
      ],
    }
    expect(answerTo('route', partly).said).toBe('365@place:room-1003')
  })

  it('blames the cap rather than the archive when the cap is what emptied it', () => {
    const capped: CastDossier = { ...DOSSIER, route: [], withheld: 3 }
    expect(answerTo('route', capped).refusal).toBe(WORDS.capped)
    expect(interview(options(capped)).withheld).toBe(3)
  })

  it('blames the archive when the archive is what is empty', () => {
    const nothing: CastDossier = { ...DOSSIER, route: [], withheld: 0 }
    expect(answerTo('route', nothing).refusal).toBe(WORDS.silent)
  })
})

describe('what Body and Soul takes', () => {
  const sealed: CastDossier = {
    ...DOSSIER,
    sealed: { allegiance: 'Heil-Ly', identity: 'a dead man’s name' },
  }

  it('gives the two undated lines when the reader was sent them', () => {
    const taken = unseal(options(sealed))
    expect(taken.map((answer) => answer.topic)).toEqual(['allegiance-sealed', 'identity-sealed'])
    expect(taken[0]!.said).toBe('Heil-Ly')
    expect(taken[1]!.said).toBe('a dead man’s name')
  })

  it('gives only the line that exists', () => {
    const half: CastDossier = { ...DOSSIER, sealed: { allegiance: 'Heil-Ly', identity: null } }
    expect(unseal(options(half)).map((answer) => answer.topic)).toEqual(['allegiance-sealed'])
  })

  /** The refusal is the point: the punch never obtains more than the archive
   * gives, so it never becomes a way around the cap. */
  it('comes back with the archive’s silence where nothing was sealed', () => {
    const taken = unseal(options())
    expect(taken).toHaveLength(1)
    expect(taken[0]!.said).toBeNull()
    expect(taken[0]!.refusal).toBe(WORDS.silent)
  })
})
