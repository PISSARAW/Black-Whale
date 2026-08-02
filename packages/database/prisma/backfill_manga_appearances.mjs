/**
 * Renseigne `mangaAppearances` pour les personnages du catalogue qui n'en ont pas.
 *
 * Sans cette liste, un personnage est invisible au filtre à spoilers par chapitre :
 * `character-timeline.ts` n'a rien à dater, et la carte ne peut pas décider s'il a
 * déjà été montré au lecteur. La moitié du catalogue était dans ce cas.
 *
 * La source est la section « Characters in Order of Appearance » des pages de
 * chapitre de Hunterpedia, c'est-à-dire exactement celle qui a servi aux fiches
 * rédigées à la main : rejouée sur les 99 personnages déjà curés, la conversion
 * ci-dessous retrouve 99,3 % de leurs 7 442 entrées. Les 50 écarts restants sont
 * des raffinements que le wiki n'exprime pas (`death`, `impersonated`, `soul`) —
 * raison pour laquelle une liste déjà écrite n'est jamais réécrite.
 *
 * Usage: node packages/database/prisma/backfill_manga_appearances.mjs [--dry-run]
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '../../..')
const catalogPath = resolve(projectRoot, 'data/characters/characters.json')
const API = 'https://hunterxhunter.fandom.com/api.php'
const USER_AGENT = 'Black-Whale-catalog/1.0 (dataset enrichment)'
const dryRun = process.argv.includes('--dry-run')

/** Le voyage : le catalogue ne date rien hors de cet intervalle. */
const FIRST_CHAPTER = 340
const LAST_CHAPTER = 416

/**
 * Une liste de cette longueur couvre déjà tout le voyage et a donc été relue à la
 * main : on la laisse telle quelle. En dessous, les quelques entrées présentes sont
 * des annotations ponctuelles (`death`, `appears` d'un figurant) que l'on conserve
 * en complétant les chapitres manquants.
 */
const CURATED_LENGTH = 70

async function fetchJson(url, attempts = 3) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      if (response.ok) return await response.json()
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
  }
  return null
}

async function fetchChapters() {
  const titles = []
  for (let n = FIRST_CHAPTER; n <= LAST_CHAPTER; n += 1) titles.push(`Chapter ${n}`)
  const wikitextByTitle = new Map()
  for (let index = 0; index < titles.length; index += 10) {
    const batch = titles.slice(index, index + 10)
    const payload = await fetchJson(
      `${API}?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&redirects=1` +
        `&titles=${encodeURIComponent(batch.join('|'))}`,
    )
    for (const page of Object.values(payload?.query?.pages || {})) {
      if (page.missing !== undefined) continue
      wikitextByTitle.set(page.title, page.revisions?.[0]?.slots?.main?.['*'] ?? '')
    }
  }
  return wikitextByTitle
}

function normalizeName(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
    .replace('morow', 'morrow')
}

/** Une entrée de la liste : un lien, d'éventuels marqueurs `{{X}}` et une note `{{Sm|(…)}}`. */
function parseAppearanceList(wikitext) {
  const start = wikitext.search(/==\s*Characters in Order of Appearance\s*==/i)
  if (start < 0) return []
  const section = wikitext.slice(start).split(/\n==[^=]/)[0]
  const entries = []
  for (const line of section.split('\n')) {
    const match = line.match(/^\*+\s*\[\[([^\]|]+)(?:\|[^\]]*)?\]\]\s*(.*)$/)
    if (!match) continue
    entries.push({
      name: match[1].trim(),
      flags: [...match[2].matchAll(/\{\{([A-Za-z]+)\}\}/g)].map((m) => m[1]),
      note: [...match[2].matchAll(/\{\{Sm\|\(([^)]*)/g)].map((m) => m[1]).join(' ; '),
    })
  }
  return entries
}

function chapterTitle(wikitext) {
  const match = wikitext.match(/^\|\s*Name\s*=\s*(.*)$/m)
  return match ? match[1].trim() : null
}

/**
 * Marqueurs Hunterpedia : {{D}} début, {{M}}/{{Mi}} mention, {{I}} image, {{F}}
 * flashback, {{Co}} cadavre, {{V}} vidéo. L'ordre compte : un personnage qui
 * débute en flashback est d'abord un début, une image mentionnée reste une image.
 */
