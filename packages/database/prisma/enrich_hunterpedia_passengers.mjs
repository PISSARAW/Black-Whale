/**
 * Enrichit les personnages importés par sync_hunterpedia_passengers.mjs.
 *
 * Ce script d'import ne pose qu'un gabarit : factionId null, firstAppearanceChapterId
 * 'ch-359' et une shipLocation vide. On récupère ici l'infobox Hunterpedia de chaque
 * personnage pour en déduire :
 *   - factionId          <- affiliation (prince employeur, famille mafieuse, cour de Kakin)
 *   - shipLocation.room  <- prince auquel il est AFFECTÉ (≠ son employeur)
 *   - firstAppearance    <- champ « manga debut »
 *
 * Distinction clé : Saquelle est un soldat privé de Benjamin (factionId prince-benjamin)
 * mais garde royal de Marayam, donc posté chambre 1013.
 *
 * Chaque champ n'est écrit que s'il porte encore une valeur de gabarit — les fiches
 * rédigées à la main ne sont jamais écrasées. Idempotent.
 *
 * Usage: node packages/database/prisma/enrich_hunterpedia_passengers.mjs [--dry-run]
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

const PLACEHOLDER_DESCRIPTION =
  'Named passenger aboard Black Whale 1. No precise position is currently documented in the local map data.'
const PLACEHOLDER_ROLES = new Set(['passager nommé', 'divers', 'personnel', 'annonceur', ''])
const PLACEHOLDER_CHAPTERS = new Set(['ch-359', 'ch-unknown'])

/** Secteur résidentiel royal, Tier 1 : une chambre par prince, dans l'ordre de naissance. */
const PRINCE_ROOM = {
  Benjamin: '1001',
  Camilla: '1002',
  'Zhang Lei': '1003',
  Tserriednich: '1004',
  Tubeppa: '1005',
  Tyson: '1006',
  Luzurus: '1007',
  'Salé-salé': '1008',
  Halkenburg: '1009',
  Kacho: '1010',
  Fugetsu: '1011',
  Momoze: '1012',
  Marayam: '1013',
  Woble: '1014',
}
const PRINCE_FACTION = {
  Benjamin: 'prince-benjamin',
  Camilla: 'prince-camilla',
  'Zhang Lei': 'prince-zhanglei',
  Tserriednich: 'prince-tserriednich',
  Tubeppa: 'prince-tubeppa',
  Tyson: 'prince-tyson',
  Luzurus: 'prince-luzurus',
  'Salé-salé': 'prince-salesale',
  Halkenburg: 'prince-halkenburg',
  Kacho: 'prince-kacho',
  Fugetsu: 'prince-fugetsu',
  Momoze: 'prince-momoze',
  Marayam: 'prince-marayam',
  Woble: 'prince-woble',
}
const MAFIA_FACTION = {
  'Heil-Ly Family': 'mafia-heilly',
  'Xi-Yu Family': 'mafia-xiyu',
  'Cha-R Family': 'mafia-char',
}
const PRINCES = Object.keys(PRINCE_ROOM)

/** Clauses désignant le POSTE (où la personne est stationnée), pas son employeur. */
const POST_PATTERNS = [
  /(?:Royal )?Bodyguard (?:for|of|to) (?:Prince(?:ss)? )?([A-Za-zé\- ]+)/i,
  /assigned to Prince ([A-Za-zé\- ]+)/i,
  /(?:Private Guard|Majordomo|Captain of the Private Guards) of Prince ([A-Za-zé\- ]+)/i,
  /Prince ([A-Za-zé\- ]+?)'s (?:Maid|Servant)/i,
  /(?:Captain of the Guards|Personal Soldier|Private Soldier|Private Military Commander|Servant|Researcher) for Prince ([A-Za-zé\- ]+)/i,
]

function infoboxField(wikitext, key) {
  // Espaces horizontaux uniquement : `\s*` avalerait le saut de ligne et un champ
  // vide capturerait la ligne suivante du gabarit.
  const match = wikitext.match(new RegExp(`^\\|[ \\t]*${key}[ \\t]*=[ \\t]*(.*)$`, 'mi'))
  return match ? match[1].trim() : ''
}

