import { describe, expect, it } from 'vitest'
import { objectSnapshotsAt, sightingAt, type ImportantObject } from './importantObjects'
import catalog from '../../../../data/objects/objects.json'

const object: ImportantObject = {
  id: 'sample',
  canonicalName: 'Sample',
  category: 'test',
  firstVisibleChapter: 10,
  description: 'A tracked object',
  sightings: [
    {
      fromChapter: 10,
      untilChapter: 12,
      locationSlug: 'room-a',
      precision: 'EXACT_ROOM',
      certainty: 'CONFIRMED',
      note: 'First',
    },
    {
      fromChapter: 12,
      locationSlug: 'room-b',
      precision: 'ZONE',
      certainty: 'PROBABLE',
      note: 'Second',
    },
  ],
}

describe('important object tracking', () => {
  it('catalogues TSK-17 and the Seed Urn', () => {
    const objects = catalog as ImportantObject[]
    expect(objects.some((entry) => entry.id === 'tsk-17')).toBe(true)
    expect(objects.some((entry) => entry.id === 'seed-urn')).toBe(true)
  })

  it('resolves the latest valid sighting', () => {
    expect(sightingAt(object, 9)).toBeNull()
    expect(sightingAt(object, 11)?.locationSlug).toBe('room-a')
    expect(sightingAt(object, 12)?.locationSlug).toBe('room-b')
  })

  it('honours the spoiler limit and attaches map locations', () => {
    const locations = [
      { id: 'b', slug: 'room-b', name: 'Room B', type: 'ROOM', firstVisibleEventId: 'event' },
    ] as const

    expect(objectSnapshotsAt([object], { chapter: 12, locations, spoilerLimit: 9 })).toEqual([])
    expect(
      objectSnapshotsAt([object], { chapter: 12, locations, spoilerLimit: 12 })[0]?.location?.name,
    ).toBe('Room B')
  })
})
