import type { AppearanceStatus, MangaAppearance } from '@black-whale/contracts'
import type { WritableCharacter } from './catalogue-file.js'
import { normalizeName } from './wikitext.js'

/**
 * Filling `mangaAppearances` for the entries that have none.
 *
 * Without this list a character is invisible to the spoiler cap:
 * `character-timeline.ts` has nothing to date them by, and the map cannot
 * decide whether they have been shown to the reader yet. Half the catalogue was
 * in that state.
 *
 * The source is the "Characters in Order of Appearance" section of Hunterpedia's
 * chapter pages — the same one the hand-written entries came from. Replayed
 * over the 99 already curated, this conversion recovers 99.3% of their 7,442
 * entries. The 50 remaining gaps are refinements the wiki does not express
 * (`death`, `impersonated`, `soul`), which is why a list already written is
 * never rewritten.
 */

/** The voyage: the catalogue dates nothing outside this span. */
export const FIRST_CHAPTER = 340
export const LAST_CHAPTER = 416

/**
 * A list this long already covers the whole voyage and has therefore been read
 * over by hand: it is left alone. Below it, the few entries present are
 * pointed annotations — a `death`, an extra's `appears` — kept while the
 * missing chapters are filled in around them.
 */
export const CURATED_LENGTH = 70

export interface ChapterReading {
  /** Status per catalogue id, for the characters this chapter names. */
  statusById: ReadonlyMap<string, AppearanceStatus>
  title: string | null
}

/** Every name a catalogue entry answers to, pointing back at its id. */
export function indexByName(catalogue: readonly WritableCharacter[]): Map<string, string> {
  const byName = new Map<string, string>()
  for (const entry of catalogue) {
    for (const name of [entry.canonicalName, ...(entry.aliases ?? [])]) {
      byName.set(normalizeName(name), entry.id)
    }
  }
  return byName
}

/**
 * Chapter titles the catalogue already uses win over the wiki's.
 *
 * The repository settled "Heat" against "Head" and "Truth or Falsehood"
 * against "Authenticity"; a list added here must not reopen the argument.
 */
export function curatedChapterTitles(catalogue: readonly WritableCharacter[]): Map<number, string> {
  const byChapter = new Map<number, string>()
  for (const entry of catalogue) {
    for (const appearance of entry.mangaAppearances ?? []) {
      if (appearance.title && !byChapter.has(appearance.chapter)) {
        byChapter.set(appearance.chapter, appearance.title)
      }
    }
  }
  return byChapter
}

export interface FillResult {
  appearances: MangaAppearance[]
  /** Chapters the character is physically on panel in. Zero means: write nothing. */
  onPanel: number
}

/**
 * The full span for one character, curated entries kept as they stand.
 *
 * A character the wiki names in no chapter of the voyage — the Jump Ryu!
 * sheets, never drawn — would get a list of 76 `absent`, which would assert an
 * observed absence where there is nothing to observe. The caller drops those.
 */
export function fillAppearances({
  character,
  readings,
  titles,
}: {
  character: WritableCharacter
  readings: ReadonlyMap<number, ChapterReading>
  titles: ReadonlyMap<number, string>
}): FillResult {
  const curated = new Map((character.mangaAppearances ?? []).map((entry) => [entry.chapter, entry]))
  const appearances: MangaAppearance[] = []
  let onPanel = 0

  for (let chapter = FIRST_CHAPTER; chapter <= LAST_CHAPTER; chapter += 1) {
    const status =
      curated.get(chapter)?.status ??
      readings.get(chapter)?.statusById.get(character.id) ??
      'absent'
    if (status !== 'absent') onPanel += 1
    appearances.push({ chapter, title: titles.get(chapter) ?? `Chapter ${chapter}`, status })
  }

  return { appearances, onPanel }
}

/** Whether this entry's list has already been read over by hand. */
export function isCurated(character: WritableCharacter): boolean {
  return (character.mangaAppearances?.length ?? 0) >= CURATED_LENGTH
}
