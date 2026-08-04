import { describe, expect, it } from 'vitest'
import { noteFor, type BodyReadoutWords } from './pageBodyReadout'
import type { Reach } from './cast'

const WORDS: BodyReadoutWords = {
  refusal: (reason) => `refused:${reason}`,
  tell: (tell) => `tell:${tell}`,
  mark: (mark) => `mark:${mark}`,
  held: (name, what) => `${name} — ${what}`,
  worn: (name) => `worn:${name}`,
  stolen: (name, technique) => `stolen:${name}:${technique}`,
  delivered: (name) => `delivered:${name}`,
}

const nameOf = (characterId: string) => (characterId === 'sakata' ? 'Sakata' : '')

const HELD: Reach = {
  outcome: 'held',
  kind: 'elastic',
  characterId: 'sakata',
  hold: {
    characterId: 'sakata',
    kind: 'elastic',
    mark: 'bound',
    since: 0,
    until: 12_000,
  },
}

describe('the one line a cast at a body comes back with', () => {
  it('names the body and what is now on it', () => {
    expect(noteFor(HELD, WORDS, nameOf)).toBe('Sakata — mark:bound')
  })

  it('reads out what an asking technique found, in one line', () => {
    const told: Reach = {
      outcome: 'told',
      kind: 'dowsing',
      characterId: 'sakata',
      tells: ['holds-sealed', 'declares-aura'],
    }
    expect(noteFor(told, WORDS, nameOf)).toBe('tell:holds-sealed tell:declares-aura')
  })

  /** Ch. 357: the face is copied off the body in front of you, and that body
   * is given back untouched — so the line is about the visitor, not about them. */
  it('says whose face the visitor is now wearing', () => {
    const worn: Reach = { outcome: 'worn', kind: 'disguise', characterId: 'sakata' }
    expect(noteFor(worn, WORDS, nameOf)).toBe('worn:Sakata')
  })

  /** A refusal is a condition of the technique, which is the most instructive
   * thing the walk can say — so it is shown rather than buried. */
  it('says why a technique refused, with its reason', () => {
    const refused: Reach = { outcome: 'refused', kind: 'chain-bind', reason: 'oath' }
    expect(noteFor(refused, WORDS, nameOf)).toBe('refused:oath')
  })

  /** The cast falls through to the room, which the visitor will see happen:
   * saying so every time would nag about the common case. */
  it('says nothing when the technique was never one for people', () => {
    const through: Reach = { outcome: 'refused', kind: 'blast', reason: 'not-a-body' }
    expect(noteFor(through, WORDS, nameOf)).toBeNull()
  })
})
