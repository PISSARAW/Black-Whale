import { localizedLoad } from '$lib/server/localized-load'
import { prisma } from '$lib/server/db'
import { readSpoilerLimit } from '$lib/server/spoiler'
import { resolveReconstructionSources } from '$lib/reconstruction/sourceView'
import { sourceIdsByEvent } from '$lib/reconstruction/eventSources'
import {
  capPresenceEnds,
  locationSpoilerWhere,
  presenceSpoilerWhere,
  worldEventSpoilerWhere,
} from '$lib/reconstruction/serverProjection'
import { catalogSceneLocation, type CatalogChapterScenes } from '$lib/reconstruction/sceneLocation'
import { readDataFile } from '$lib/server/data-files'
import type { PageServerLoad } from './$types'
import { log, describeError } from '$lib/server/log'

export const load: PageServerLoad = localizedLoad(
  async ({ cookies }: Parameters<PageServerLoad>[0]) => {
    const maxChapter = readSpoilerLimit(cookies)

    try {
      const chapters = await prisma.chapter.findMany({
        where: {
          ...(maxChapter !== undefined ? { number: { lte: maxChapter } } : {}),
          events: { some: { occursOnBlackWhale: true } },
        },
        orderBy: { number: 'asc' },
        include: {
          events: {
            where: { occursOnBlackWhale: true },
            orderBy: { sequence: 'asc' },
          },
        },
      })

      const catalogChapters = await readDataFile<CatalogChapterScenes[]>('chapters/chapters.json')
      const eventIds = chapters.flatMap((chapter) => chapter.events.map((event) => event.id))
      const [worldEvents, presences, locations, participations, participantCharacters] =
        await Promise.all([
          prisma.worldEventRecord.findMany({
            where: worldEventSpoilerWhere(maxChapter),
            orderBy: { ordinal: 'asc' },
          }),
          prisma.presence.findMany({
            where: presenceSpoilerWhere(maxChapter),
            select: {
              id: true,
              entityId: true,
              locationId: true,
              precision: true,
              certainty: true,
              sources: {
                select: { id: true, chapterNumber: true, page: true, description: true },
              },
              body: {
                select: {
                  label: true,
                  character: { select: { id: true, canonicalName: true } },
                },
              },
              fromEvent: {
                select: {
                  id: true,
                  ordinal: true,
                  sequence: true,
                  chapter: { select: { number: true } },
                },
              },
              untilEvent: {
                select: {
                  id: true,
                  ordinal: true,
                  sequence: true,
                  chapter: { select: { number: true } },
                },
              },
            },
          }),
          prisma.location.findMany({
            where: locationSpoilerWhere(maxChapter),
            select: {
              id: true,
              slug: true,
              name: true,
              type: true,
              parentLocationId: true,
              mapElementId: true,
            },
          }),
          prisma.eventParticipation.findMany({
            where: {
              eventId: { in: eventIds },
              participantType: { in: ['CHARACTER', 'BODY'] },
            },
            select: {
              eventId: true,
              participantId: true,
              participantType: true,
              participationType: true,
            },
          }),
          prisma.character.findMany({
            select: {
              id: true,
              canonicalName: true,
              originalBody: { select: { id: true } },
            },
          }),
        ])

      const visiblePresenceRows = capPresenceEnds(presences, maxChapter)
      const referencedSourceIds = [
        ...worldEvents.flatMap((event) => event.sourceIds),
        ...visiblePresenceRows.flatMap((presence) => presence.sources.map((source) => source.id)),
      ]
      const sourceRecords = referencedSourceIds.length
        ? await prisma.source.findMany({
            where: { id: { in: [...new Set(referencedSourceIds)] } },
            select: { id: true, chapterNumber: true, page: true, description: true },
          })
        : []
      const sources = resolveReconstructionSources(referencedSourceIds, sourceRecords)
      const eventSourceIds = sourceIdsByEvent(chapters, worldEvents, visiblePresenceRows)

      const locationSlugs = Object.fromEntries(
        locations.map((location) => [location.id, location.slug]),
      )
      const locationIds = new Map(locations.map((location) => [location.slug, location.id]))
      const locatedChapters = chapters.map((chapter) => ({
        ...chapter,
        events: chapter.events.map((event) => {
          if (event.locationId) return event
          const slug = catalogSceneLocation({
            chapterNumber: chapter.number,
            eventTitle: event.title,
            chapters: catalogChapters,
          })
          return { ...event, locationId: slug ? (locationIds.get(slug) ?? null) : null }
        }),
      }))

      const byCharacterId = new Map(
        participantCharacters.map((character) => [character.id, character]),
      )
      const byBodyId = new Map(
        participantCharacters
          .filter((character) => character.originalBody)
          .map((character) => [character.originalBody!.id, character]),
      )
      const sceneCharacters = participations.flatMap((participation) => {
        const character =
          participation.participantType === 'BODY'
            ? byBodyId.get(participation.participantId)
            : byCharacterId.get(participation.participantId)
        return character?.originalBody
          ? [
              {
                eventId: participation.eventId,
                characterId: character.id,
                bodyId: character.originalBody.id,
                canonicalName: character.canonicalName,
                participationType: participation.participationType,
              },
            ]
          : []
      })

      // A movement beginning with the event is direct evidence that the person
      // is in the scene even when its older participation row has not yet been
      // backfilled. Merge those records without duplicating explicit cast data.
      const sceneCharacterKeys = new Set(
        sceneCharacters.map((character) => `${character.eventId}:${character.characterId}`),
      )
      for (const presence of visiblePresenceRows) {
        const character = presence.body?.character
        if (!character) continue
        const key = `${presence.fromEvent.id}:${character.id}`
        if (sceneCharacterKeys.has(key)) continue
        sceneCharacterKeys.add(key)
        sceneCharacters.push({
          eventId: presence.fromEvent.id,
          characterId: character.id,
          bodyId: presence.entityId,
          canonicalName: character.canonicalName,
          participationType: 'ACTIVE',
        })
      }

      return {
        chapters: locatedChapters,
        worldEvents,
        presences: visiblePresenceRows,
        sceneCharacters,
        locationSlugs,
        locations,
        sources,
        sourceIdsByEvent: eventSourceIds,
        spoilerLimit: maxChapter,
      }
    } catch (err: unknown) {
      // The details stay in the log: Prisma and engine messages name tables,
      // columns and internals no visitor should read.
      log.error('Failed to load reconstruction:', describeError(err))
      return {
        error: 'reconstruction-unavailable',
        chapters: [],
        worldEvents: [],
        presences: [],
        sceneCharacters: [],
        locationSlugs: {},
        locations: [],
        sources: [],
        sourceIdsByEvent: {} as Record<string, string[]>,
        spoilerLimit: maxChapter,
      }
    }
  },
)
