import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'

const [beforePath, afterPath, outputPath] = process.argv.slice(2)
assert.ok(beforePath && afterPath && outputPath, 'Expected before.json after.json comparison.json')
const before = JSON.parse(await readFile(beforePath, 'utf8'))
const after = JSON.parse(await readFile(afterPath, 'utf8'))
assert.equal(before.production, true)
assert.equal(after.production, true)
assert.equal(before.browser, after.browser)
assert.equal(before.machine, after.machine)
assert.equal(before.durationSeconds, after.durationSeconds)
assert.equal(before.warmupSeconds, after.warmupSeconds)
assert.equal(before.scope, after.scope)
assert.deepEqual(
  before.results.map((row) => row.id).sort(),
  after.results.map((row) => row.id).sort(),
)
const results = after.results.map((row) => {
  const previous = before.results.find((entry) => entry.id === row.id)
  for (const field of [
    'fighter',
    'stage',
    'effects',
    'live',
    'dpr',
    'tapeHash',
    'resolution',
    'renderer',
  ])
    assert.deepEqual(row[field], previous[field], `${row.id}: ${field} changed`)
  const slowRate = row.over25ms / row.intervals.count
  const checks = {
    fps: row.fps >= 59,
    p95: row.intervals.p95 <= 17.5,
    p99: row.intervals.p99 <= 20,
    slowRate: slowRate <= 0.01,
    cpu: row.renderCpu.p95 <= 12,
    replay: row.verified >= 1 && row.failure === '',
    scene: row.failedScene === false,
  }
  return {
    id: row.id,
    before: {
      fps: previous.fps,
      cpuP95: previous.renderCpu.p95,
      gpuP95: previous.renderGpu.p95,
      frameP99: previous.intervals.p99,
      slowFrames: previous.over25ms,
      frames: previous.intervals.count,
    },
    after: {
      fps: row.fps,
      cpuP95: row.renderCpu.p95,
      gpuP95: row.renderGpu.p95,
      frameP99: row.intervals.p99,
      slowFrames: row.over25ms,
      frames: row.intervals.count,
    },
    renderCpuP95ChangePercent: 100 * (row.renderCpu.p95 / previous.renderCpu.p95 - 1),
    gpuHeadroom: {
      targetP95Ms: 12,
      supported: row.gpuSupported,
      reached: row.gpuSupported ? row.renderGpu.p95 <= 12 : null,
    },
    sameCombatHash: row.tapeHash,
    replayLoops: row.verified,
    checks,
    pass: Object.values(checks).every(Boolean),
  }
})
const report = {
  generated: new Date().toISOString(),
  before: { revision: before.revision, date: before.date },
  after: { revision: after.revision, date: after.date },
  budget:
    'FPS >=59; frame p95 <=17.5ms, p99 <=20ms; >25ms <=1%; render CPU p95 <=12ms; GPU duration reported separately with a 12ms headroom target; complete replay validated. Headless cadence is not a physical presentation or input-latency measurement.',
  results,
  pass: results.every((row) => row.pass),
}
await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n')
for (const row of results)
  process.stdout.write(
    `${row.id}: ${row.before.fps.toFixed(2)} → ${row.after.fps.toFixed(2)} FPS; CPU p95 ${row.before.cpuP95.toFixed(2)} → ${row.after.cpuP95.toFixed(2)}ms; ${row.pass ? 'PASS' : 'FAIL'}\n`,
  )
assert.equal(report.pass, true, 'Performance budget failed; see comparison report')
