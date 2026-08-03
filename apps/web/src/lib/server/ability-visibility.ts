import { readDataFile, type CatalogCharacter } from './data-files'

/**
 * The ability catalogue as `data/abilities/abilities.json` declares it. Only the
 * fields visibility needs are named here.
 */
export interface CatalogAbilityVisibility {
  id: string
  ownerId?: string | null
  userIds?: string[]
  /**
   * Set only when the technique is revealed later than everyone who uses it —
   * the catalogue is then the authority and nothing is inferred. Absent for
   * every entry today, which is why the fallback below exists.
   */
  firstVisibleChapterId?: string | null
}

interface CatalogChapter {
  id: string
  number: number
}

/**
 * The chapter at which an ability becomes speakable, or `null` when nothing in
 * the catalogue dates it.
 *
 * There is no per-ability chapter in `data/` yet, so the fallback is the
 * earliest appearance of anyone the ability is attributed to: a technique
 * cannot be known before its user is. That is a lower bound, not the truth —
 * a character can appear long before their Hatsu is shown — so the catalogue's
 * own `firstVisibleChapterId` wins whenever it is set, and ADR-001's chantier 2
 * is where that field becomes required rather than optional.
 */
export function abilityFirstVisibleChapter(
  ability: CatalogAbilityVisibility,
  chapterNumberById: ReadonlyMap<string, number>,
  firstAppearanceByCharacterId: ReadonlyMap<string, number>,
): number | null {
  const declared = ability.firstVisibleChapterId
    ? chapterNumberById.get(ability.firstVisibleChapterId)
    : undefined
  if (declared !== undefined) return declared

  const attributed = [ability.ownerId, ...(ability.userIds ?? [])].filter(
    (id): id is string => Boolean(id),
  )
  const appearances = attributed
    .map((id) => firstAppearanceByCharacterId.get(id))
    .filter((number): number is number => number !== undefined)

  return appearances.length ? Math.min(...appearances) : null
}

export interface AbilityVisibilityIndex {
  /** `null` when the catalogue cannot date the ability: it is never withheld. */
  firstVisibleChapter(abilityId: string): number | null
  /** True when the ability may be shown to a reader capped at `maxChapter`. */
  isVisible(abilityId: string, maxChapter: number | undefined): boolean
}

/**
 * Reads the catalogue once and answers spoiler questions about abilities.
 *
 * It lives on the server because the answer decides what leaves the server:
 * flagging a spoiler in the payload and hiding it in the browser would still
 * ship the name to a reader who asked not to see it.
 */
export async function loadAbilityVisibility(): Promise<AbilityVisibilityIndex> {
  const [abilities, characters, chapters] = await Promise.all([
    readDataFile<CatalogAbilityVisibility[]>('abilities/abilities.json'),
    readDataFile<CatalogCharacter[]>('characters/characters.json'),
    readDataFile<CatalogChapter[]>('chapters/chapters.json'),
  ])

  const chapterNumberById = new Map(chapters.map((chapter) => [chapter.id, chapter.number]))
  const firstAppearanceByCharacterId = new Map<string, number>()
  for (const character of characters) {
    const number = character.firstAppearanceChapterId
      ? chapterNumberById.get(character.firstAppearanceChapterId)
      : undefined
    if (number !== undefined) firstAppearanceByCharacterId.set(character.id, number)
  }

  const byAbilityId = new Map<string, number | null>(
    abilities.map((ability) => [
      ability.id,
      abilityFirstVisibleChapter(ability, chapterNumberById, firstAppearanceByCharacterId),
    ]),
  )

  return {
    firstVisibleChapter: (abilityId) => byAbilityId.get(abilityId) ?? null,
    isVisible: (abilityId, maxChapter) => {
      if (maxChapter === undefined) return true
      const chapter = byAbilityId.get(abilityId)
      return chapter === null || chapter === undefined || chapter <= maxChapter
    },
  }
}
