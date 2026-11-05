import { describe, expect, it } from 'vitest'
import { loadCatalogue } from '../src/catalogue'
import { CHAPTER_415 } from '../src/scenes/chapter-415'
import { CHAPTER_416 } from '../src/scenes/chapter-416'
import { CHAPTER_418 } from '../src/scenes/chapter-418'
import { CHAPTER_419 } from '../src/scenes/chapter-419'
import { CHAPTER_420 } from '../src/scenes/chapter-420'
import { planTrajectory } from '../src/trajectory'

const catalogue = loadCatalogue()
const declarations = [CHAPTER_418, CHAPTER_419, CHAPTER_420]

describe('the 411–420 publication batch', () => {
  // A merge kept the ship geometry for 419–420 while removing their records.
  it('keeps every released chapter in both the catalogue and the event log', () => {
    for (let number = 411; number <= 420; number += 1) {
      expect(catalogue.chapters.some((chapter) => chapter.number === number)).toBe(true)
      expect(catalogue.events.some((event) => event.chapter === number)).toBe(true)
    }
  })

  it('connects every recent scene to the same event and participants in both catalogues', () => {
    const knownCharacters = new Set(catalogue.characters.map(({ id }) => id))
    const knownLocations = new Set(catalogue.locations.map(({ id }) => id))
    for (const declaration of declarations) {
      const chapter = catalogue.chapters.find(({ number }) => number === declaration.chapter)!
      const events = catalogue.events.filter(({ chapter }) => chapter === declaration.chapter)
      expect(declaration.scenes.map(({ event }) => event)).toEqual(events.map(({ title }) => title))
      expect(chapter.timeline?.map(({ event }) => event)).toEqual(events.map(({ title }) => title))
      for (const [index, scene] of declaration.scenes.entries()) {
        expect(scene.participants.map(([slug]) => slug)).toEqual(
          chapter.timeline![index]!.charactersInvolved,
        )
        for (const [slug] of scene.participants) expect(knownCharacters.has(slug)).toBe(true)
        if (scene.location) expect(knownLocations.has(scene.location)).toBe(true)
      }
    }
  })

  it('places Tserriednich in the casino only after his arrival, with Hisoka already there', () => {
    const prince = catalogue.characters.find(({ id }) => id === 'prince-tserriednich')!
    const hisoka = catalogue.characters.find(({ id }) => id === 'hisoka')!
    const route = planTrajectory(prince.mapTrajectory!)
    expect(route.slice(-3).map(({ location, from }) => ({ location, from }))).toEqual([
      { location: 'tier-1-royal-residential-sector-room-1004', from: 'ch-363' },
      { location: 'black-whale-unknown', from: 'ch-419.1' },
      { location: 'tier-1-vip-casino', from: 'ch-419.5' },
    ])
    expect(hisoka.mapTrajectory?.at(-1)).toMatchObject({
      location: 'tier-1-vip-casino',
      fromChapterId: 'ch-405',
    })
  })

  it('does not turn the predicted executions into real deaths', () => {
    for (const declaration of declarations) {
      expect(declaration.scenes.flatMap(({ bodyStates = [] }) => bodyStates)).toEqual([])
    }
    const prince = catalogue.characters.find(({ id }) => id === 'prince-tserriednich')!
    expect(prince.mangaAppearances?.filter(({ status }) => status === 'death')).toEqual([])
  })

  it('does not reopen the room-1004 stay over the later casino trajectory', () => {
    for (const chapter of [CHAPTER_415, CHAPTER_416]) {
      const princeMoves = chapter.scenes.flatMap(({ moves = [] }) =>
        moves.filter(({ slug }) => slug === 'prince-tserriednich'),
      )
      expect(princeMoves).toEqual([])
      expect(chapter.retiredPresenceIds).toContain(
        `ch${chapter.chapter}-presence-prince-tserriednich-room1004`,
      )
    }
  })
})
