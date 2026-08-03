import { describe, expect, it } from 'vitest'
import { findDebutChapter, findFaction, findPost, readInfobox } from '../src/hunterpedia/infobox'
import { addMissingPassengers } from '../src/hunterpedia/sync'
import { enrichCharacter } from '../src/hunterpedia/enrich'
import type { WritableCharacter } from '../src/hunterpedia/catalogue-file'
import {
  chapterTitle,
  normalizeName,
  parseAppearanceList,
  slugify,
  statusFor,
  stripWikitext,
} from '../src/hunterpedia/wikitext'

/**
 * The wiki's conventions are the part of these tools that keeps being wrong,
 * and they are now checkable against a fixture instead of against the live
 * site — which is what made them untestable while every parser sat behind a
 * `fetch` in a top-level script.
 */

const PAGE = `{{Character
|Name = Saquelle
|affiliation = [[Kakin Empire]] ; [[Benjamin Hui Guo Rou|Benjamin]]'s Private Army
|occupation = Royal Bodyguard for Prince Marayam<ref name="ch358"/>
|manga debut = [[Chapter 358]] (Mentioned) ; [[Chapter 360]]
|status = Alive
}}

== Characters in Order of Appearance ==
* [[Kurapika]]
* [[Woble Hui Guo Rou|Woble]] {{I}}
* [[Momoze Hui Guo Rou|Momoze]] {{Co}} {{Sm|(Corpse)}}
* [[Hisoka Morow]] {{D}}
* [[Chrollo Lucilfer]] {{M}}
* [[Kacho Hui Guo Rou|Kacho]] {{Sm|(Nen Double)}}
not a list line
`

describe('reading the markup', () => {
  it('strips links, refs and bold down to the sentence', () => {
    expect(stripWikitext("[[Kakin Empire]] ; '''Benjamin'''<ref name=\"x\"/>")).toBe(
      'Kakin Empire ; Benjamin',
    )
  })

  it('reads a named infobox field without swallowing the next line', () => {
    expect(readInfobox('|affiliation =\n|occupation = Chef\n').affiliation).toBe('')
  })

  it('reads a full infobox', () => {
    const infobox = readInfobox(PAGE)
    expect(infobox.occupation).toBe('Royal Bodyguard for Prince Marayam')
    expect(infobox.affiliation).toContain('Kakin Empire')
    expect(infobox.deceased).toBe(false)
    expect(infobox.databookOnly).toBe(false)
  })

  it('falls back to the previous fields for someone who has died', () => {
    const dead = readInfobox('|previous occupation = Bodyguard\n|status = Deceased\n')
    expect(dead.occupation).toBe('Bodyguard')
    expect(dead.deceased).toBe(true)
  })

  it('marks a Jump Ryu! sheet with no manga debut as databook-only', () => {
    expect(readInfobox('|manga debut =\n|note = Jump Ryu! Vol. 21\n').databookOnly).toBe(true)
  })

  it('reads the chapter title out of the page template', () => {
    expect(chapterTitle('|Name = Foul Play\n')).toBe('Foul Play')
    expect(chapterTitle('nothing here')).toBe(null)
  })
})

describe('the post is not the employer', () => {
  // Saquelle is Benjamin's private soldier and Marayam's royal guard. Reading
  // the two as one put a dozen soldiers in their employer's apartment instead
  // of the one they actually stand in.
  it('reads the prince someone is stationed with', () => {
    expect(findPost('Royal Bodyguard for Prince Marayam')).toBe('Marayam')
    expect(findPost("Prince Woble's Maid")).toBe('Woble')
    expect(findPost('Chef')).toBe(null)
  })

  it('reads the employer, preferring the prince who is not the post', () => {
    const faction = findFaction({
      affiliation: 'Kakin Empire ; Benjamin ; Marayam',
      occupation: 'Royal Bodyguard for Prince Marayam',
      post: 'Marayam',
    })
    expect(faction).toBe('prince-benjamin')
  })

  it('keeps a mafia officer attached to their family, not to the prince', () => {
    const faction = findFaction({
      affiliation: 'Heil-Ly Family ; Tserriednich',
      occupation: 'Consigliere',
      post: null,
    })
    expect(faction).toBe('mafia-heilly')
  })

  it('falls back through the named organisations', () => {
    const of = (affiliation: string) => findFaction({ affiliation, occupation: '', post: null })
    expect(of('Phantom Troupe')).toBe('phantom-troupe')
    expect(of('Hunter Association')).toBe('hunter-association')
    expect(of('a private citizen')).toBe(null)
  })
})

