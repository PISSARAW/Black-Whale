import { mkdir, readFile, access } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { combatRoutesFor } from '../apps/web/src/lib/fighting/combatRoutes'
import { moveForSlot } from '../apps/web/src/lib/fighting/movesets'
import {
  BASELINE_VERSION,
  BASELINE_SEED,
  BASELINE_FIGHTERS,
  BASELINE_SITUATIONS,
  BASELINE_TERRAINS,
} from '../apps/web/src/lib/fighting/combatBaseline'
import { runBaselineRoute } from '../apps/web/src/lib/fighting/combatBaselineRoutes'
import { runBaselineSituation } from '../apps/web/src/lib/fighting/combatBaselineSituations'
import { REPLAY_RULESET, REPLAY_VERSION } from '../apps/web/src/lib/fighting/fightReplayTypes'
import { PVP_RULESET } from '../apps/web/src/lib/fighting/pvp/types'
import { EXCHANGE_TRIALS } from '../apps/web/src/lib/fighting/exchangeStudy'
import {
  sha256,
  referenceSources,
  writeReferenceReplay,
  writeReferenceJson,
  archiveReferenceReplays,
  archiveReferenceSources,
} from './combat-reference-files'
import type { BaselineTerrain } from '../apps/web/src/lib/fighting/combatBaseline'
import { compareCombatReference } from './combat-reference-compare'

const output = resolve(process.env.CLASH_REFERENCE_OUTPUT ?? 'output/clash-combat-reference')
const reference = resolve(
  process.env.CLASH_REFERENCE_DIRECTORY ?? 'apps/web/ui-tests/fighting-reference/reference',
)
const baselinePath = join(reference, 'baseline.json')
const freeze = process.argv.includes('--freeze')
if (
  freeze &&
  (await access(baselinePath).then(
    () => true,
    () => false,
  ))
)
  throw Error(
    'A frozen baseline already exists. Choose a new reference directory in a reviewed change.',
  )
await mkdir(output, { recursive: true })
const sources = await referenceSources()
const rows: ReturnType<typeof summary>[] = []
const details: unknown[] = []
const terrains = Object.keys(BASELINE_TERRAINS) as BaselineTerrain[]

for (const fighter of BASELINE_FIGHTERS) {
  for (const terrain of terrains) {
    for (const route of combatRoutesFor(fighter)) {
      for (const mirrored of [false, true])
        for (const corner of [false, true])
          for (const gap of [4, 6] as const) {
            const id = `route-${route.id.replace(':', '-')}-${terrain}-${mirrored ? 'left' : 'right'}-${corner ? 'corner' : 'center'}-${gap}`
            const result = runBaselineRoute({ route, terrain, mirrored, corner, gap })
            const file = await writeReferenceReplay(output, id, result.replay)
            const data = { ...result.route, ...result.measurement }
            rows.push(summary({ id, kind: 'route', file, data, completed: result.route.completed }))
            details.push({ id, terrain, mirrored, corner, gap, file, ...data })
          }
    }
    for (const situation of BASELINE_SITUATIONS) {
      const id = `situation-${fighter}-${situation}-${terrain}`
      const result = runBaselineSituation({ fighter, situation, terrain })
      const file = await writeReferenceReplay(output, id, result.replay)
      rows.push(summary({ id, kind: 'situation', file, data: result.measurement }))
      details.push({ id, fighter, situation, terrain, file, ...result.measurement })
    }
  }
  console.log(`Recorded and replay-verified: ${fighter}`)
}

const report = {
  version: BASELINE_VERSION,
  ruleset: REPLAY_RULESET,
  protocol: PVP_RULESET,
  replayVersion: REPLAY_VERSION,
  seed: BASELINE_SEED,
  evidence: 'scripted-engine-reference',
  sourceFingerprint: sources.fingerprint,
  catalog: BASELINE_FIGHTERS.flatMap((fighter) =>
    combatRoutesFor(fighter).map((route) => ({
      ...route,
      moves: route.moves.map((slot) => {
        const move = moveForSlot(fighter, slot)!
        return {
          slot,
          tuning: move.tuning,
          cancelInto: move.cancelInto,
          linkInto: move.linkInto ?? [],
          cancelOnBlockInto: move.cancelOnBlockInto,
        }
      }),
    })),
  ),
  premises: {
    mode: 'training',
    format: 'knockout',
    health: 300,
    auraBeforePreparation: 100,
    infiniteHealth: false,
    infiniteAura: false,
    fps: 60,
    terrains: BASELINE_TERRAINS,
    routeFramesMax: 240,
    situationFrames: 240,
    routeOpponent: 'chrollo, or hisoka for Chrollo',
    preparation:
      'Existing Academy setup uses real commands/time before the initial snapshot; resulting resources are retained.',
    scope:
      'Six fighters, eight routes each, two orientations, two distances, center/corner, two terrains; seven situations per fighter/terrain.',
  },
  rows,
}
const finalSources = await referenceSources()
if (finalSources.fingerprint !== sources.fingerprint)
  throw Error('Source files changed during measurement. Rerun to freeze one consistent version.')
await writeReferenceJson(join(output, 'sources.json'), sources)
await writeReferenceJson(join(output, 'report.json'), { ...report, details })
const failures = rows.filter((row) => row.completed === false)
if (freeze) {
  await mkdir(reference, { recursive: true })
  await writeReferenceJson(baselinePath, report)
  await writeReferenceJson(join(reference, 'sources.json'), sources)
  archiveReferenceReplays({ output, destination: join(reference, 'replays.tar.gz') })
  await archiveReferenceSources({
    output,
    destination: join(reference, 'sources.tar.gz'),
    files: sources.files,
  })
  console.log(`Frozen ${rows.length} cases; incomplete routes: ${failures.length}; ${baselinePath}`)
} else {
  const expected = JSON.parse(await readFile(baselinePath, 'utf8')) as typeof report
  const comparison = compareCombatReference(expected, report)
  await writeReferenceJson(join(output, 'comparison.json'), comparison)
  console.log(
    `Compared ${rows.length} cases; changed=${comparison.changed.length}; sourceChanged=${comparison.sourceChanged}`,
  )
  if (!comparison.pass) process.exitCode = 1
}
await writeReferenceJson(join(output, 'findings.json'), {
  incompleteRoutes: failures,
  humanBalance: 'not evaluated',
  physicalLatency: 'not measured',
})
await writeReferenceJson(join(output, 'situations.json'), EXCHANGE_TRIALS)

function summary(options: {
  id: string
  kind: 'route' | 'situation'
  file: string
  data: ReturnType<typeof runBaselineSituation>['measurement']
  completed?: boolean
}) {
  return {
    id: options.id,
    kind: options.kind,
    file: options.file,
    digest: sha256(JSON.stringify(options.data)),
    initialHash: options.data.initialHash,
    finalHash: options.data.finalHash,
    completed: options.completed,
    healthLost: options.data.resources.opponent.healthLost,
    commandAuraDebited: options.data.commandAuraDebited.player,
    separation: options.data.separation,
  }
}
