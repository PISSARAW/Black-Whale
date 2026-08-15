import { describe, expect, it } from 'vitest'
import type { MangaView } from '../mangaViews'
import type { Post } from './types'
import { stagePostsForMangaView } from './mangaStage'

const post = (characterId: string, spaceId = 'salon'): Post => ({
  member: {
    characterId,
    name: characterId,
    locations: [],
    role: 'Royal',
    since: 'ch-382',
    nen: false,
    hatsu: [],
    beast: null,
  },
  spaceId,
  tierId: 'interior',
  at: [0, 0],
  costume: { role: 'steward' },
})

describe('manga panel cast staging', () => {
  it('uses the panel positions and keeps unrelated rooms untouched', () => {
    const view = {
      id: 'panel',
      spaceId: 'salon',
      at: [0, 1],
      heading: 0,
      pitch: 0,
      chapter: 382,
      volume: 37,
      label: 'Panel',
      labelFr: 'Case',
      staging: [{ characterId: 'king', at: [-3, 0] as [number, number], pose: 'seated' as const }],
    } satisfies MangaView

    expect(
      stagePostsForMangaView(
        [post('king'), post('extra'), post('prince', 'suite'), post('elsewhere', 'hall')],
        {
          ...view,
          staging: [...view.staging, { characterId: 'prince', at: [3, 0] as [number, number] }],
        },
        'royal-interior',
      ),
    ).toMatchObject([
      {
        member: { characterId: 'king' },
        spaceId: 'salon',
        tierId: 'royal-interior',
        at: [-3, 0],
        pose: 'seated',
      },
      {
        member: { characterId: 'prince' },
        spaceId: 'salon',
        tierId: 'royal-interior',
        at: [3, 0],
      },
      { member: { characterId: 'elsewhere' }, spaceId: 'hall', at: [0, 0] },
    ])
  })
})
