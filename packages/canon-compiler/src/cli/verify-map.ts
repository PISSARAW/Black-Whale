import { loadCatalogue } from '../catalogue.js'
import { verifyMapCoverage } from '../verify/coverage.js'
import { loadVerifyWorld } from '../verify/load.js'
import { run } from './run.js'

/**
 * A non-zero exit means the map and the catalogue have drifted apart. Run it
 * after any compile.
 */
run(async (prisma) => {
  const { characters } = loadCatalogue()
  const failures = verifyMapCoverage(characters, await loadVerifyWorld(prisma))

  if (failures.length === 0) {
    console.log(`Carte vérifiée : ${characters.length} fiches concordent avec leurs présences.`)
    return undefined
  }
  console.error(`${failures.length} incohérences de carte :\n`)
  for (const failure of failures) console.error(`  ${failure.scope}: ${failure.message}`)
  process.exitCode = 1
  return undefined
})
