import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const before = process.env.FIGHT_PERF_BEFORE_BUNDLE
const after = process.env.FIGHT_PERF_AFTER_BUNDLE
assert.ok(before && after, 'Set FIGHT_PERF_BEFORE_BUNDLE and FIGHT_PERF_AFTER_BUNDLE')
const output = process.env.FIGHT_PERF_OUTPUT ?? '/tmp/black-whale-performance-pairs'
const cases =
  process.env.FIGHT_PERF_CASES?.split(',') ??
  ['kurapika', 'hisoka', 'chrollo', 'benjamin'].flatMap((id) => [`${id}-desktop`, `${id}-live`])
await mkdir(output, { recursive: true })
const reports = { before: [], after: [] }
function run(script, args = [], env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts', script), ...args], {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('exit', (code) =>
      code === 0 ? resolve() : reject(Error(`${script}: exit ${code}`)),
    )
  })
}
for (const [index, id] of cases.entries()) {
  for (const side of index % 2 ? ['after', 'before'] : ['before', 'after']) {
    const directory = path.join(output, side, id)
    await run('check-fighting-performance.mjs', [], {
      FIGHT_PERF_BUNDLE: side === 'before' ? before : after,
      FIGHT_PERF_OUTPUT: directory,
      FIGHT_PERF_CASES: id,
      FIGHT_PERF_LABEL: side,
      FIGHT_PERF_PROFILE: process.env.FIGHT_PERF_PROFILE_CASES?.split(',').includes(id)
        ? (process.env.FIGHT_PERF_PROFILE ?? '8')
        : '0',
      FIGHT_PERF_REVISION:
        side === 'before'
          ? (process.env.FIGHT_PERF_BEFORE_REVISION ?? 'before')
          : (process.env.FIGHT_PERF_AFTER_REVISION ?? 'after'),
    })
    reports[side].push(JSON.parse(await readFile(path.join(directory, 'report.json'), 'utf8')))
    const entries = reports[side]
    await writeFile(
      path.join(output, `${side}.json`),
      JSON.stringify(
        {
          ...entries[0],
          results: entries.flatMap((report) => report.results),
          caseDates: entries.map((report) => report.date),
          protocol:
            'Paired alternating order, fresh browser process per case; all samples retained.',
        },
        null,
        2,
      ) + '\n',
    )
  }
}
await run('compare-fighting-performance.mjs', [
  path.join(output, 'before.json'),
  path.join(output, 'after.json'),
  path.join(output, 'comparison.json'),
])
