import { describe, expect, it } from 'vitest'
import { readDataFile, type CatalogCharacter } from './data-files'

/**
 * The curated event log used to live as a JavaScript literal inside
 * `packages/database/prisma/backfill_timeline.mjs`, which meant nothing could
 * check it without a database and a backfill run. It is canon data now, so it
 * gets the same treatment as the rest of `data/`: the invariants the backfill
 * silently relied on are asserted here instead of discovered in production.
 */

interface CuratedEvent {
  chapter: number
  chapterTitle: string
  sequence: number
  title: string
  summary: string
  legacyTitles: string[]
  occursAfterTitle?: string
  occurredAtLabel?: string
  isFlashback?: boolean
  occursOnBlackWhale?: boolean
  note?: string
}

interface CatalogChapter {
  number: number
  title: string
  timeline?: { event: string; charactersInvolved?: string[]; location?: string }[]
}

/**
 * Seeded by `prisma/seed.ts` rather than by the log, so an anchor pointing at it
 * resolves at backfill time even though no entry in the file carries the title.
 */
const SEEDED_TITLES = ['Zodiacs Assemble', 'Boarding the Black Whale', 'Ship Departs']

/** The chapter the arc opens on: the urn ceremony that starts the contest. */
const FIRST_ARC_CHAPTER = 349

const events = await readDataFile<CuratedEvent[]>('events/events.json')
const chapters = await readDataFile<CatalogChapter[]>('chapters/chapters.json')

describe('data/events/events.json', () => {
  it('gives every chapter of the arc at least one curated event', () => {
    const covered = new Set(events.map((event) => event.chapter))
    const last = Math.max(...covered)
    const uncovered = []
    for (let chapter = FIRST_ARC_CHAPTER; chapter <= last; chapter += 1) {
      if (!covered.has(chapter)) uncovered.push(chapter)
    }
    expect(uncovered).toEqual([])
  })

  it('never gives two events the same position in a chapter', () => {
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const event of events) {
      const key = `${event.chapter}.${event.sequence}`
      if (seen.has(key)) duplicates.push(key)
      seen.add(key)
    }
    expect(duplicates).toEqual([])
  })

  it('resolves every chronological anchor', () => {
    const titles = new Set([...events.map((event) => event.title), ...SEEDED_TITLES])
    const unresolved = events
      .filter((event) => event.occursAfterTitle && !titles.has(event.occursAfterTitle))
      .map((event) => `${event.title} → ${event.occursAfterTitle}`)
    expect(unresolved).toEqual([])
  })

  // An event is matched on its title when the backfill upserts it, so a title
  // that repeats would make two chapters fight over the same database row.
  it('never reuses a title', () => {
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const event of events) {
      if (seen.has(event.title)) duplicates.push(event.title)
      seen.add(event.title)
    }
    expect(duplicates).toEqual([])
  })

  /**
   * `legacyTitles` exists to rename the auto-generated placeholders the archive
   * started from — it must keep pointing at them, not at a new curated title.
   */
  it('keeps auto-generated placeholders in legacyTitles only', () => {
    const placeholder = /^(Début du chapitre \d+|Appearance of )/
    const live = events.filter((event) => placeholder.test(event.title)).map((event) => event.title)
    expect(live).toEqual([])
  })

  it('names its chapters consistently', () => {
    const titles = new Map<number, string>()
    const conflicts: string[] = []
    for (const event of events) {
      const known = titles.get(event.chapter)
      if (known && known !== event.chapterTitle) {
        conflicts.push(`${event.chapter}: ${known} / ${event.chapterTitle}`)
      }
      titles.set(event.chapter, event.chapterTitle)
    }
    expect(conflicts).toEqual([])
  })

  it('writes a summary for every event', () => {
    const empty = events
      .filter((event) => !event.summary?.trim() || !event.title?.trim())
      .map((event) => `${event.chapter}.${event.sequence}`)
    expect(empty).toEqual([])
  })
})

describe('data/chapters/chapters.json', () => {
  // Chapter sheets place characters on the map through `charactersInvolved`, so
  // an id that resolves to nobody is a visit the trajectory silently drops.
  it('only involves characters the catalogue knows', async () => {
    const characters = await readDataFile<CatalogCharacter[]>('characters/characters.json')
    const known = new Set(characters.map((character) => character.id))
    const unknown = new Set<string>()
    for (const chapter of chapters) {
      for (const entry of chapter.timeline || []) {
        for (const id of entry.charactersInvolved || []) if (!known.has(id)) unknown.add(id)
      }
    }
    expect([...unknown]).toEqual([])
  })

  it('describes each chapter once', () => {
    const numbers = chapters.map((chapter) => chapter.number)
    expect(numbers).toEqual([...new Set(numbers)])
  })
})
