import { prisma } from './db'

/**
 * The character a `[character]` route parameter names.
 *
 * The catalogue is linked to by slug (`/characters/hisoka`) and the perspective
 * pages are linked to by row id (the selector on `/perspectives` posts ids), so
 * both are accepted rather than making the caller know which one it holds.
 */
export interface CharacterRef {
  id: string
  slug: string
  canonicalName: string
  firstVisibleChapter: number
}

export async function findCharacterRef(
  idOrSlug: string,
  spoilerLimit: number | null,
): Promise<CharacterRef | null> {
  const row = await prisma.character.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: { firstVisibleEvent: { include: { chapter: true } } },
  })
  if (!row) return null

  const firstVisibleChapter = row.firstVisibleEvent.chapter.number
  // Past the reader's cap the character is reported missing, not withheld.
  if (spoilerLimit !== null && firstVisibleChapter > spoilerLimit) return null

  return {
    id: row.id,
    slug: row.slug,
    canonicalName: row.canonicalName,
    firstVisibleChapter,
  }
}
