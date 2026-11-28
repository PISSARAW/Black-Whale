import { describe, expect, it } from 'vitest'
import type { MangaView } from '../mangaViews'
import type { Post } from './types'
import { stagePostsForMangaView } from './mangaStage'
import { MANGA_CINEPLEX_VIEWS } from '../mangaCineplexViews'
import { dressBlackWhaleCast } from './blackWhaleWardrobe'

const post = (characterId: string, spaceId = 'salon'): Post => ({
  member: {
    characterId,
    name: characterId,
    locations: [],
    role: 'Royal',
    since: 'ch-382',
    nen: null,
    hatsu: [],
    beast: null,
  },
  spaceId,
  tierId: 'interior',
  at: [0, 0],
  costume: { role: 'steward' },
})

describe('manga panel cast staging', () => {
  it('preserves Bonolenov’s identity and changes his disguise from the concourse to the cinema', () => {
    const view = MANGA_CINEPLEX_VIEWS.find(({ id }) => id === 'cineplex-auditorium-screen')!
    const bonolenov = post('bonolenov-ndongo', 'concourse')
    const hisoka = post('hisoka', view.spaceId)
    const posts = dressBlackWhaleCast([bonolenov, hisoka], {
      chapterNumber: 393,
      eventId: 'ch-393-bonolenov-kills-lynch',
    })
    expect(posts[0].bonolenovDisguise).toBe('lynch')
    expect(posts[1]).toBe(hisoka)
    const staged = stagePostsForMangaView(posts, view, 'interior')
    expect(staged).toHaveLength(1)
    expect(staged[0]).toMatchObject({
      member: { characterId: 'bonolenov-ndongo' },
      bonolenovDisguise: 'hisoka',
      pose: 'seated',
    })
  })

  it('keeps an explicitly unpopulated programme-type room empty', () => {
    const view = { spaceId: 'salon', staging: [] } as unknown as MangaView
    const posts = [
      post('prince'),
      post('neighbour', 'kitchen'),
      { ...post('elsewhere', 'hall'), tierId: 'other-tier' },
    ]
    expect(stagePostsForMangaView(posts, view, 'interior')).toEqual([posts[2]])
    expect(stagePostsForMangaView(posts, { ...view, staging: undefined }, 'interior')).toEqual(
      posts,
    )
  })
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
