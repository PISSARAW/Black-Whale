import { describe, expect, it } from 'vitest'
import { catalogSceneLocation, type CatalogChapterScenes } from './sceneLocation'

const chapters: CatalogChapterScenes[] = [
  {
    number: 363,
    timeline: [
      {
        event: 'Vincent stabs Sandra at the entrance of room 1014',
        locationId: 'room-1014',
      },
      { event: 'Balsamilco talks Benjamin down', locationId: 'room-1001' },
    ],
  },
  {
    number: 399,
    timeline: [
      {
        event: 'Hinrigh and Nobunaga move through the Heil-Ly laundry and communal rooms',
        locationId: 'heilly-hideout',
      },
      {
        event: "Yokotani's ability expels Hinrigh and Nobunaga from the hideout",
        locationId: 'heilly-hideout',
      },
    ],
  },
]

describe('catalogue scene locations', () => {
  it('accepts a precise scene whose wording changed', () => {
    expect(
      catalogSceneLocation({
        chapterNumber: 363,
        eventTitle: 'Vincent stabs a servant in room 1014',
        chapters,
      }),
    ).toBe('room-1014')
  })

  it('resolves an event aggregating consecutive scenes in the same place', () => {
    expect(
      catalogSceneLocation({
        chapterNumber: 399,
        eventTitle: 'Hinrigh and Nobunaga enter the Heil-Ly hideout',
        chapters,
      }),
    ).toBe('heilly-hideout')
  })

  it('refuses weak or spatially ambiguous matches', () => {
    expect(
      catalogSceneLocation({ chapterNumber: 363, eventTitle: 'An unrelated event', chapters }),
    ).toBeNull()
    expect(
      catalogSceneLocation({
        chapterNumber: 400,
        eventTitle: 'The guards meet',
        chapters: [
          {
            number: 400,
            timeline: [
              { event: 'The guards meet Morena', locationId: 'room-a' },
              { event: 'The guards meet Kurapika', locationId: 'room-b' },
            ],
          },
        ],
      }),
    ).toBeNull()
  })
})
