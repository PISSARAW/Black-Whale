import { beforeAll, describe, expect, it } from 'vitest'
import { loadProphecySheets, prophecySheetsReady, prophecySubjectFor } from './prophecySheets.js'

/**
 * Lovely Ghostwriter used to improvise four lines about whatever was clicked,
 * while `data/prophecies` held a written poem for every passenger and the
 * character page printed it. These cases pin the four ways the overlay is
 * allowed to work out whose sheet it is holding.
 *
 * There is no DOM in this suite, so the targets are the smallest objects the
 * lookup actually touches: a dataset, `closest` and `querySelector`.
 */
interface FakeTarget {
  characterId?: string
  characterName?: string
  /** An ancestor link, as `closest` would find it. */
  ancestorHref?: string
  /** A link inside the target, as `querySelector` would find it. */
  descendantHref?: string
}

function target(options: FakeTarget): HTMLElement {
  const anchor = (href: string) => ({ getAttribute: () => href })
  const element = {
    dataset: {
      hatsuCharacter: options.characterId,
      hatsuCharacterName: options.characterName,
    } as DOMStringMap,
    closest(selector: string) {
      if (selector === '[data-hatsu-character]')
        return options.characterId || options.characterName ? element : null
      if (selector.startsWith('a[href') && options.ancestorHref) return anchor(options.ancestorHref)
      return null
    },
    querySelector(selector: string) {
      if (selector.startsWith('a[href') && options.descendantHref)
        return anchor(options.descendantHref)
      return null
    },
  }
  return element as unknown as HTMLElement
}

describe('Lovely Ghostwriter sheets', () => {
  beforeAll(async () => {
    await loadProphecySheets()
  })

  it('reports when the catalogue can answer a click', () => {
    expect(prophecySheetsReady()).toBe(true)
  })

  it('reads the marker id off the ship map', () => {
    const sheet = prophecySubjectFor(target({ characterId: 'kurapika' }), '/ship')

    expect(sheet?.subjectName).toBe('Kurapika')
    expect(sheet?.poem).toHaveLength(4)
  })

  it('follows a link to a character page', () => {
    const inside = prophecySubjectFor(target({ descendantHref: '/characters/queen-oito' }), '/')
    const around = prophecySubjectFor(
      target({ ancestorHref: '/fr/characters/prince-camilla' }),
      '/fr/characters',
    )

    expect(inside?.subjectId).toBe('queen-oito')
    expect(around?.subjectId).toBe('prince-camilla')
  })

  it('falls back to the page the visitor is standing on', () => {
    const sheet = prophecySubjectFor(target({}), '/fr/characters/prince-tserriednich#nen')

    expect(sheet?.subjectId).toBe('prince-tserriednich')
  })

  it('falls back to the name a marker carries', () => {
    const sheet = prophecySubjectFor(target({ characterName: 'Kurapika' }), '/ship')

    expect(sheet?.subjectId).toBe('kurapika')
  })

  it('leaves the pen holder unwritten', () => {
    const sheet = prophecySubjectFor(target({ characterId: 'chrollo-lucilfer' }), '/ship')

    expect(sheet?.blank).toBe(true)
    expect(sheet?.poem).toEqual([])
  })

  it('names nobody when the click landed on scenery', () => {
    expect(prophecySubjectFor(target({ characterName: 'A corridor' }), '/ship')).toBeNull()
    expect(prophecySubjectFor(target({}), '/timeline')).toBeNull()
  })
})
