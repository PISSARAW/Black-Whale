import { access, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { bundleFingerprint } from '../apps/web/scripts/command-qualification-report.mjs'

const output = resolve(
  process.env.CLASH_QUALIFICATION_OUTPUT ?? 'output/clash-command-qualification',
)
const destination = resolve(
  process.env.QUALIFICATION_REFERENCE_DIRECTORY ??
    'apps/web/ui-tests/fighting-qualification/reference/2026-11-17/final',
)
if (
  await access(destination).then(
    () => true,
    () => false,
  )
)
  throw Error('Qualification destination already exists; preserve it and choose a new directory')
const qualification = JSON.parse(await readFile(join(output, 'qualification.json'), 'utf8'))
const commands = JSON.parse(await readFile(join(output, 'commands.json'), 'utf8'))
if (!qualification.complete || (!qualification.fullScope && !process.argv.includes('--supplement')))
  throw Error('A complete campaign or an explicit --supplement is required before archiving')
if (commands.reference.archiveSha256 !== qualification.reference.archiveSha256)
  throw Error('Command and render campaigns used different frozen references')
if (commands.measuredRuleset !== qualification.measuredRuleset)
  throw Error('Command and render campaigns used different engine versions')
if ((await bundleFingerprint(join(output, 'production'))).sha256 !== qualification.bundle.sha256)
  throw Error('Measured bundle changed before archiving')
await mkdir(dirname(destination), { recursive: true })
const temporary = await mkdtemp(join(dirname(destination), 'pending-'))
try {
  const summary = {
    version: 1,
    pass: commands.pass,
    measuredRuleset: commands.measuredRuleset,
    reference: commands.reference,
    queueTrials: commands.queue.length,
    queueFailures: commands.queue.filter((row: { pass: boolean }) => !row.pass),
    frozenRoutes: commands.windows.length,
    checkpoints: commands.checkpoints,
    linkWindows: commands.linkWindows,
    observations: commands.windows.reduce(
      (sum: number, row: { observations: unknown[] }) => sum + row.observations.length,
      0,
    ),
    windows: commands.windows.map(
      (row: {
        id: string
        finalHash: string
        observations: { admitted: boolean; started: boolean }[]
      }) => ({
        id: row.id,
        finalHash: row.finalHash,
        count: row.observations.length,
        mismatches: row.observations.filter((sample) => sample.admitted !== sample.started).length,
      }),
    ),
  }
  await writeFile(
    join(temporary, 'qualification.json'),
    JSON.stringify(qualification, null, 2) + '\n',
  )
  await writeFile(join(temporary, 'commands.json'), JSON.stringify(summary, null, 2) + '\n')
  const data = (await readdir(output)).filter(
    (name) =>
      name.endsWith('.frames.json') ||
      name.endsWith('.png') ||
      ['commands.json', 'qualification.json', 'frozen-tapes.json'].includes(name),
  )
  execFileSync('tar', ['-czf', join(temporary, 'measurements.tar.gz'), '-C', output, ...data], {
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  })
  execFileSync('tar', ['-czf', join(temporary, 'bundle.tar.gz'), '-C', output, 'production'], {
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  })
  const checks = []
  for (const name of [
    'qualification.json',
    'commands.json',
    'measurements.tar.gz',
    'bundle.tar.gz',
  ])
    checks.push(
      `${createHash('sha256')
        .update(await readFile(join(temporary, name)))
        .digest('hex')}  ${name}`,
    )
  await writeFile(join(temporary, 'SHA256SUMS'), checks.join('\n') + '\n')
  await rename(temporary, destination)
  console.log(
    `Archived qualification: ${destination}; software pass=${qualification.pass && commands.pass}; physical testing pending`,
  )
} catch (error) {
  await rm(temporary, { recursive: true, force: true })
  throw error
}
