import { describe, expect, it } from 'vitest'
import { contextLineFor, contextLinesFor, type DialogueEvent } from './dialogue'

const event = (overrides: Partial<DialogueEvent> = {}): DialogueEvent => ({
  id: 'event-361-1',
  chapter: 361,
  title: 'The Nen lessons begin',
  summary: 'Kurapika explains Nen while the guards watch the room.',
  ...overrides,
})

describe('contextual character dialogue', () => {
  it('dates and identifies every bilingual line as a paraphrase', () => {
    const line = contextLineFor({ characterId: 'kurapika', role: 'Hunter' }, event())

    expect(line).toMatchObject({ eventId: 'event-361-1', chapter: 361, kind: 'paraphrase' })
    expect(line.text.length).toBeGreaterThan(20)
    expect(line.textFr.length).toBeGreaterThan(20)
    expect(line.textFr).not.toBe(line.text)
  })

  it('changes a person’s answer when the reconstructed event changes', () => {
    const member = { characterId: 'kurapika', role: 'Hunter' }
    const lesson = contextLineFor(member, event())
    const murder = contextLineFor(
      member,
      event({
        id: 'event-362-2',
        chapter: 362,
        title: 'A death in the royal quarters',
        summary: 'Another guard is murdered without a visible assassin.',
      }),
    )

    expect(murder.text).not.toBe(lesson.text)
    expect(murder.textFr).not.toBe(lesson.textFr)
    expect(murder.eventId).toBe('event-362-2')
  })

  it('keeps a distinctive voice for authored principal characters', () => {
    const martialLaw = event({
      title: 'Martial law',
      summary: 'The army takes control of every corridor.',
    })
    const benjamin = contextLineFor(
      { characterId: 'prince-benjamin', role: 'First Prince' },
      martialLaw,
    )
    const oito = contextLineFor({ characterId: 'queen-oito', role: 'Queen' }, martialLaw)

    expect(benjamin.textFr).toContain('commandement')
    expect(oito.textFr).toContain('mère')
  })

  it('gives every present person a line, including role-based fallbacks', () => {
    const members = [
      { characterId: 'unknown-guard', role: 'Royal guard' },
      { characterId: 'unknown-passenger', role: 'Passenger' },
      { characterId: 'unknown-mafia', role: 'Heil-Ly associate' },
    ]
    const lines = contextLinesFor(members, event({ title: 'Quiet watch', summary: '' }))

    expect(Object.keys(lines)).toEqual(members.map((member) => member.characterId))
    expect(lines['unknown-guard']?.textFr).toContain('poste')
    expect(lines['unknown-passenger']?.textFr).toContain('travail')
    expect(lines['unknown-mafia']?.textFr).toContain('information')
  })
})
