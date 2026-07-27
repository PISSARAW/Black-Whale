import { prisma } from '$lib/server/db'
import { buildPerspective, comparePerspectives } from '$lib/server/perspectives'
import { readSpoilerProfile } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'
import { filterVisible } from '@black-whale/spoiler-engine'

export const load: PageServerLoad = async ({ cookies, url }) => {
  const spoilerProfile = readSpoilerProfile(cookies)
  const maxChapter = spoilerProfile?.maxChapter

  // Load all characters
  let characters = await prisma.character.findMany({
    orderBy: { canonicalName: 'asc' },
    include: { firstVisibleEvent: { include: { chapter: true } } },
  })

  if (spoilerProfile) {
    characters = filterVisible(characters as any, spoilerProfile) as any
  }

  // Load all events with their chapters
  const events = await prisma.narrativeEvent.findMany({
    where: {
      occursOnBlackWhale: true,
      ...(maxChapter !== undefined ? { chapter: { number: { lte: maxChapter } } } : {}),
    },
    orderBy: [{ chapter: { number: 'asc' } }, { sequence: 'asc' }],
    include: {
      chapter: true,
    },
  })

  // Parse queries
  const eventId = url.searchParams.get('eventId')
  const leftCharacterId = url.searchParams.get('left')
  const rightCharacterId = url.searchParams.get('right')

  let leftPerspective = null
  let rightPerspective = null
  let comparison = null

  if (eventId && leftCharacterId) {
    try {
      leftPerspective = await buildPerspective(leftCharacterId, eventId)

      if (rightCharacterId) {
        rightPerspective = await buildPerspective(rightCharacterId, eventId)
        comparison = await comparePerspectives(leftCharacterId, rightCharacterId, eventId)
      }
    } catch (e) {
      console.error('Failed to build perspective data', e)
    }
  }

  return {
    characters,
    events,
    eventId,
    leftCharacterId,
    rightCharacterId,
    leftPerspective,
    rightPerspective,
    comparison,
  }
}
