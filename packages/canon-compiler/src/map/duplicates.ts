import type { Prisma, PrismaClient } from '@prisma/client'
import type { Character } from '@black-whale/contracts'

/**
 * Reconciling the database with the catalogue before anything is written to it.
 *
 * The seed and the catalogue both create characters, and they did not always
 * agree on a slug. What survived was two rows for one person, each holding half
 * the story — one owning the body, the other owning the abilities.
 */

/** The description `sync_hunterpedia_passengers` stamps on a template entry. */
export const GENERATED_PASSENGER_DESCRIPTION =
  'Named passenger aboard Black Whale 1. No precise position is currently documented in the local map data.'

interface DuplicateRow {
  id: string
  slug: string
  canonicalName: string
  originalBody: { id: string } | null
  originalConsciousness: { id: string } | null
}

/** Every row that names the duplicate, pointed at the survivor instead. */
function reassign(prisma: PrismaClient, from: string, to: string): Prisma.PrismaPromise<unknown>[] {
  const move = { characterId: to }
  return [
    prisma.body.updateMany({
      where: { originalCharacterId: from },
      data: { originalCharacterId: to },
    }),
    prisma.consciousness.updateMany({
      where: { originCharacterId: from },
      data: { originCharacterId: to },
    }),
    prisma.affiliationMembership.updateMany({ where: { characterId: from }, data: move }),
    prisma.characterRole.updateMany({ where: { characterId: from }, data: move }),
    prisma.characterAssignment.updateMany({ where: { characterId: from }, data: move }),
    prisma.characterAssignment.updateMany({
      where: { assignedPrinceId: from },
      data: { assignedPrinceId: to },
    }),
    prisma.nenAbility.updateMany({ where: { ownerId: from }, data: { ownerId: to } }),
    prisma.knowledgeState.updateMany({
      where: { observerCharacterId: from },
      data: { observerCharacterId: to },
    }),
    prisma.knowledgeState.updateMany({
      where: { sourceCharacterId: from },
      data: { sourceCharacterId: to },
    }),
    prisma.belief.updateMany({
      where: { observerCharacterId: from },
      data: { observerCharacterId: to },
    }),
    prisma.belief.updateMany({
      where: { subjectType: 'CHARACTER', subjectId: from },
      data: { subjectId: to },
    }),
    prisma.fact.updateMany({
      where: { subjectType: 'CHARACTER', subjectId: from },
      data: { subjectId: to },
    }),
    prisma.eventParticipation.updateMany({
      where: { participantType: 'CHARACTER', participantId: from },
      data: { participantId: to },
    }),
    prisma.faction.updateMany({ where: { leaderId: from }, data: { leaderId: to } }),
    prisma.character.delete({ where: { id: from } }),
  ]
}

export interface MergeDuplicates {
  prisma: PrismaClient
  catalogue: readonly Character[]
  report: (message: string) => void
}

/**
 * Fold rows sharing a canonical name into the one the catalogue names.
 *
 * Only that one: without a catalogue entry to point at there is no way to tell
 * which of two rows is the survivor, and picking arbitrarily would move a
 * body onto a record the catalogue is about to rename again. Two rows that
 * each own a body or a consciousness are left alone and reported — merging
 * them would silently drop one identity.
 */
export async function mergeDuplicateCharacters({
  prisma,
  catalogue,
  report,
}: MergeDuplicates): Promise<number> {
  const rows: DuplicateRow[] = await prisma.character.findMany({
    select: {
      id: true,
      slug: true,
      canonicalName: true,
      originalBody: { select: { id: true } },
      originalConsciousness: { select: { id: true } },
    },
  })
  const slugByName = new Map(catalogue.map((entry) => [entry.canonicalName, entry.id]))
  const groups = new Map<string, DuplicateRow[]>()
  for (const row of rows) {
    const group = groups.get(row.canonicalName) ?? []
    group.push(row)
    groups.set(row.canonicalName, group)
  }

  let merged = 0
  for (const [canonicalName, group] of groups) {
    if (group.length < 2) continue
    const primary = group.find((row) => row.slug === slugByName.get(canonicalName))
    if (!primary) continue

    for (const duplicate of group.filter((row) => row.id !== primary.id)) {
      if (primary.originalBody && duplicate.originalBody) {
        report(`Fusion impossible pour ${duplicate.slug} : les deux fiches possèdent un corps`)
        continue
      }
      if (primary.originalConsciousness && duplicate.originalConsciousness) {
        report(
          `Fusion impossible pour ${duplicate.slug} : les deux fiches possèdent une conscience`,
        )
        continue
      }
      await prisma.$transaction(reassign(prisma, duplicate.id, primary.id))
      primary.originalBody ??= duplicate.originalBody
      primary.originalConsciousness ??= duplicate.originalConsciousness
      merged += 1
    }
  }
  return merged
}

/**
 * Drop the template passengers the catalogue no longer lists.
 *
 * `sync_hunterpedia_passengers` writes entries whose description is a fixed
 * placeholder. When one is removed from `data/` — a wiki page renamed, an entry
 * merged into a real character — its row and its identity records would
 * otherwise stay aboard forever, since nothing else claims them.
 */
export async function pruneGeneratedPassengerOrphans(
  prisma: PrismaClient,
  catalogue: readonly Character[],
): Promise<number> {
  const known = new Set(catalogue.map((entry) => entry.id))
  const generated = await prisma.character.findMany({
    where: { description: GENERATED_PASSENGER_DESCRIPTION },
    select: {
      id: true,
      slug: true,
      originalBody: { select: { id: true } },
      originalConsciousness: { select: { id: true } },
    },
  })

  let pruned = 0
  for (const row of generated) {
    if (known.has(row.slug)) continue
    const body = row.originalBody
    await prisma.$transaction([
      ...(body ? [prisma.presence.deleteMany({ where: { entityId: body.id } })] : []),
      ...(body ? [prisma.body.delete({ where: { id: body.id } })] : []),
      ...(row.originalConsciousness
        ? [prisma.consciousness.delete({ where: { id: row.originalConsciousness.id } })]
        : []),
      prisma.character.delete({ where: { id: row.id } }),
    ])
    pruned += 1
  }
  return pruned
}
