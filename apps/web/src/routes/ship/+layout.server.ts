import { localizedLoad } from '$lib/server/localized-load'
import { prisma } from '$lib/server/db'
import { readSpoilerProfile } from '$lib/server/spoiler'
import { trimEventsForTimeline, trimWorldStateForMap } from '$lib/server/mapPayload'
import { theShip } from '$lib/tour/blueprint'
import { walkTargetsByLocation } from '$lib/tour/walkTargets'
import type { LayoutServerLoad } from './$types'

const walkTargets = walkTargetsByLocation(theShip())

export const load: LayoutServerLoad = localizedLoad(
  async ({ cookies }: Parameters<LayoutServerLoad>[0]) => {
    const spoilerProfile = readSpoilerProfile(cookies)
    const chapterFilter = spoilerProfile
      ? { firstVisibleEvent: { chapter: { number: { lte: spoilerProfile.maxChapter } } } }
      : undefined
    const [events, locations] = await Promise.all([
      prisma.narrativeEvent.findMany({
        where: {
          occursOnBlackWhale: true,
          ...(spoilerProfile ? { chapter: { number: { lte: spoilerProfile.maxChapter } } } : {}),
        },
        orderBy: [{ chapter: { number: 'asc' } }, { sequence: 'asc' }],
        select: {
          id: true,
          chapterId: true,
          sequence: true,
          ordinal: true,
          title: true,
          isFlashback: true,
          occurredAtLabel: true,
          chapter: { select: { number: true } },
        },
      }),
      prisma.location.findMany({ where: chapterFilter }),
    ])

    return {
      events: trimEventsForTimeline(events),
      locations: trimWorldStateForMap({ locations }).locations,
      walkTargets,
      spoilerLimit: spoilerProfile?.maxChapter ?? null,
    }
  },
)
