import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { abilityModules } from '@black-whale/ability-modules'
import { loadCatalogue } from '../catalogue.js'
import { emitHatsuProfiles } from '../hatsu/emit.js'
import { compileHatsuProfiles } from '../hatsu/profiles.js'

/**
 * Writes `apps/web/src/lib/nen/hatsuProfiles.gen.ts`, or — with `--check` —
 * proves the committed file is what the compiler would write. CI runs the
 * second form: a registry edited by hand, or a module whose `site` block moved
 * without the file being regenerated, fails the build instead of shipping a
 * page that contradicts `data/`.
 */

const OUTPUT = 'apps/web/src/lib/nen/hatsuProfiles.gen.ts'

function repoRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
}

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  const check = argv.includes('--check')
  const { profiles, problems } = compileHatsuProfiles({
    modules: abilityModules,
    catalogue: loadCatalogue(),
  })

  if (problems.length > 0) {
    console.error(`The hatsu registry does not compile:\n  ${problems.join('\n  ')}`)
    return 1
  }

  const target = join(repoRoot(), OUTPUT)
  const compiled = await emitHatsuProfiles(profiles, target)

  if (check) {
    const committed = readFileSync(target, 'utf8')
    if (committed === compiled) {
      console.warn(`${OUTPUT} is up to date (${profiles.length} abilities).`)
      return 0
    }
    console.error(
      `${OUTPUT} is stale. Run \`pnpm --filter @black-whale/canon-compiler compile:hatsu\` and commit the result.`,
    )
    return 1
  }

  writeFileSync(target, compiled)
  console.warn(`${OUTPUT} written (${profiles.length} abilities).`)
  return 0
}

process.exitCode = await main()
