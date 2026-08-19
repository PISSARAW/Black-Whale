import { prisma } from '$lib/server/db'
import { buildPerspective, comparePerspectives } from '$lib/server/perspectives'
import { readSpoilerProfile } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'
import { filterVisible } from '@black-whale/canon-engine'
import { error } from '@sveltejs/kit'
import { PUBLIC_FEATURES } from '$lib/config/features'
import { log, describeError } from '$lib/server/log'

export const load: PageServerLoad = async ({ cookies, url }) => {
  if (!PUBLIC_FEATURES.perspectives) throw error(404, 'Not found')

  const spoilerProfile = readSpoilerProfile(cookies)
  const maxChapter = spoilerProfile?.maxChapter

  // Load all characters
  let characters = await prisma.character.findMany({
    orderBy: { canonicalName: 'asc' },
    include: { firstVisibleEvent: { include: { chapter: true } } },
  })

  if (spoilerProfile) {
    characters = filterVisible(characters, spoilerProfile)
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
      leftPerspective = await buildPerspective(leftCharacterId, eventId, maxChapter)

      if (rightCharacterId) {
        rightPerspective = await buildPerspective(rightCharacterId, eventId, maxChapter)
        comparison = await comparePerspectives(leftCharacterId, rightCharacterId, eventId, maxChapter)
      }
    } catch (e) {
      log.error('Failed to build perspective data', describeError(e))
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
