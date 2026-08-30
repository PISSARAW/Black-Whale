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
  type AbilityRecord,
  type CatalogCharacterRecord,
} from '$lib/server/character-profile'
import {
  appendApparentBodyTimeline,
  buildChapterTrajectory,
  buildLocationPaths,
  buildTimeline,
  type CatalogChapter,
  type CatalogTimelineCharacter,
  type LocationRecord,
} from '$lib/server/character-timeline'

interface ProphecyRecord {
  id: string
  subjectId: string
  subjectName: string
  desire: string
  poem: string[]
  blank?: boolean
  reading: string
  foretells: string
  horizon: string
  canonStatus: string
}

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
    readDataFile<Array<CatalogCharacterRecord & CatalogTimelineCharacter>>(
      'characters/characters.json',
    ),
    readDataFile<CatalogChapter[]>('chapters/chapters.json'),
    readDataFile<LocationRecord[]>('locations/locations.json'),
    readDataFile<AbilityRecord[]>('abilities/abilities.json'),
    readDataFile<ProphecyRecord[]>('prophecies/prophecies.json'),
  ])
  const locationPaths = buildLocationPaths(locations)
  const jsonCharacter = characters.find((candidate) => candidate.id === params.slug)

  if (!jsonCharacter) throw error(404, 'Character not found')

  const firstVisibleChapterNumber = readFirstAppearanceChapter(jsonCharacter)
  if (
    spoilerLimit !== null &&
    firstVisibleChapterNumber !== null &&
    firstVisibleChapterNumber > spoilerLimit
  ) {
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
  if (spoilerLimit !== null)
    timeline = timeline.filter((entry) => entry.chapter === null || entry.chapter <= spoilerLimit)
  let chapterTrajectory = buildChapterTrajectory({
    timeline,
    character,
    jsonCharacter,
    chapters,
    locationPaths,
  })
  if (spoilerLimit !== null)
    chapterTrajectory = chapterTrajectory.filter((entry) => entry.chapter <= spoilerLimit)

  // Prophecies carry no chapter anchor, so the spoiler limit cannot filter them;
  // the sheet ships collapsed on the page instead of being withheld here.
  const prophecy = prophecies.find((sheet) => sheet.subjectId === params.slug) ?? null

  // The catalogue's own chapter list is a chronology like any other: past the
  // cap it is hidden, exactly as the timeline above is.
  const profile = buildCharacterProfile(jsonCharacter, abilities, firstVisibleChapterNumber)
  if (spoilerLimit !== null) {
    profile.mangaAppearances = profile.mangaAppearances.filter(
      (appearance) => appearance.chapter <= spoilerLimit,
    )
  }

  return {
    character: profile,
    prophecy,
    roleHistory: buildRoleHistory(character, spoilerLimit),
    affiliations: buildAffiliations(character, spoilerLimit),
    timeline,
    chapterTrajectory,
  }
}