function stripWikitext(value) {
  return value
    .replace(/<ref[^>]*>.*?<\/ref>/gis, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/<br\s*\/?>/gi, ' ; ')
    .replace(/<[^>]*>/g, '')
    .replace(/'''?/g, '')
    .replace(/\}\}/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*;\s*$/, '')
    .trim()
}

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

/** Récupère le wikitext par lots de 20 titres, en suivant redirections et normalisations. */
async function fetchWikitext(titles) {
  const pages = new Map()
  for (let index = 0; index < titles.length; index += 20) {
    const batch = titles.slice(index, index + 20)
    const url =
      `${API}?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&redirects=1` +
      `&titles=${encodeURIComponent(batch.join('|'))}`
    const payload = await fetchJson(url)
    if (!payload?.query) continue
    const byTitle = new Map()
    for (const page of Object.values(payload.query.pages)) {
      if (page.missing !== undefined) continue
      byTitle.set(page.title, page.revisions?.[0]?.slots?.main?.['*'] ?? '')
    }
    const redirects = new Map((payload.query.redirects || []).map((r) => [r.from, r.to]))
    const normalized = new Map((payload.query.normalized || []).map((r) => [r.from, r.to]))
    for (const title of batch) {
      let resolvedTitle = normalized.get(title) || title
      resolvedTitle = redirects.get(resolvedTitle) || resolvedTitle
      if (byTitle.has(resolvedTitle)) pages.set(title, byTitle.get(resolvedTitle))
    }
  }
  return pages
}

function readInfobox(wikitext) {
  // Les personnages morts basculent sur les champs « previous ».
  const affiliation = stripWikitext(
    infoboxField(wikitext, 'affiliation') || infoboxField(wikitext, 'previous affiliation'),
  )
  const occupation = stripWikitext(
    infoboxField(wikitext, 'occupation') || infoboxField(wikitext, 'previous occupation'),
  )
  const debut = stripWikitext(infoboxField(wikitext, 'manga debut'))
  return {
    affiliation,
    occupation,
    debut,
    deceased: /Deceased/i.test(stripWikitext(infoboxField(wikitext, 'status'))),
    // Fiches Togashi du Jump Ryu! Vol. 21 : jamais montrés dans le manga.
    databookOnly: !debut && /Jump ?Ryu/i.test(wikitext),
  }
}

function findPost(occupation) {
  for (const pattern of POST_PATTERNS) {
    for (const clause of occupation.split(' ; ')) {
      const match = clause.match(pattern)
      const prince = match && PRINCES.find((p) => match[1].trim().startsWith(p))
      if (prince) return prince
    }
  }
  return null
}

function findFaction(affiliation, occupation, post) {
  const mafiaName = Object.keys(MAFIA_FACTION).find((family) => affiliation.includes(family))
  // Un cadre mafieux détaché auprès d'un prince reste rattaché à sa famille.
  if (mafiaName && /\b(Boss|Mafioso|Consigliere)\b/i.test(occupation))
    return MAFIA_FACTION[mafiaName]
  const affiliatedPrinces = PRINCES.filter((p) => new RegExp(`\\b${p}\\b`).test(affiliation))
  const employer = affiliatedPrinces.find((p) => p !== post) || affiliatedPrinces[0]
  if (employer) return PRINCE_FACTION[employer]
  if (mafiaName) return MAFIA_FACTION[mafiaName]
  if (/Phantom Troupe/.test(affiliation)) return 'phantom-troupe'
  if (/Zodiacs?/.test(affiliation)) return 'zodiacs'
  if (/Royal Army/.test(affiliation)) return 'kakin-royal-army'
  if (/Hui Guo Rou|Kakin Empire/.test(affiliation)) return 'kakin-royal-family'
  if (/Hunter Association/.test(affiliation)) return 'hunter-association'
  return null
}

/** Préfère un chapitre où le personnage est réellement montré, pas seulement mentionné. */
function findDebutChapter(debut) {
  const clauses = debut.split(' ; ').filter(Boolean)
  const parsed = clauses
    .map((clause) => {
      const match = clause.match(/Chapter (\d+)/)
      return match ? { chapter: Number(match[1]), mentionOnly: /Mentioned/i.test(clause) } : null
    })
    .filter(Boolean)
  if (!parsed.length) return null
  return (parsed.find((entry) => !entry.mentionOnly) || parsed[0]).chapter
}

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
const targets = catalog.filter(
  (character) =>
    !character.factionId &&
    (character.description === PLACEHOLDER_DESCRIPTION ||
      PLACEHOLDER_CHAPTERS.has(character.firstAppearanceChapterId) ||
      PLACEHOLDER_ROLES.has(character.shipLocation?.role ?? '')),
)

const wikitextByName = await fetchWikitext(targets.map((character) => character.canonicalName))
const report = { enriched: [], noPage: [], databookOnly: [], unresolvedFaction: [] }

for (const character of targets) {
  const wikitext = wikitextByName.get(character.canonicalName)
  if (!wikitext) {
    report.noPage.push(character.id)
    continue
  }
  const infobox = readInfobox(wikitext)
  const post = findPost(infobox.occupation)
  const faction = findFaction(infobox.affiliation, infobox.occupation, post)
  const debutChapter = findDebutChapter(infobox.debut)
  const changes = []

  if (!character.factionId && faction) {
    character.factionId = faction
    changes.push(`factionId=${faction}`)
  } else if (!faction) {
    report.unresolvedFaction.push(`${character.id} (aff="${infobox.affiliation}")`)
  }

  const location = character.shipLocation
  if (location) {
    if (post && location.tier == null && location.room == null) {
      location.tier = 1
      location.room = PRINCE_ROOM[post]
      changes.push(`room=${PRINCE_ROOM[post]} (${post})`)
      // Un poste connu des seules fiches Togashi n'est daté par aucune planche :
      // la carte le placera à l'embarquement, donc en PROBABLE et non en CONFIRMED.
      if (infobox.databookOnly) {
        character.positionProvenance = 'databook'
        changes.push('positionProvenance=databook')
      }
    }
    if (infobox.occupation && PLACEHOLDER_ROLES.has(location.role ?? '')) {
      location.role = infobox.occupation
      changes.push('role')
    }
    if (location.status === 'inconnu') {
      location.status = infobox.deceased ? 'mort' : post ? 'actif' : 'inconnu'
      if (location.status !== 'inconnu') changes.push(`status=${location.status}`)
    }
  }

  if (PLACEHOLDER_CHAPTERS.has(character.firstAppearanceChapterId)) {
    if (debutChapter) {
      character.firstAppearanceChapterId = `ch-${debutChapter}`
      character.mapPresenceFromChapterId = `ch-${debutChapter}`
      changes.push(`debut=ch-${debutChapter}`)
    } else if (infobox.databookOnly) {
      // Aucune apparition sur planche : ne pas inventer de chapitre.
      character.firstAppearanceChapterId = null
      character.mapPresenceFromChapterId = null
      report.databookOnly.push(character.id)
      changes.push('debut=null (databook)')
    }
  }

  if (character.description === PLACEHOLDER_DESCRIPTION) {
    const origin = infobox.databookOnly
      ? ' Révélé dans les fiches de Togashi (Jump Ryu! Vol. 21), sans apparition dans le manga.'
      : ''
    character.description =
      [infobox.occupation, infobox.affiliation].filter(Boolean).join('. ') + '.' + origin
    changes.push('description')
  }

  if (changes.length) report.enriched.push(`${character.id}: ${changes.join(', ')}`)
}

if (!dryRun) await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`)

console.log(
  JSON.stringify(
    {
      dryRun,
      candidates: targets.length,
      enriched: report.enriched.length,
      noHunterpediaPage: report.noPage,
      databookOnly: report.databookOnly,
      unresolvedFaction: report.unresolvedFaction,
    },
    null,
    2,
  ),
)
console.log('\n' + report.enriched.join('\n'))