describe('dating a debut', () => {
  it('prefers a chapter the character is shown in over one they are named in', () => {
    expect(findDebutChapter('Chapter 358 (Mentioned) ; Chapter 360')).toBe(360)
  })

  it('takes the mention when that is all there is', () => {
    expect(findDebutChapter('Chapter 358 (Mentioned)')).toBe(358)
  })

  it('answers nothing rather than guessing', () => {
    expect(findDebutChapter('')).toBe(null)
  })
})

describe('a chapter cast list', () => {
  const entries = parseAppearanceList(PAGE)

  it('reads one entry per bullet, ignoring everything else', () => {
    expect(entries.map((entry) => entry.name)).toEqual([
      'Kurapika',
      'Woble Hui Guo Rou',
      'Momoze Hui Guo Rou',
      'Hisoka Morow',
      'Chrollo Lucilfer',
      'Kacho Hui Guo Rou',
    ])
  })

  it('grades each entry by its markers and its note', () => {
    expect(entries.map(statusFor)).toEqual([
      'appears',
      'pictured',
      'corpse',
      'debut',
      'mentioned',
      'clone',
    ])
  })

  // A character who debuts in a flashback is a debut first.
  it('lets a debut outrank a flashback', () => {
    expect(statusFor({ name: 'x', flags: ['D', 'F'], note: '' })).toBe('debut')
  })

  it('says nothing about a page with no cast list', () => {
    expect(parseAppearanceList('== Summary ==\n* [[Kurapika]]')).toEqual([])
  })
})

describe('matching a name to a catalogue entry', () => {
  it('ignores accents, punctuation and case', () => {
    expect(normalizeName('Salé-salé')).toBe(normalizeName('salesale'))
  })

  it('reconciles both wiki spellings of Hisoka Morrow', () => {
    expect(normalizeName('Hisoka Morow')).toBe(normalizeName('Hisoka Morrow'))
  })

  it('slugifies to the one identifier form the conventions allow', () => {
    expect(slugify("Zhang Lei's Aide")).toBe('zhang-leis-aide')
  })
})

function entry(overrides: Partial<WritableCharacter> = {}): WritableCharacter {
  return {
    id: 'someone',
    canonicalName: 'Someone',
    aliases: [],
    ...overrides,
  } as WritableCharacter
}

describe('adding the passengers the catalogue is missing', () => {
  it('skips whoever is already known under any name', () => {
    const catalogue = [entry({ canonicalName: 'Hisoka Morrow', aliases: ['Hisoka'] })]
    const { additions } = addMissingPassengers(catalogue, ['Hisoka Morow'])
    expect(additions).toEqual([])
  })

  it('writes a template, not an observation', () => {
    const { additions } = addMissingPassengers([], ['Saquelle'])
    expect(additions[0]).toMatchObject({
      id: 'saquelle',
      factionId: null,
      firstAppearanceChapterId: 'ch-359',
      shipLocation: { tier: null, room: null },
    })
  })

  it('never reuses an id', () => {
    const { additions } = addMissingPassengers([entry({ id: 'saquelle' })], ['Saquelle'])
    expect(additions[0]?.id).toBe('saquelle-2')
  })
})

describe('enriching a template entry', () => {
  const infobox = {
    affiliation: 'Kakin Empire ; Benjamin',
    occupation: 'Royal Bodyguard for Prince Marayam',
    debut: 'Chapter 360',
    deceased: false,
    databookOnly: false,
  }

  it('files the employer and stations the body in the prince it guards', () => {
    const target = entry({
      factionId: null,
      firstAppearanceChapterId: 'ch-359',
      shipLocation: { tier: null, room: null, status: 'inconnu', role: 'passager nommé' },
    })
    enrichCharacter(target, infobox)
    expect(target.factionId).toBe('prince-benjamin')
    expect(target.shipLocation).toMatchObject({ tier: 1, room: '1013', status: 'actif' })
    expect(target.firstAppearanceChapterId).toBe('ch-360')
  })

  it('never overwrites a position written by hand', () => {
    const target = entry({
      shipLocation: { tier: 3, room: 'cineplex', status: 'actif', role: 'spectateur' },
    })
    enrichCharacter(target, infobox)
    expect(target.shipLocation).toMatchObject({ tier: 3, room: 'cineplex', role: 'spectateur' })
  })

  // No panel ever shows them, so no chapter may be invented — canon-lint
  // accepts an undated entry only when it is marked databook.
  it('leaves a databook-only passenger undated and says so', () => {
    const target = entry({
      firstAppearanceChapterId: 'ch-359',
      shipLocation: { tier: null, room: null, status: 'inconnu', role: 'passager nommé' },
    })
    enrichCharacter(target, { ...infobox, debut: '', databookOnly: true })
    expect(target.firstAppearanceChapterId).toBe(null)
    expect(target.positionProvenance).toBe('databook')
  })
})