function statusFor({ flags, note }) {
  const has = (flag) => flags.includes(flag)
  if (/Disguised as/i.test(note)) return 'disguised'
  if (/Nen Double/i.test(note)) return 'clone'
  if (/Vision/i.test(note)) return 'vision'
  if (has('Co') || /Corpse|Casket/i.test(note)) return 'corpse'
  if (has('D')) return 'debut'
  if (has('F') || /Flashback/i.test(note)) return 'flashback'
  if (has('V') || /Video/i.test(note)) return 'voice'
  if (has('I') || /Image|Photo|Cover|Silhouette|diagram/i.test(note)) return 'pictured'
  if (has('M') || has('Mi') || /Mentioned/i.test(note)) return 'mentioned'
  return 'appears'
}

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
const idByName = new Map()
for (const character of catalog)
  for (const name of [character.canonicalName, ...(character.aliases || [])])
    idByName.set(normalizeName(name), character.id)

const wikitextByTitle = await fetchChapters()
const missingPages = []

/**
 * Les titres de chapitre déjà employés par le catalogue font autorité sur ceux du
 * wiki : le dépôt a tranché « Heat » contre « Head » et « Truth or Falsehood »
 * contre « Authenticity », et une liste ajoutée ici ne doit pas rouvrir le débat.
 */
const titleByChapter = new Map()
for (const character of catalog)
  for (const entry of character.mangaAppearances || [])
    if (entry.title && !titleByChapter.has(entry.chapter))
      titleByChapter.set(entry.chapter, entry.title)

const statusByChapter = new Map()
for (let chapter = FIRST_CHAPTER; chapter <= LAST_CHAPTER; chapter += 1) {
  const wikitext = wikitextByTitle.get(`Chapter ${chapter}`)
  if (!wikitext) {
    missingPages.push(chapter)
    continue
  }
  if (!titleByChapter.has(chapter)) titleByChapter.set(chapter, chapterTitle(wikitext))
  const byId = new Map()
  for (const entry of parseAppearanceList(wikitext)) {
    const id = idByName.get(normalizeName(entry.name))
    // Les non-passagers cités en flashback (Gon, Netero, Uvogin…) ne sont pas au
    // catalogue : la liste de chapitre en nomme plus que le navire n'en embarque.
    if (id && !byId.has(id)) byId.set(id, statusFor(entry))
  }
  statusByChapter.set(chapter, byId)
}

if (missingPages.length) {
  throw new Error(`Pages de chapitre introuvables : ${missingPages.join(', ')}`)
}

const filled = []
const stillEmpty = []

for (const character of catalog) {
  const existing = character.mangaAppearances || []
  if (existing.length >= CURATED_LENGTH) continue

  const curatedByChapter = new Map(existing.map((entry) => [entry.chapter, entry]))
  const appearances = []
  let onPanel = 0
  for (let chapter = FIRST_CHAPTER; chapter <= LAST_CHAPTER; chapter += 1) {
    const curated = curatedByChapter.get(chapter)
    const status = curated?.status ?? statusByChapter.get(chapter).get(character.id) ?? 'absent'
    if (status !== 'absent') onPanel += 1
    appearances.push({ chapter, title: titleByChapter.get(chapter), status })
  }

  // Un personnage que le wiki ne cite dans aucun chapitre du voyage — les fiches
  // Jump Ryu!, jamais dessinées — n'aurait qu'une liste de 76 « absent » : elle
  // affirmerait une absence observée là où il n'y a rien à observer.
  if (!onPanel) {
    stillEmpty.push(character.id)
    continue
  }

  character.mangaAppearances = appearances
  filled.push(`${character.id}: ${onPanel} chapitre(s) sur panneau (${existing.length} déjà écrit)`)
}

if (!dryRun) await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`)

console.log(
  JSON.stringify(
    {
      dryRun,
      chapters: `${FIRST_CHAPTER}–${LAST_CHAPTER}`,
      catalogSize: catalog.length,
      filled: filled.length,
      alreadyCurated: catalog.filter((c) => (c.mangaAppearances || []).length >= CURATED_LENGTH)
        .length,
      neverOnPanel: stillEmpty,
    },
    null,
    2,
  ),
)
console.log('\n' + filled.join('\n'))
