import { describe, expect, it } from 'vitest'
import { theShip } from '$lib/tour/blueprint'
import { reconstructAt, worldEventsThrough } from './reconstructAt'

describe('reconstruction at a narrative moment', () => {
  it('compares world events by chapter and sequence, not an unrelated ordinal scale', () => {
    const records = [
      {
        id: 'later-with-small-ordinal',
        type: 'ENTITY_MOVED',
        schemaVersion: 1,
        branchId: 'canon',
        ordinal: 1,
        chapterNumber: 401,
        localSequence: 1,
        payload: {},
        sourceIds: [],
        revealedAtChapter: null,
      },
    ]
    const target = {
      chapter: { number: 390 },
      event: { id: 'event-390', ordinal: 100, sequence: 2, locationId: null },
    }
    expect(worldEventsThrough(records, target)).toEqual([])
  })

  it('walks location parents to resolve a deck', () => {
    const moment = reconstructAt({
      index: 0,
      chronologicalEvents: [
        {
          chapter: { number: 390 },
          event: { id: 'event-390', ordinal: 100, sequence: 1, locationId: null },
        },
      ],
      worldEvents: [],
      presences: [
        {
          entityId: 'body-a',
          locationId: 'unmapped-child',
          precision: 'TIER',
          certainty: 'CONFIRMED',
          fromEvent: {
            id: 'event-390',
            ordinal: 100,
            sequence: 1,
            chapter: { number: 390 },
          },
          untilEvent: null,
        },
      ],
      sceneCharacters: [],
      locations: [
        {
          id: 'unmapped-child',
          slug: 'unmapped-child',
          name: 'Unmapped child',
          parentLocationId: 'tier-parent',
        },
        {
          id: 'tier-parent',
          slug: 'tier-3',
          name: 'Tier 3',
          parentLocationId: null,
        },
      ],
      locationSlugs: {},
      ship: theShip(),
      nameOf: () => 'Body A',
    })
    expect(moment.presences[0]?.tierId).toBe('tier-3')
  })
})
