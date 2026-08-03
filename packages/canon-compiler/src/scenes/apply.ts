import type {
  BodyStateType,
  ParticipationType,
  PresencePrecision,
  PrismaClient,
} from '@prisma/client'
import { requiredCharacter, requiredEvent, requiredLocation } from '../identity/writes.js'

/**
 * A chapter's world state, declared rather than performed.
 *
 * `backfill_chapter_415.mjs` and its twin were two hundred and seventy lines of
 * `await` each, and what they actually said was small: who takes part in which
 * scene, where the scene happens, who ends up in which room, who stops being
 * alive. Declaring that and applying it once means the next chapter is a table
 * entry instead of a new script.
 *
 * Every id below is the one the previous scripts used. They are not cosmetic:
 * changing one would lay a second copy of the row beside the first in every
 * database that has already run the old script.
 */

export interface SceneMove {
  slug: string
  location: string
  /** The row id, kept exactly as the original scripts wrote it. */
  id: string
  precision?: PresencePrecision
}

export interface Scene {
  /** The narrative event's title; it has to exist already. */
  event: string
  /** Where the scene happens, written onto the event itself. */
  location?: string
  participants: ReadonlyArray<readonly [string, ParticipationType]>
  moves?: readonly SceneMove[]
  /** A body that stops being what it was — killed, wounded — during this scene. */
  bodyStates?: ReadonlyArray<{ slug: string; state: BodyStateType; id: string }>
}

export interface ChapterScenes {
  chapter: number
  /** Prefix of every participation id this chapter writes. */
  idPrefix: string
  scenes: readonly Scene[]
  /**
   * Rows a previous version of this chapter's script wrote and got wrong.
   *
   * Kept because production has already run those versions: dropping the repair
   * would leave the bad rows aboard forever. They can go once every database
   * has replayed this pass.
   */
  retiredPresenceIds?: readonly string[]
  repair?: (prisma: PrismaClient) => Promise<void>
}

/**
 * Move a body into a room, closing whatever it was still doing.
 *
 * Everything the body currently holds open ends here — a scene puts someone in
 * one place, and leaving the previous record open would draw them in two rooms
 * at once for every event after this one.
 */
async function moveBody({
  prisma,
  move,
  scene,
}: {
  prisma: PrismaClient
  move: SceneMove
  scene: { bodyId: string; locationId: string; eventId: string }
}): Promise<void> {
  await prisma.presence.updateMany({
    where: { entityId: scene.bodyId, untilEventId: null, id: { not: move.id } },
    data: { untilEventId: scene.eventId },
  })
  const shape = {
    entityType: 'BODY' as const,
    entityId: scene.bodyId,
    locationId: scene.locationId,
    fromEventId: scene.eventId,
    precision: move.precision ?? ('EXACT_ROOM' as const),
    certainty: 'CONFIRMED' as const,
  }
  await prisma.presence.upsert({
    where: { id: move.id },
    update: { ...shape, untilEventId: null },
    create: { id: move.id, ...shape },
  })
}

/** A body state that supersedes whatever was open — a death, a wound. */
async function setBodyState({
  prisma,
  entry,
  scene,
}: {
  prisma: PrismaClient
  entry: { slug: string; state: BodyStateType; id: string }
  scene: { bodyId: string; eventId: string }
}): Promise<void> {
  await prisma.bodyState.updateMany({
    where: { bodyId: scene.bodyId, untilEventId: null, id: { not: entry.id } },
    data: { untilEventId: scene.eventId },
  })
  const shape = { bodyId: scene.bodyId, state: entry.state, fromEventId: scene.eventId }
  await prisma.bodyState.upsert({
    where: { id: entry.id },
    update: { ...shape, untilEventId: null },
    create: { id: entry.id, ...shape },
  })
}

export async function applyChapterScenes(
  prisma: PrismaClient,
  declaration: ChapterScenes,
): Promise<{ scenes: number; participations: number; moves: number }> {
  for (const id of declaration.retiredPresenceIds ?? []) {
    await prisma.presence.deleteMany({ where: { id } })
  }
  await declaration.repair?.(prisma)

  let participations = 0
  let moves = 0

  for (const scene of declaration.scenes) {
    const event = await requiredEvent(prisma, scene.event)
    const sequence = await prisma.narrativeEvent.findUniqueOrThrow({
      where: { id: event.id },
      select: { sequence: true },
    })

    if (scene.location) {
      const location = await requiredLocation(prisma, scene.location)
      await prisma.narrativeEvent.update({
        where: { id: event.id },
        data: { locationId: location.id },
      })
    }

    for (const [slug, participationType] of scene.participants) {
      const character = await requiredCharacter(prisma, slug)
      const id = `${declaration.idPrefix}-participation-${sequence.sequence}-${slug}`
      const shape = {
        eventId: event.id,
        participantId: character.id,
        participantType: 'CHARACTER' as const,
        participationType,
      }
      await prisma.eventParticipation.upsert({
        where: { id },
        update: shape,
        create: { id, ...shape },
      })
      participations += 1
    }

    for (const move of scene.moves ?? []) {
      const character = await requiredCharacter(prisma, move.slug)
      const location = await requiredLocation(prisma, move.location)
      await moveBody({
        prisma,
        move,
        scene: {
          bodyId: character.originalBody.id,
          locationId: location.id,
          eventId: event.id,
        },
      })
      moves += 1
    }

    for (const entry of scene.bodyStates ?? []) {
      const character = await requiredCharacter(prisma, entry.slug)
      await setBodyState({
        prisma,
        entry,
        scene: { bodyId: character.originalBody.id, eventId: event.id },
      })
    }
  }

  return { scenes: declaration.scenes.length, participations, moves }
}
