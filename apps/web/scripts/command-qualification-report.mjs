import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

export function distribution(values) {
  const sorted = values.slice().sort((a, b) => a - b)
  const percentile = (p) => sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] ?? null
  return {
    count: sorted.length,
    min: sorted[0] ?? null,
    p50: percentile(0.5),
    p95: percentile(0.95),
    p99: percentile(0.99),
    max: sorted.at(-1) ?? null,
  }
}

export function cadenceResult(raw) {
  const intervals = distribution(raw.samples.map((sample) => sample.interval))
  const cpu = distribution(raw.samples.map((sample) => sample.work))
  const sum = raw.samples.reduce((total, sample) => total + sample.interval, 0)
  const fps = sum ? (raw.samples.length * 1000) / sum : 0
  const slow =
    raw.samples.filter((sample) => sample.interval > 25).length / Math.max(1, raw.samples.length)
  const window = Math.min(300, Math.floor(raw.samples.length / 2))
  const peak = (rows, name) => Math.max(0, ...rows.map((row) => row[name]))
  const drift = {
    geometries:
      peak(raw.samples.slice(-window), 'geometries') -
      peak(raw.samples.slice(0, window), 'geometries'),
    textures:
      peak(raw.samples.slice(-window), 'textures') - peak(raw.samples.slice(0, window), 'textures'),
  }
  const checks = {
    samples: intervals.count > 0 && raw.dropped === 0,
    fps: fps >= 59,
    p95: intervals.p95 !== null && intervals.p95 <= 17.5,
    p99: intervals.p99 !== null && intervals.p99 <= 20,
    slow: slow <= 0.01,
    cpu: cpu.p95 !== null && cpu.p95 <= 12,
    replay: raw.verified > 0 && raw.failure === '',
    scene: !raw.failedScene,
    effect: raw.effectSeen === true,
  }
  return {
    fps,
    intervals,
    cpu,
    slowFraction: slow,
    resourceDrift: drift,
    checks,
    pass: Object.values(checks).every(Boolean),
  }
}

export function latencyResult(trials, requested) {
  const complete = trials.filter((trial) => trial.drawMs !== null)
  const drawn = distribution(complete.map((trial) => trial.drawMs))
  const executed = distribution(
    trials.flatMap((trial) => (trial.executionMs === null ? [] : [trial.executionMs])),
  )
  const queue = distribution(
    trials.flatMap((trial) => (trial.queueMs === undefined ? [] : [trial.queueMs])),
  )
  const missing = requested - complete.length
  return {
    requested,
    recorded: trials.length,
    missing,
    eventToDrawMs: drawn,
    eventToExecutionMs: executed,
    queueMs: queue,
    thresholdMs: (5 * 1000) / 60,
    pass:
      trials.length === requested &&
      missing === 0 &&
      drawn.p95 !== null &&
      drawn.p95 <= (5 * 1000) / 60,
  }
}

export async function bundleFingerprint(directory) {
  const files = []
  async function walk(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name)
      if (entry.isDirectory()) await walk(file)
      else
        files.push({
          path: path.relative(directory, file),
          sha256: createHash('sha256')
            .update(await readFile(file))
            .digest('hex'),
        })
    }
  }
  await walk(directory)
  files.sort((a, b) => a.path.localeCompare(b.path))
  return { sha256: createHash('sha256').update(JSON.stringify(files)).digest('hex'), files }
}
