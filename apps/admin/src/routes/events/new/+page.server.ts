import { getPrisma } from '$lib/server/db'
import { fail, redirect } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import type { Prisma } from '@black-whale/database'

const presencePrecisions = ['EXACT_ROOM', 'ZONE', 'TIER', 'UNKNOWN'] as const
const presenceCertainties = ['CONFIRMED', 'PROBABLE', 'LAST_KNOWN'] as const

function isPresencePrecision(value: string): value is (typeof presencePrecisions)[number] {
  return presencePrecisions.includes(value as (typeof presencePrecisions)[number])
}

function isPresenceCertainty(value: string): value is (typeof presenceCertainties)[number] {
  return presenceCertainties.includes(value as (typeof presenceCertainties)[number])
}

export const load: PageServerLoad = async () => {
  const prisma = await getPrisma()
  const chapters = await prisma.chapter.findMany({ orderBy: { number: 'asc' } })
  const characters = await prisma.character.findMany({ orderBy: { canonicalName: 'asc' } })
  const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } })
  const events = await prisma.narrativeEvent.findMany({
    include: { chapter: true },
    orderBy: [{ ordinal: 'asc' }, { chapter: { number: 'asc' } }, { sequence: 'asc' }],
  })

  return { chapters, characters, locations, events }
}

interface EventReferences {
  chapterId: string
  occursBeforeEventId: string | null
  /** The consequence ids, present only when the form asks for a presence. */
  consequence: { characterId: string; locationId: string } | null
}

/** The error message for the first dangling reference, or null when all resolve. */
async function missingReference(
  prisma: Prisma.TransactionClient,
  refs: EventReferences,
): Promise<string | null> {
  if (!(await prisma.chapter.findUnique({ where: { id: refs.chapterId }, select: { id: true } }))) {
    return 'Unknown chapter.'
  }
  if (
    refs.occursBeforeEventId &&
    !(await prisma.narrativeEvent.findUnique({
      where: { id: refs.occursBeforeEventId },
      select: { id: true },
    }))
  ) {
    return 'The occurrence anchor event does not exist.'
  }
  if (!refs.consequence) return null
  if (
    !(await prisma.character.findUnique({
      where: { id: refs.consequence.characterId },
      select: { id: true },
    }))
  ) {
    return 'Unknown character for the consequence.'
  }
  if (
    !(await prisma.location.findUnique({
      where: { id: refs.consequence.locationId },
      select: { id: true },
    }))
  ) {
    return 'Unknown location for the consequence.'
  }
  return null
}

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData()
    const prisma = await getPrisma()

    const chapterId = data.get('chapterId')?.toString()
    const sequence = parseInt(data.get('sequence')?.toString() || '0')
    const title = data.get('title')?.toString()
    const summary = data.get('summary')?.toString()
    const isFlashback = data.get('temporalMode')?.toString() === 'flashback'
    const occursBeforeEventId = data.get('occursBeforeEventId')?.toString() || null
    const occurredAtLabel = data.get('occurredAtLabel')?.toString().trim() || null

    // Consequence data
    const characterId = data.get('characterId')?.toString()
    const locationId = data.get('locationId')?.toString()
    const precisionValue = data.get('precision')?.toString() || ''
    const certaintyValue = data.get('certainty')?.toString() || ''
    const precision = isPresencePrecision(precisionValue) ? precisionValue : null
    const certainty = isPresenceCertainty(certaintyValue) ? certaintyValue : null

    if (!chapterId || !title || !summary || Number.isNaN(sequence) || sequence < 0) {
      return fail(400, { error: 'Missing required event fields' })
    }
    if (isFlashback && !occursBeforeEventId) {
      return fail(400, { error: 'A flashback must be placed before a known event.' })
    }

    // Referenced rows are checked up front: letting a dangling id reach Prisma
    // would turn a typo into a foreign-key error and a generic 500.
    const referenceError = await missingReference(prisma, {
      chapterId,
      occursBeforeEventId,
      consequence:
        characterId && locationId && precision && certainty ? { characterId, locationId } : null,
    })
    if (referenceError) return fail(400, { error: referenceError })

    try {
      // Run everything in a transaction
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Create the event
        const event = await tx.narrativeEvent.create({
          data: {
            chapterId,
            sequence,
            title,
            summary,
            isFlashback,
            occurredAtLabel,
          },
          include: { chapter: true },
        })

        // Rebuild the occurrence order. Chapter/sequence remain the reading order;
        // ordinal is the actual chronology aboard the ship.
        const existingEvents = await tx.narrativeEvent.findMany({
          where: { id: { not: event.id } },
          include: { chapter: true },
        })
        existingEvents.sort(
          (left, right) =>
            (left.ordinal ?? Number.MAX_SAFE_INTEGER) -
              (right.ordinal ?? Number.MAX_SAFE_INTEGER) ||
            left.chapter.number - right.chapter.number ||
            left.sequence - right.sequence,
        )
        const insertionIndex = occursBeforeEventId
          ? existingEvents.findIndex((candidate) => candidate.id === occursBeforeEventId)
          : existingEvents.length
        if (occursBeforeEventId && insertionIndex < 0)
          throw new Error('Occurrence anchor not found')
        const chronologicalEvents = [...existingEvents]
        chronologicalEvents.splice(insertionIndex, 0, event)
        await tx.narrativeEvent.updateMany({ data: { ordinal: null } })
        for (const [ordinal, chronologicalEvent] of chronologicalEvents.entries()) {
          await tx.narrativeEvent.update({
            where: { id: chronologicalEvent.id },
            data: { ordinal },
          })
        }

        // 2. Handle consequences if provided
        if (characterId && locationId && precision && certainty) {
          // 2a. Find the original body of the character
          const originalBody = await tx.body.findFirst({
            where: { originalCharacterId: characterId, bodyType: 'ORIGINAL' },
          })

          if (originalBody) {
            const presences = await tx.presence.findMany({
              where: { entityId: originalBody.id },
              include: { fromEvent: true, untilEvent: true },
            })
            presences.sort(
              (left, right) =>
                (left.fromEvent.ordinal ?? Number.MAX_SAFE_INTEGER) -
                (right.fromEvent.ordinal ?? Number.MAX_SAFE_INTEGER),
            )
            const eventOrdinal = chronologicalEvents.findIndex(
              (candidate) => candidate.id === event.id,
            )
            const previousPresence = presences.findLast(
              (presence) =>
                (presence.fromEvent.ordinal ?? Number.MAX_SAFE_INTEGER) < eventOrdinal &&
                (!presence.untilEvent ||
                  (presence.untilEvent.ordinal ?? Number.MAX_SAFE_INTEGER) > eventOrdinal),
            )
            const nextPresence = presences.find(
              (presence) => (presence.fromEvent.ordinal ?? Number.MAX_SAFE_INTEGER) > eventOrdinal,
            )

            if (previousPresence) {
              await tx.presence.update({
                where: { id: previousPresence.id },
                data: { untilEventId: event.id },
              })
            }

            // 2d. Create the new presence
            await tx.presence.create({
              data: {
                entityType: 'BODY',
                entityId: originalBody.id,
                locationId: locationId,
                fromEventId: event.id,
                untilEventId: nextPresence?.fromEventId || null,
                precision,
                certainty,
              },
            })
          }
        }
      })
    } catch (err) {
      console.error('Error creating event:', err)
      return fail(500, { error: 'Internal server error while creating event' })
    }

    redirect(303, '/events')
  },
}
