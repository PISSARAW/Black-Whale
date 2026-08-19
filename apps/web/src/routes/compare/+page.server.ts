import { resolveComparisonSelection } from '$lib/server/compare-selection'
import { prisma } from '$lib/server/db'
import { buildPerspective, comparePerspectives } from '$lib/server/perspectives'
import { readSpoilerProfile } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'
import { filterVisible } from '@black-whale/canon-engine'
import { buildCanonicalPositions } from '@black-whale/canon-engine'
import { timeline } from '$lib/server/timeline'
import { error } from '@sveltejs/kit'
import { PUBLIC_FEATURES } from '$lib/config/features'
import { log, describeError } from '$lib/server/log'

export const load: PageServerLoad = async ({ cookies, url }) => {
  if (!PUBLIC_FEATURES.compare) throw error(404, 'Not found')

  const spoilerProfile = readSpoilerProfile(cookies)
  const maxChapter = spoilerProfile?.maxChapter

  let characters = await prisma.character.findMany({
    orderBy: { canonicalName: 'asc' },
    include: { firstVisibleEvent: { include: { chapter: true } } },
  })

  if (spoilerProfile) {
    characters = filterVisible(characters, spoilerProfile)
  }

  const events = await prisma.narrativeEvent.findMany({
    where: {
      occursOnBlackWhale: true,
      ...(maxChapter !== undefined ? { chapter: { number: { lte: maxChapter } } } : {}),
    },
    orderBy: [{ chapter: { number: 'asc' } }, { sequence: 'asc' }],
    include: { chapter: true },
  })

  const defaultEvent = events[events.length - 1]
  const { selectedEventId, selectedLeft, selectedRight, compareCanonical, sync } =
    resolveComparisonSelection(url.searchParams, { characters, events })

  let leftPerspective: Awaited<ReturnType<typeof buildPerspective>> | null = null
  let rightPerspective: Awaited<ReturnType<typeof buildPerspective>> | null = null
  let comparison: Awaited<ReturnType<typeof comparePerspectives>> = []

  if (selectedEventId && selectedLeft && selectedRight) {
    try {
      ;[leftPerspective, rightPerspective, comparison] = await Promise.all([
        buildPerspective(selectedLeft, selectedEventId, maxChapter),
        buildPerspective(selectedRight, selectedEventId, maxChapter),
        comparePerspectives(selectedLeft, selectedRight, selectedEventId, maxChapter),
      ])
    } catch (error) {
      log.error('Failed to build perspective comparison', describeError(error))
    }
  }

  let worldState:
    | (Omit<Awaited<ReturnType<typeof timeline.getWorldState>>, 'locations'> & {
        locations: Awaited<ReturnType<typeof prisma.location.findMany>>
      })
    | null = null
  let selectedEventSequence = defaultEvent?.sequence
  let selectedEventChapter = defaultEvent?.chapter?.number
  let canonicalTruth: {
    facts: Awaited<ReturnType<typeof prisma.fact.findMany>>
    positions: ReturnType<typeof buildCanonicalPositions>
    chapter: number | null
    restrictedBySpoiler: number | null
  } = {
    facts: [],
    positions: {},
    chapter: selectedEventChapter || null,
    restrictedBySpoiler: spoilerProfile?.maxChapter ?? null,
  }

  if (selectedEventId) {
    const selectedEvent = events.find((event) => event.id === selectedEventId)
    selectedEventSequence = selectedEvent?.sequence ?? selectedEventSequence
    selectedEventChapter = selectedEvent?.chapter?.number ?? selectedEventChapter

    if (selectedEventSequence !== undefined) {
      const rawWorld = await timeline.getWorldState({ eventId: selectedEventId })
      const locations = await prisma.location.findMany({
        where:
          maxChapter === undefined
            ? undefined
            : { firstVisibleEvent: { chapter: { number: { lte: maxChapter } } } },
      })
      worldState = {
        ...rawWorld,
        locations,
      }

      if (compareCanonical) {
        const objectiveFacts = await prisma.fact.findMany({
          where: {
            fromEvent: {
              sequence: { lte: selectedEventSequence },
            },
            OR: [
              { validUntilEventId: null },
              {
                untilEvent: {
                  sequence: { gt: selectedEventSequence },
                },
              },
            ],
          },
        })

        canonicalTruth = {
          facts: objectiveFacts,
          positions: buildCanonicalPositions(rawWorld),
          chapter: selectedEventChapter || null,
          restrictedBySpoiler: spoilerProfile?.maxChapter ?? null,
        }
      }
    }
  }

  return {
    characters,
    events,
    selectedEventId,
    selectedLeft,
    selectedRight,
    leftPerspective,
    rightPerspective,
    comparison,
    compareCanonical,
    canonicalTruth,
    worldState,
    sync,
    spoilerLimit: spoilerProfile?.maxChapter ?? null,
  }
}
