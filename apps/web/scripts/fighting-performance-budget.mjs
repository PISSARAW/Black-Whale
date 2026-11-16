export function fightingPerformanceBudget(result) {
  const rate = result.over25ms / Math.max(1, result.intervals.count)
  const checks = {
    samples: result.intervals.count > 0 && result.intervals.min > 0 && result.droppedSamples === 0,
    cadence: result.fps >= 59,
    frameP95: result.intervals.p95 <= 17.5,
    frameP99: result.intervals.p99 <= 20,
    slowFrames: rate <= 0.01,
    renderCpu: result.renderCpu.p95 <= 12,
    replay: result.verified >= 1 && result.failure === '',
    effect: result.requiredEffectSeen === true,
    insetReuse: result.scenario !== 'future' || result.predictionContexts === 1,
    scene: result.failedScene === false,
  }
  return { checks, pass: Object.values(checks).every(Boolean) }
}

export function resourceDrift(samples) {
  const width = Math.min(300, Math.floor(samples.length / 2))
  if (!width) return null
  const first = samples.slice(0, width),
    last = samples.slice(-width)
  const peak = (rows, field) => Math.max(...rows.map((row) => row[field]))
  return {
    window: width,
    geometries: peak(last, 'geometries') - peak(first, 'geometries'),
    textures: peak(last, 'textures') - peak(first, 'textures'),
  }
}
