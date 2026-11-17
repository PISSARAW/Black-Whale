import { mkdir, mkdtemp, readFile, writeFile, readdir, copyFile, symlink } from 'node:fs/promises'
import { dirname, resolve, join, relative, extname } from 'node:path'
import { createHash } from 'node:crypto'
import fg from 'fast-glob'
import { referenceSources } from './combat-reference-files'

const root = process.cwd()
const output = resolve(
  process.env.CLASH_QUALIFICATION_OUTPUT ?? 'output/clash-command-qualification',
)
const bundle = join(output, 'production')
const measured = JSON.parse(await readFile(join(output, 'qualification.json'), 'utf8'))
await mkdir(resolve('output'), { recursive: true })
const snapshot = await mkdtemp(resolve('output/clash-qualification-source-'))
await referenceSources({ copyTo: snapshot })
const extras = await fg([
  'apps/web/src/**/*.css',
  'apps/web/ui-tests/fighting-{performance,qualification}/**/*.{ts,svelte,html}',
])
for (const path of extras) {
  await mkdir(dirname(join(snapshot, path)), { recursive: true })
  await copyFile(path, join(snapshot, path))
}
const restored = new Map<string, string>()
for (const mapPath of await fg('**/*.js.map', { cwd: bundle, absolute: true })) {
  const map = JSON.parse(await readFile(mapPath, 'utf8'))
  for (let index = 0; index < map.sources.length; index++) {
    const source = map.sources[index] as string,
      content = map.sourcesContent[index] as string | null
    if (!content || source.includes('\0')) continue
    const path = relative(root, resolve(dirname(mapPath), source))
    if (
      path.startsWith('..') ||
      path.includes('node_modules/') ||
      !['.ts', '.js', '.svelte', '.json'].includes(extname(path))
    )
      continue
    if (extname(path) === '.json') {
      try {
        JSON.parse(content)
      } catch {
        continue
      }
    }
    const previous = restored.get(path)
    if (previous !== undefined && previous !== content)
      throw Error(`Conflicting measured source: ${path}`)
    restored.set(path, content)
    await mkdir(dirname(join(snapshot, path)), { recursive: true })
    await writeFile(join(snapshot, path), content)
  }
}
const overlays = []
for (const path of [
  'apps/web/ui-tests/fighting-qualification/Fixture.svelte',
  'apps/web/ui-tests/fighting-qualification/soakSchedule.ts',
]) {
  const corrected = await readFile(path, 'utf8')
  const original = restored.get(path)
  overlays.push({
    path,
    originalSha256: original ? hash(original) : null,
    correctedSha256: hash(corrected),
  })
  await writeFile(join(snapshot, path), corrected)
}
const packages = (await readdir(join(root, 'packages'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
for (const location of ['', 'apps/web', ...packages.map((name) => `packages/${name}`)]) {
  const original = join(root, location, 'node_modules'),
    target = join(snapshot, location, 'node_modules')
  await mkdir(join(target, '@black-whale'), { recursive: true })
  for (const name of await readdir(original).catch(() => []))
    if (name !== '@black-whale') await symlink(join(original, name), join(target, name))
  for (const name of packages)
    await symlink(join(snapshot, 'packages', name), join(target, '@black-whale', name))
}
await symlink(join(root, 'apps/web/static'), join(snapshot, 'apps/web/static'))
await symlink(join(root, 'apps/web/.svelte-kit'), join(snapshot, 'apps/web/.svelte-kit'))
const provenance = {
  originalBundleSha256: measured.bundle.sha256,
  measuredRuleset: measured.measuredRuleset,
  purpose: 'Restore measured application sources; overlay only the soak clock/progress harness fix',
  restored: [...restored].map(([path, content]) => ({ path, sha256: hash(content) })),
  overlays,
}
await writeFile(
  join(snapshot, 'source-provenance.json'),
  JSON.stringify(provenance, null, 2) + '\n',
)
await writeFile(join(output, 'corrected-source-path.txt'), join(snapshot, 'apps/web') + '\n')
console.log(
  `Restored ${restored.size} measured application files; two harness overlays; ${join(snapshot, 'apps/web')}`,
)

function hash(content: string) {
  return createHash('sha256').update(content).digest('hex')
}
