import {
  curatedChapterTitles,
  fillAppearances,
  FIRST_CHAPTER,
  indexByName,
  isCurated,
  LAST_CHAPTER,
  type ChapterReading,
} from '../hunterpedia/appearances.js'
import { readCharacterFile, writeCharacterFile } from '../hunterpedia/catalogue-file.js'
import { fetchWikitext } from '../hunterpedia/wiki.js'
import {
  chapterTitle,
  normalizeName,
  parseAppearanceList,
  statusFor,
} from '../hunterpedia/wikitext.js'

const dryRun = process.argv.includes('--dry-run')
const catalogue = readCharacterFile()
const idByName = indexByName(catalogue)
const titles = curatedChapterTitles(catalogue)

const wanted: string[] = []
for (let chapter = FIRST_CHAPTER; chapter <= LAST_CHAPTER; chapter += 1)
  wanted.push(`Chapter ${chapter}`)
const wikitextByTitle = await fetchWikitext(wanted, 10)

const readings = new Map<number, ChapterReading>()
const missing: number[] = []
for (let chapter = FIRST_CHAPTER; chapter <= LAST_CHAPTER; chapter += 1) {
  const wikitext = wikitextByTitle.get(`Chapter ${chapter}`)
  if (!wikitext) {
    missing.push(chapter)
    continue
  }
  if (!titles.has(chapter)) {
    const title = chapterTitle(wikitext)
    if (title) titles.set(chapter, title)
  }
  const statusById = new Map<string, ReturnType<typeof statusFor>>()
  for (const entry of parseAppearanceList(wikitext)) {
    // A chapter's cast list names more people than the ship carries: the
    // outsiders quoted in flashbacks are not catalogue entries.
    const id = idByName.get(normalizeName(entry.name))
    if (id && !statusById.has(id)) statusById.set(id, statusFor(entry))
  }
  readings.set(chapter, { statusById, title: titles.get(chapter) ?? null })
}

if (missing.length) throw new Error(`Pages de chapitre introuvables : ${missing.join(', ')}`)

const filled: string[] = []
const neverOnPanel: string[] = []
for (const character of catalogue) {
  if (isCurated(character)) continue
  const written = character.mangaAppearances?.length ?? 0
  const { appearances, onPanel } = fillAppearances({ character, readings, titles })
  if (!onPanel) {
    neverOnPanel.push(character.id)
    continue
  }
  character.mangaAppearances = appearances
  filled.push(`${character.id}: ${onPanel} chapitre(s) sur planche (${written} déjà écrit)`)
}

if (!dryRun) writeCharacterFile(catalogue)

console.log(
  JSON.stringify(
    {
      dryRun,
      chapters: `${FIRST_CHAPTER}–${LAST_CHAPTER}`,
      catalogSize: catalogue.length,
      filled: filled.length,
      alreadyCurated: catalogue.filter(isCurated).length,
      neverOnPanel,
    },
    null,
    2,
  ),
)
console.log(`\n${filled.join('\n')}`)
