import { prisma } from '$lib/server/db'
import { readSpoilerLimit } from '$lib/server/spoiler'
import { resolveReconstructionSources } from '$lib/reconstruction/sourceView'
import { buildReconstructionClaimIndex } from '$lib/reconstruction/claimIndex'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ cookies }) => {
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

    const eventIds = chapters.flatMap((chapter) => chapter.events.map((event) => event.id))
    const [worldEvents, presences, locations, participations, participantCharacters] =
      await Promise.all([
        prisma.worldEventRecord.findMany({
          where: {
            branchId: 'canon',
            ...(maxChapter !== undefined ? { chapterNumber: { lte: maxChapter } } : {}),
          },
          orderBy: { ordinal: 'asc' },
        }),
        prisma.presence.findMany({
          where: {
            entityType: 'BODY',
          },
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
          select: {
            id: true,
            slug: true,
            name: true,
            type: true,
            parentLocationId: true,
            firstVisibleEventId: true,
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

    const referencedSourceIds = [
      ...worldEvents.flatMap((event) => event.sourceIds),
      ...presences.flatMap((presence) => presence.sources.map((source) => source.id)),
    ]
    const sourceRecords = referencedSourceIds.length
      ? await prisma.source.findMany({
          where: { id: { in: [...new Set(referencedSourceIds)] } },
          select: { id: true, chapterNumber: true, page: true, description: true },
        })
      : []
    const sources = resolveReconstructionSources(referencedSourceIds, sourceRecords)
    const claimIndex = buildReconstructionClaimIndex(presences, worldEvents)

    const locationSlugs = Object.fromEntries(
      locations.map((location) => [location.id, location.slug]),
    )

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
    for (const presence of presences) {
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
      chapters,
      worldEvents,
      presences,
      sceneCharacters,
      locationSlugs,
      locations,
      sources,
      claimIndex,
      spoilerLimit: maxChapter,
    }
  } catch (err: unknown) {
    console.error('Failed to load reconstruction:', err)
    const message = err instanceof Error ? err.message : String(err)
    return {
      error: message,
      chapters: [],
      worldEvents: [],
      presences: [],
      sceneCharacters: [],
      locationSlugs: {},
      locations: [],
      sources: [],
      claimIndex: { claims: [], byEvent: {} },
      spoilerLimit: maxChapter,
    }
  }
}
