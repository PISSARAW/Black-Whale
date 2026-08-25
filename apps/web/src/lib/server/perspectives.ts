import { IdentityEngine } from '@black-whale/canon-engine'
import { KnowledgeEngine } from '@black-whale/canon-engine'
import { PerspectiveEngine } from '@black-whale/canon-engine'
import { prisma } from './db'

export const perspectiveEngine = new PerspectiveEngine(
  prisma,
  new IdentityEngine(prisma),
  new KnowledgeEngine(prisma),
)

/**
 * Build a character's view of the world at an event. `spoilerLimit` is the
 * reader's own cap, not the character's; omit it to reveal everything the
 * character knows.
 */
export async function buildPerspective(
  observerCharacterId: string,
  eventId: string,
  spoilerLimit?: number,
) {
  const perspective = await perspectiveEngine.buildPerspective({
    observerCharacterId,
    eventId,
    spoilerLimit: spoilerLimit ?? Number.POSITIVE_INFINITY,
  })

  return { observerId: observerCharacterId, eventId, mode: 'character' as const, ...perspective }
}

/** The points on which two characters' views of the same event diverge.
 *
 * `spoilerLimit` caps both sides like `buildPerspective` does. It used to be
 * accepted from call sites and silently dropped — TypeScript caught the arity,
 * but JavaScript ignored it, so the comparison listed facts and beliefs past
 * the reader's cap while everything else on the page respected it.
 */
export async function comparePerspectives(input: {
  leftId: string
  rightId: string
  eventId: string
  spoilerLimit?: number
}) {
  const limit = input.spoilerLimit ?? Number.POSITIVE_INFINITY
  return perspectiveEngine.comparePerspectives(
    { observerCharacterId: input.leftId, eventId: input.eventId, spoilerLimit: limit },
    { observerCharacterId: input.rightId, eventId: input.eventId, spoilerLimit: limit },
  )
}
