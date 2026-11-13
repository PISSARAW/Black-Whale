import { readDataFile } from './data-files'

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

interface CatalogAbilityUse {
  abilityId: string
  chapter: number
}

/**
 * The chapter at which an ability becomes speakable, or `null` when nothing in
 * the catalogue dates it.
 *
 * The catalogue declaration wins, followed by the earliest dated canonical
 * use. A character's first appearance is deliberately not a fallback: knowing
 * Kurapika exists does not make every technique he reveals later safe to name.
 * `null` therefore means "not enough evidence" and is withheld under a cap.
 */
export function abilityFirstVisibleChapter(
  ability: CatalogAbilityVisibility,
  chapterNumberById: ReadonlyMap<string, number>,
  earliestUseByAbilityId: ReadonlyMap<string, number>,
): number | null {
  const declared = ability.firstVisibleChapterId
    ? (chapterNumberById.get(ability.firstVisibleChapterId) ??
      Number(ability.firstVisibleChapterId.match(/^ch-(\d+)/)?.[1]))
    : undefined
  if (declared !== undefined && Number.isFinite(declared)) return declared

  return earliestUseByAbilityId.get(ability.id) ?? null
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
  const [abilities, uses, chapters] = await Promise.all([
    readDataFile<CatalogAbilityVisibility[]>('abilities/abilities.json'),
    readDataFile<CatalogAbilityUse[]>('abilities/uses.json'),
    readDataFile<CatalogChapter[]>('chapters/chapters.json'),
  ])

  const chapterNumberById = new Map(chapters.map((chapter) => [chapter.id, chapter.number]))
  const latestChapter = chapters.reduce((latest, chapter) => Math.max(latest, chapter.number), 0)
  const earliestUseByAbilityId = new Map<string, number>()
  for (const use of uses) {
    const previous = earliestUseByAbilityId.get(use.abilityId)
    if (previous === undefined || use.chapter < previous) {
      earliestUseByAbilityId.set(use.abilityId, use.chapter)
    }
  }

  const byAbilityId = new Map<string, number | null>(
    abilities.map((ability) => [
      ability.id,
      abilityFirstVisibleChapter(ability, chapterNumberById, earliestUseByAbilityId),
    ]),
  )

  return {
    firstVisibleChapter: (abilityId) => byAbilityId.get(abilityId) ?? null,
    isVisible: (abilityId, maxChapter) => {
      if (maxChapter === undefined) return true
      if (maxChapter >= latestChapter) return true
      const chapter = byAbilityId.get(abilityId)
      return chapter !== null && chapter !== undefined && chapter <= maxChapter
    },
  }
}
