/**
 * Ajoute au catalogue les passagers de Black Whale 1 encore absents, à partir de la
 * catégorie Hunterpedia. Les fiches créées ici ne sont qu'un GABARIT : factionId null,
 * firstAppearanceChapterId 'ch-359' et shipLocation vide sont des valeurs de remplissage,
 * pas des observations du manga.
 *
 * Enchaîner systématiquement avec enrich_hunterpedia_passengers.mjs, qui lit l'infobox de
 * chaque page pour renseigner faction, chambre et chapitre de première apparition réels.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '../../..')
const catalogPath = resolve(projectRoot, 'data/characters/characters.json')
const sourceUrl = new URL('https://hunterxhunter.fandom.com/api.php')

sourceUrl.search = new URLSearchParams({
  action: 'query',
  format: 'json',
  list: 'categorymembers',
  cmtitle: 'Category:Black Whale 1 Passengers',
  cmlimit: '500',
  cmnamespace: '0',
  origin: '*',
}).toString()

function normalizeName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
    .replace('morow', 'morrow')
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const response = await fetch(sourceUrl)
if (!response.ok) throw new Error(`Hunterpedia request failed with ${response.status}`)

const payload = await response.json()
const passengerNames = payload?.query?.categorymembers?.map((entry) => entry.title) || []
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
const knownNames = new Set(
  catalog
    .flatMap((character) => [character.canonicalName, ...(character.aliases || [])])
    .map(normalizeName),
)
const knownIds = new Set(catalog.map((character) => character.id))
const additions = []

for (const canonicalName of passengerNames) {
  if (knownNames.has(normalizeName(canonicalName))) continue
  let id = slugify(canonicalName)
  let suffix = 2
  while (knownIds.has(id)) id = `${slugify(canonicalName)}-${suffix++}`
  knownIds.add(id)
  knownNames.add(normalizeName(canonicalName))
  additions.push({
    id,
    canonicalName,
    aliases: [],
    description:
      'Named passenger aboard Black Whale 1. No precise position is currently documented in the local map data.',
    factionId: null,
    firstAppearanceChapterId: 'ch-359',
    canonStatus: 'canon',
    shipLocation: {
      tier: null,
      room: null,
      status: 'inconnu',
      role: 'passager nommé',
    },
    mapPresenceFromChapterId: 'ch-359',
    mapPresenceUntilChapterId: null,
    mangaAppearances: [],
  })
}

if (additions.length) {
  catalog.push(
    ...additions.sort((left, right) => left.canonicalName.localeCompare(right.canonicalName)),
  )
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`)
}

console.log(
  JSON.stringify(
    {
      source: sourceUrl.origin + sourceUrl.pathname,
      hunterpediaPassengers: passengerNames.length,
      previousCatalogSize: catalog.length - additions.length,
      added: additions.length,
      catalogSize: catalog.length,
      nextStep: additions.length
        ? 'node packages/database/prisma/enrich_hunterpedia_passengers.mjs'
        : null,
    },
    null,
    2,
  ),
)
