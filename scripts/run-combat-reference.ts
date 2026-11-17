import { mkdtemp, mkdir, readdir, symlink, rm, readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve, join } from 'node:path'
import { referenceSources } from './combat-reference-files'

const root = process.cwd()
const output = resolve(process.env.CLASH_REFERENCE_OUTPUT ?? 'output/clash-combat-reference')
const reference = resolve(
  process.env.CLASH_REFERENCE_DIRECTORY ?? 'apps/web/ui-tests/fighting-reference/reference',
)
await mkdir(resolve('output'), { recursive: true })
const snapshot = await mkdtemp(resolve('output/clash-reference-source-'))
const frozen = process.argv.includes('--frozen')

try {
  const sources = await captureSources()
  const packages = await readdir(join(root, 'packages'))
  const locations = ['', 'apps/web', ...packages.map((name) => `packages/${name}`)]
  for (const location of locations) await linkDependencies(location, packages)
  console.log(`Isolated source snapshot: ${sources.fingerprint}`)
  const require = createRequire(import.meta.url)
  execFileSync(
    process.execPath,
    [
      require.resolve('tsx/cli'),
      'scripts/report-combat-reference.ts',
      ...process.argv.slice(2).filter((argument) => argument !== '--frozen'),
    ],
    {
      cwd: snapshot,
      stdio: 'inherit',
      env: { ...process.env, CLASH_REFERENCE_OUTPUT: output, CLASH_REFERENCE_DIRECTORY: reference },
    },
  )
  if (frozen) {
    const comparison = JSON.parse(await readFile(join(output, 'comparison.json'), 'utf8')) as {
      sourceChanged: boolean
    }
    if (comparison.sourceChanged)
      throw Error('Archived source fingerprint does not match the frozen reference')
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await rm(snapshot, { recursive: true, force: true })
}

async function captureSources() {
  if (!frozen) return referenceSources({ copyTo: snapshot })
  if (process.argv.includes('--freeze')) throw Error('Cannot create a baseline from --frozen mode')
  execFileSync('tar', ['-xzf', join(reference, 'sources.tar.gz'), '-C', snapshot])
  return JSON.parse(await readFile(join(reference, 'sources.json'), 'utf8')) as {
    fingerprint: string
  }
}

/** External dependencies are reused; workspace imports always resolve inside the frozen copy. */
async function linkDependencies(location: string, packages: string[]) {
  const original = join(root, location, 'node_modules')
  const destination = join(snapshot, location, 'node_modules')
  await mkdir(destination, { recursive: true })
  const entries = await readdir(original).catch(() => [])
  for (const entry of entries) {
    if (entry === '@black-whale') continue
    await symlink(join(original, entry), join(destination, entry))
  }
  const workspace = join(destination, '@black-whale')
  await mkdir(workspace, { recursive: true })
  for (const name of packages)
    await symlink(join(snapshot, 'packages', name), join(workspace, name))
}
