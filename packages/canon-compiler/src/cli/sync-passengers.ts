import { readCharacterFile, writeCharacterFile } from '../hunterpedia/catalogue-file.js'
import { addMissingPassengers, CATEGORY } from '../hunterpedia/sync.js'
import { fetchCategoryMembers } from '../hunterpedia/wiki.js'

/**
 * Adds the passengers the catalogue is missing, as TEMPLATES. Always follow
 * with `compile:enrich`, which replaces the placeholders with the infobox's
 * answers.
 */
const passengers = await fetchCategoryMembers(CATEGORY)
const existing = readCharacterFile()
const { additions, catalogue } = addMissingPassengers(existing, passengers)

if (additions.length) writeCharacterFile(catalogue)

console.log(
  JSON.stringify(
    {
      hunterpediaPassengers: passengers.length,
      previousCatalogSize: existing.length,
      added: additions.length,
      catalogSize: catalogue.length,
      nextStep: additions.length ? 'pnpm --filter @black-whale/canon-compiler enrich:dev' : null,
    },
    null,
    2,
  ),
)
