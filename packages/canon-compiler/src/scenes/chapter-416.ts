import type { PrismaClient } from '@prisma/client'
import { requiredCharacter, requiredEvent } from '../identity/writes.js'
import type { ChapterScenes } from './apply.js'

/** Everyone taken down to the VIP jail when Benjamin confronts Camilla. */
const DETAINED = ['prince-benjamin', 'prince-camilla', 'furykov', 'butch', 'mozbe', 'fukataki']

/**
 * A previous version of this chapter's script closed the detained camp's
 * room-1001 presence at the *breach* rather than at the confrontation, which
 * left room 1001 and the jail overlapping for the first three events of the
 * chapter. Production has run that version, so the boundary is pulled back
 * here rather than only avoided going forward.
 */
async function pullBackDetentionBoundary(prisma: PrismaClient): Promise<void> {
  const [confrontation, breach] = await Promise.all([
    requiredEvent(prisma, 'Benjamin confronts Camilla under special martial law'),
    requiredEvent(prisma, 'Benjamin breaches room 1004 and shoots Tserriednich'),
  ])
  for (const slug of DETAINED) {
    const character = await requiredCharacter(prisma, slug)
    await prisma.presence.updateMany({
      where: {
        entityId: character.originalBody.id,
        untilEventId: breach.id,
        id: { notIn: [`ch416-presence-${slug}-vip-jail`, `ch416-presence-${slug}-room1004`] },
      },
      data: { untilEventId: confrontation.id },
    })
  }
}

export const CHAPTER_416: ChapterScenes = {
  chapter: 416,
  idPrefix: 'ch416',
  // The first version of this backfill read Camilla's detention scene as room
  // 1002. It is the VIP jail.
  retiredPresenceIds: [
    ...DETAINED.map((slug) => `ch416-presence-${slug}-room1002`),
    'ch416-presence-moswana-room1002',
  ],
  repair: pullBackDetentionBoundary,
  scenes: [
    {
      event: 'Benjamin confronts Camilla under special martial law',
      location: 'tier-1-vip-jail',
      participants: [
        ['prince-benjamin', 'ACTIVE'],
        ['prince-camilla', 'ACTIVE'],
        ['furykov', 'OBSERVER'],
        ['butch', 'OBSERVER'],
        ['mozbe', 'OBSERVER'],
        ['fukataki', 'VICTIM'],
      ],
      moves: DETAINED.map((slug) => ({
        slug,
        location: 'tier-1-vip-jail',
        id: `ch416-presence-${slug}-vip-jail`,
      })),
      bodyStates: [{ slug: 'fukataki', state: 'DEAD', id: 'ch416-fukataki-dead' }],
    },
    {
      event: 'Moswana sacrifices herself and curses Benjamin',
      location: 'tier-1-vip-jail',
      participants: [
        ['moswana', 'ACTIVE'],
        ['prince-benjamin', 'VICTIM'],
        ['prince-camilla', 'OBSERVER'],
        ['furykov', 'OBSERVER'],
      ],
      moves: [
        { slug: 'moswana', location: 'tier-1-vip-jail', id: 'ch416-presence-moswana-vip-jail' },
      ],
      bodyStates: [{ slug: 'moswana', state: 'DEAD', id: 'ch416-moswana-dead' }],
    },
    {
      event: 'Tserriednich prepares Salkov to witness his false death',
      location: 'tier-1-royal-residential-sector-room-1004',
      participants: [
        ['prince-tserriednich', 'ACTIVE'],
        ['salkov', 'OBSERVER'],
      ],
      moves: ['prince-tserriednich', 'salkov', 'danjin'].map((slug) => ({
        slug,
        location: 'tier-1-royal-residential-sector-room-1004',
        id: `ch416-presence-${slug}-room1004`,
      })),
    },
    {
      event: 'Benjamin breaches room 1004 and shoots Tserriednich',
      location: 'tier-1-royal-residential-sector-room-1004',
      participants: [
        ['prince-benjamin', 'ACTIVE'],
        ['prince-tserriednich', 'VICTIM'],
        ['furykov', 'ACTIVE'],
        ['butch', 'ACTIVE'],
        ['salkov', 'OBSERVER'],
        ['danjin', 'PASSIVE'],
      ],
      moves: ['prince-benjamin', 'furykov', 'butch'].map((slug) => ({
        slug,
        location: 'tier-1-royal-residential-sector-room-1004',
        id: `ch416-presence-${slug}-room1004`,
      })),
    },
  ],
}
