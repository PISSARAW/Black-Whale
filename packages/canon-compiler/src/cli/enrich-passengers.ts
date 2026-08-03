import { readCharacterFile, writeCharacterFile } from '../hunterpedia/catalogue-file.js'
import { enrichCharacter, enrichmentTargets } from '../hunterpedia/enrich.js'
import { readInfobox } from '../hunterpedia/infobox.js'
import { fetchWikitext } from '../hunterpedia/wiki.js'

const dryRun = process.argv.includes('--dry-run')
const catalogue = readCharacterFile()
const targets = enrichmentTargets(catalogue)
const wikitextByName = await fetchWikitext(targets.map((entry) => entry.canonicalName))

const enriched: string[] = []
const noPage: string[] = []
const databookOnly: string[] = []
const unresolvedFaction: string[] = []

for (const entry of targets) {
  const wikitext = wikitextByName.get(entry.canonicalName)
  if (!wikitext) {
    noPage.push(entry.id)
    continue
  }
  const infobox = readInfobox(wikitext)
  const outcome = enrichCharacter(entry, infobox)
  if (!outcome.factionResolved) unresolvedFaction.push(`${entry.id} (aff="${infobox.affiliation}")`)
  if (outcome.databookOnly && entry.firstAppearanceChapterId === null) databookOnly.push(entry.id)
  if (outcome.changes.length) enriched.push(`${entry.id}: ${outcome.changes.join(', ')}`)
}

if (!dryRun) writeCharacterFile(catalogue)

console.log(
  JSON.stringify(
    {
      dryRun,
      candidates: targets.length,
      enriched: enriched.length,
      noPage,
      databookOnly,
      unresolvedFaction,
    },
    null,
    2,
  ),
)
console.log(`\n${enriched.join('\n')}`)
