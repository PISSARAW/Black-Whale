import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { abilityModules } from '@black-whale/ability-modules'
import { compileArenaContracts } from '../arena/contracts.js'
import { emitArenaContracts } from '../arena/emit.js'
import { loadCatalogue } from '../catalogue.js'
import { emitHatsuProfiles } from '../hatsu/emit.js'
import { emitInteractionManifests } from '../hatsu/emitManifests.js'
import { compileInteractionManifests } from '../hatsu/manifests.js'
import { compileHatsuProfiles } from '../hatsu/profiles.js'
import { emitLocaleSkeleton } from '../hatsu/skeleton.js'

/**
 * Writes what the modules and `data/` say about the hatsu, or — with `--check`
 * — proves the committed files are what the compiler would write. CI runs the
 * second form: a table edited by hand, or a module whose `site` or `arena`
 * block moved without the files being regenerated, fails the build instead of
 * shipping a page that contradicts `data/`.
 *
 * Two files, one command, because they are one fact seen twice: the registry
 * says what each ability is, the arena table what it costs to cast. Splitting
 * the command would let a module change and only half of its consequences be
 * regenerated.
 *
 * `--skeleton` prints instead the French entries missing from the locale
 * catalogue, ready to paste and translate.
 */

const REGISTRY = 'apps/web/src/lib/nen/hatsuProfiles.gen.ts'
const MANIFESTS = 'apps/web/src/lib/nen/interactionManifests.gen.ts'
const ARENA = 'apps/web/src/lib/arena/hatsu/contracts.gen.ts'
const FRENCH = 'apps/web/src/lib/i18n/messages/hatsu-fr.ts'

function repoRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
}

interface Emission {
  /** Repo-relative path, as the messages name it. */
  output: string
  source: string
  /** What was compiled, for the line printed on success. */
  summary: string
}

/** Writes one emission, or reports it stale. Returns the process exit code. */
function settle(emission: Emission, check: boolean): number {
  const target = join(repoRoot(), emission.output)
  if (!check) {
    writeFileSync(target, emission.source)
    console.warn(`${emission.output} written (${emission.summary}).`)
    return 0
  }
  if (readFileSync(target, 'utf8') === emission.source) {
    console.warn(`${emission.output} is up to date (${emission.summary}).`)
    return 0
  }
  console.error(
    `${emission.output} is stale. Run \`pnpm --filter @black-whale/canon-compiler compile:hatsu\` and commit the result.`,
  )
  return 1
}

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  const check = argv.includes('--check')
  const catalogue = loadCatalogue()
  const { profiles, problems } = compileHatsuProfiles({ modules: abilityModules, catalogue })

  if (problems.length > 0) {
    console.error(`The hatsu registry does not compile:\n  ${problems.join('\n  ')}`)
    return 1
  }

  if (argv.includes('--skeleton')) {
    // Which ids the catalogue already carries, read off the file rather than
    // imported: this runs in Node, and the locale catalogue is app source.
    const french = readFileSync(join(repoRoot(), FRENCH), 'utf8')
    const translated = new Set(
      [...french.matchAll(/^ {2}'?([a-z0-9-]+)'?: \{$/gm)].map((match) => match[1] as string),
    )
    const skeleton = emitLocaleSkeleton(profiles, translated)
    console.warn(skeleton || `${FRENCH} covers all ${profiles.length} abilities.`)
    return 0
  }

  const interactions = compileInteractionManifests({ modules: abilityModules, catalogue })
  if (interactions.problems.length > 0) {
    console.error(
      `The interaction manifests do not compile:\n  ${interactions.problems.join('\n  ')}`,
    )
    return 1
  }

  const arena = compileArenaContracts({ modules: abilityModules, catalogue })
  if (arena.problems.length > 0) {
    console.error(`The arena contracts do not compile:\n  ${arena.problems.join('\n  ')}`)
    return 1
  }

  const registryTarget = join(repoRoot(), REGISTRY)
  const manifestTarget = join(repoRoot(), MANIFESTS)
  const arenaTarget = join(repoRoot(), ARENA)
  const emissions: Emission[] = [
    {
      output: REGISTRY,
      source: await emitHatsuProfiles(profiles, registryTarget),
      summary: `${profiles.length} abilities`,
    },
    {
      output: MANIFESTS,
      source: await emitInteractionManifests(interactions.manifests, manifestTarget),
      summary: `${interactions.manifests.length} manifests`,
    },
    {
      output: ARENA,
      source: await emitArenaContracts(arena.contracts, arenaTarget),
      summary: `${arena.contracts.length} contracts`,
    },
  ]

  // Both are settled before the code is returned: on a stale check the reader
  // gets the full list of files to regenerate, not the first one only.
  return emissions.map((emission) => settle(emission, check)).reduce((a, b) => Math.max(a, b), 0)
}

process.exitCode = await main()
