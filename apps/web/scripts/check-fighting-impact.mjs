import assert from 'node:assert/strict'
import { mkdir, writeFile, symlink } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { build } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.IMPACT_OUTPUT ?? '/tmp/clash-impact-comparison'
await mkdir(output, { recursive: true })
await symlink(path.join(root, 'node_modules'), path.join(output, 'node_modules')).catch((error) => {
  if (error.code !== 'EEXIST') throw error
})
await build({
  configFile: false,
  root,
  publicDir: false,
  logLevel: 'warn',
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  build: {
    ssr: path.join(root, 'ui-tests/fighting-response/impactServer.ts'),
    outDir: path.join(output, 'bundle'),
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: 'impact.mjs' } },
  },
})
const lab = await import(pathToFileURL(path.join(output, 'bundle/impact.mjs')))
const results = []
function distribution(values) {
  const sorted = values.slice().sort((a, b) => a - b)
  return {
    count: sorted.length,
    p50: sorted[Math.ceil(sorted.length * 0.5) - 1] ?? 0,
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1] ?? 0,
    max: sorted.at(-1) ?? 0,
  }
}
const fighters = new Set(
  (process.env.IMPACT_FIGHTERS ?? 'kurapika,hisoka,chrollo,benjamin').split(','),
)
for (const route of lab.COMBAT_ROUTES.filter((route) => fighters.has(route.fighter)))
  for (const rtt of [0, 50, 100, 150])
    for (const serial of [true, false]) {
      const result = await lab.runImpactNetwork({
        ...lab.comboImpactPlan(route, 'player'),
        rtt,
        serial,
      })
      assert.deepEqual(result.failures, [])
      assert.ok(result.hashesMatch && result.replayMatches)
      const hits = result.contacts.filter((hit) => hit.impact.attacker === 'player')
      const complete =
        hits.length === route.moves.length &&
        hits.every(
          (hit, i) =>
            !hit.impact.blocked &&
            hit.impact.comboHits === i + 1 &&
            hit.move === `${route.fighter}:${route.moves[i]}`,
        )
      if (!serial) assert.ok(complete, `${route.id} @ ${rtt}ms`)
      const used = new Set()
      const queueToApplication = result.queues.flatMap((queue) => {
        const index = result.applications.findIndex(
          (entry, i) =>
            !used.has(i) &&
            entry.side === queue.side &&
            JSON.stringify(entry.command) === JSON.stringify(queue.command),
        )
        if (index < 0) return []
        used.add(index)
        return [(result.applications[index].frame * 1000) / 60 - queue.at]
      })
      results.push({
        route: route.id,
        rtt,
        serial,
        complete,
        commands: result.applications.length,
        queueToApplication,
        firstContactMs: hits.length ? (hits[0].frame * 1000) / 60 - result.queues[0].at : null,
      })
    }
const summary = [0, 50, 100, 150].flatMap((rtt) =>
  [true, false].map((serial) => {
    const rows = results.filter((row) => row.rtt === rtt && row.serial === serial)
    return {
      rtt,
      serial,
      routes: rows.length,
      completed: rows.filter((row) => row.complete).length,
      application: distribution(rows.flatMap((row) => row.queueToApplication)),
      firstContact: distribution(
        rows.flatMap((row) => (row.firstContactMs === null ? [] : [row.firstContactMs])),
      ),
    }
  }),
)
const report = {
  date: new Date().toISOString(),
  scope:
    'Production input sender and server referee. Deterministic timed input traces, not reactions to delayed views. Same 20/s + burst budget. Baseline serializes uploads until HTTP receipt; after uses cumulative pipelining. No faults in this timing comparison; the separate 1600-case regression adds upload/receipt loss and skipped views. RTT is simulated. No rendering or physical input latency is measured here.',
  results,
  summary,
}
await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
process.stdout.write(JSON.stringify(summary, null, 2) + '\n')
