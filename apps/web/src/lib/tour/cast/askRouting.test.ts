import { describe, expect, it } from 'vitest'
import { foldQuestion, matchTopic, parseTopic, readTopic, worthRouting } from './askRouting'

describe('matchTopic', () => {
  it.each([
    ['Tu bosses pour qui ?', 'allegiance'],
    ['Pour qui êtes-vous à bord ?', 'allegiance'],
    ['Who do you serve?', 'allegiance'],
    ['Depuis quand tu es là ?', 'since'],
    ['How long have you been here?', 'since'],
    ["Par où t'es passé ?", 'route'],
    ['Where were you yesterday?', 'route'],
    ['Quelles sont tes techniques ?', 'techniques'],
    ['What abilities do you have', 'techniques'],
    ['Et ton Nen ?', 'nen'],
    ['What is your aura like', 'nen'],
    ['Qui es-tu ?', 'who'],
    ["Comment tu t'appelles", 'who'],
    ['Who are you', 'who'],
  ])('routes %j to %s', (query, topic) => {
    expect(matchTopic(query)).toBe(topic)
  })

  it('leaves a question no phrase covers to the model', () => {
    expect(matchTopic('Tu as peur de mourir ?')).toBeNull()
    expect(matchTopic('Qui va gagner la guerre de succession ?')).toBeNull()
  })

  it('only matches a phrase at the start of a word', () => {
    // "renen" must not be read as Nen, nor "pouvoirs" missed.
    expect(matchTopic('renentendu')).toBeNull()
    expect(matchTopic('tes pouvoirs ?')).toBe('techniques')
  })
})

describe('foldQuestion', () => {
  it('drops accents, case and punctuation', () => {
    expect(foldQuestion("  Où ÉTIEZ-vous, l'ami ?! ")).toBe('ou etiez vous l ami')
  })
})

describe('worthRouting', () => {
  it('needs letters and a bounded length', () => {
    expect(worthRouting('?!')).toBe(false)
    expect(worthRouting('ok')).toBe(true)
    expect(worthRouting('a'.repeat(161))).toBe(false)
  })
})

describe('parseTopic', () => {
  it('keeps a topic out of the list', () => {
    expect(parseTopic('{"topic":"nen"}')).toBe('nen')
    expect(parseTopic('{"topic":"none"}')).toBe('none')
  })

  it('reads anything else as none, prose included', () => {
    expect(parseTopic(null)).toBe('none')
    expect(parseTopic('not json')).toBe('none')
    expect(parseTopic('{"topic":"He dies in chapter 400"}')).toBe('none')
    expect(parseTopic('{"topic":"allegiance-sealed"}')).toBe('none')
  })
})

describe('readTopic', () => {
  it('accepts only a listed word', () => {
    expect(readTopic('route')).toBe('route')
    expect(readTopic(3)).toBe('none')
    expect(readTopic('identity-sealed')).toBe('none')
  })
})
