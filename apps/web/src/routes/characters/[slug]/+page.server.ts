import { prisma } from '$lib/server/db'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { readDataFile } from '$lib/server/data-files'
import { readSpoilerLimit } from '$lib/server/spoiler'

import {
  buildAffiliations,
  buildCharacterProfile,
  buildRoleHistory,
  readFirstAppearanceChapter,
} from '$lib/server/character-profile'
import {
  appendApparentBodyTimeline,
  buildChapterTrajectory,
  buildLocationPaths,
  buildTimeline,
} from '$lib/server/character-timeline'

const eventInclude = { include: { chapter: true } } as const

const bodyInclude = {
  presences: {
    include: { fromEvent: eventInclude, untilEvent: eventInclude, location: true },
    orderBy: { fromEvent: { sequence: 'asc' as const } },
  },
  states: {
    include: { fromEvent: eventInclude, untilEvent: eventInclude },
    orderBy: { fromEvent: { sequence: 'asc' as const } },
  },
}

const characterInclude = {
  firstVisibleEvent: eventInclude,
  roles: {
    include: { fromEvent: eventInclude, untilEvent: eventInclude },
    orderBy: { fromEvent: { sequence: 'asc' as const } },
  },
  assignments: {
    include: { fromEvent: eventInclude, untilEvent: eventInclude },
    orderBy: { fromEvent: { sequence: 'asc' as const } },
  },
  affiliations: {
    include: { faction: true, fromEvent: eventInclude, untilEvent: eventInclude },
    orderBy: { fromEvent: { sequence: 'asc' as const } },
  },
  originalBody: { include: bodyInclude },
  originalConsciousness: {
    include: {
      states: {
        include: { fromEvent: eventInclude, untilEvent: eventInclude },
        orderBy: { fromEvent: { sequence: 'asc' as const } },
      },
      occupancies: {
        include: {
          fromEvent: eventInclude,
          untilEvent: eventInclude,
          body: { include: { character: true, ...bodyInclude } },
        },
        orderBy: { fromEvent: { sequence: 'asc' as const } },
      },
    },
  },
} as const

export const load: PageServerLoad = async ({ params, cookies }) => {
  const spoilerLimit = readSpoilerLimit(cookies) ?? null
  const [characters, chapters, locations, abilities, prophecies] = await Promise.all([
    readDataFile<any[]>('characters/characters.json'),
    readDataFile<any[]>('chapters/chapters.json'),
    readDataFile<any[]>('locations/locations.json'),
    readDataFile<any[]>('abilities/abilities.json'),
    readDataFile<any[]>('prophecies/prophecies.json'),
  ])
  const locationPaths = buildLocationPaths(locations)
  const jsonCharacter = characters.find((candidate: any) => candidate.id === params.slug)

  if (!jsonCharacter) throw error(404, 'Character not found')

  const firstVisibleChapterNumber = readFirstAppearanceChapter(jsonCharacter)
  if (spoilerLimit && firstVisibleChapterNumber && firstVisibleChapterNumber > spoilerLimit) {
    throw error(404, 'Character not found')
  }

  let character = await prisma.character.findUnique({
    where: { slug: params.slug },
    include: characterInclude,
  })

  // Some catalogue entries and legacy seed records use different slugs.
  if (!character?.originalBody) {
    const matches = await prisma.character.findMany({
      where: { canonicalName: jsonCharacter.canonicalName },
      include: characterInclude,
    })
    character = matches.find((candidate) => candidate.originalBody) || matches[0] || null
  }

  let timeline = buildTimeline(character, jsonCharacter, locationPaths)
  if (character) {
    const apparentBodies = await prisma.appearanceState.findMany({
      where: { appearanceCharacterId: character.id },
      include: {
        fromEvent: eventInclude,
        untilEvent: eventInclude,
        body: { include: bodyInclude },
      },
    })
    timeline = appendApparentBodyTimeline(timeline, apparentBodies, locationPaths)
  }
  if (spoilerLimit)
    timeline = timeline.filter((entry) => entry.chapter === null || entry.chapter <= spoilerLimit)
  let chapterTrajectory = buildChapterTrajectory(
    timeline,
    character,
    jsonCharacter,
    chapters,
    locationPaths,
  )
  if (spoilerLimit)
    chapterTrajectory = chapterTrajectory.filter((entry) => entry.chapter <= spoilerLimit)

  // Prophecies carry no chapter anchor, so the spoiler limit cannot filter them;
  // the sheet ships collapsed on the page instead of being withheld here.
  const prophecy = prophecies.find((sheet: any) => sheet.subjectId === params.slug) ?? null

  return {
    character: buildCharacterProfile(jsonCharacter, abilities, firstVisibleChapterNumber),
    prophecy,
    roleHistory: buildRoleHistory(character),
    affiliations: buildAffiliations(character),
    timeline,
    chapterTrajectory,
  }
}
