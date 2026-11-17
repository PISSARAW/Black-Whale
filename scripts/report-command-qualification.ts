import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { loadFrozenCombatTapes } from './clash-frozen-tapes'
import { BASELINE_FIGHTERS } from '../apps/web/src/lib/fighting/combatBaseline'
import {
  qualificationState,
  probeCommandQueue,
  probeRouteWindows,
} from '../apps/web/src/lib/fighting/commandQualification'
import { referenceSources } from './combat-reference-files'
import { probeRecoveryLink } from '../apps/web/src/lib/fighting/linkQualification'
import { REPLAY_RULESET } from '../apps/web/src/lib/fighting/fightReplayTypes'

const output = resolve(
  process.env.CLASH_QUALIFICATION_OUTPUT ?? 'output/clash-command-qualification',
)
await mkdir(output, { recursive: true })
const reference = await loadFrozenCombatTapes()
await writeFile(resolve(output, 'frozen-tapes.json'), JSON.stringify(reference))
const sources = await referenceSources()
const queue = []
for (const fighter of BASELINE_FIGHTERS) {
  const tape = reference.tapes[`route-${fighter}-confirm-neutral-right-center-6`]
  for (const side of ['player', 'opponent'] as const)
    for (const mirrored of [false, true])
      for (const hz of [120, 60, 30, 20])
        for (const stun of [0, 1, 5, 6, 7])
          queue.push({
            fighter,
            mirrored,
            ...probeCommandQueue({
              initial: qualificationState(tape, { side, mirrored }),
              side,
              hz,
              stun,
            }),
          })
  for (const hitstop of [1, 6, 12])
    queue.push({
      fighter,
      ...probeCommandQueue({
        initial: qualificationState(tape, { side: 'player', mirrored: false }),
        side: 'player',
        hz: 60,
        stun: 3,
        hitstop,
      }),
    })
  for (const side of ['player', 'opponent'] as const)
    for (const mirrored of [false, true])
      for (const hz of [120, 60, 30, 20])
        for (const slot of ['forwardHeavy', 'backHeavy', 'lowLight', 'airLight'] as const)
          queue.push({
            fighter,
            mirrored,
            ...probeCommandQueue({
              initial: qualificationState(tape, { side, mirrored }),
              side,
              hz,
              stun: 0,
              slot,
            }),
          })
}
const links = [
  ['kurapika', 'precision', 'forwardLight', 'standingHeavy'],
  ['chrollo', 'precision', 'standingHeavy', 'backHeavy'],
  ['phinks', 'charged', 'standingHeavy', 'finisher'],
] as const
const linkWindows = links.map(([fighter, route, from, to]) =>
  probeRecoveryLink({
    replay: reference.tapes[`route-${fighter}-${route}-neutral-right-center-6`],
    from,
    to,
  }),
)
const windows = Object.entries(reference.tapes).map(([id, tape]) => ({
  id,
  ...probeRouteWindows(tape),
}))
const checkpoints = windows.every(
  (row) => row.finalHash === reference.rows.find((entry) => entry.id === row.id)!.finalHash,
)
const pass =
  checkpoints &&
  linkWindows.every((row) => row.pass) &&
  queue.every((row) => row.pass) &&
  windows.every((row) => row.observations.every((sample) => sample.admitted === sample.started))
const report = {
  version: 1,
  evidence: 'scripted-software-command-qualification',
  reference: {
    ruleset: reference.ruleset,
    sourceFingerprint: reference.sourceFingerprint,
    archiveSha256: reference.archiveSha256,
  },
  sources,
  hardware: { physicalController: 'not available', physicalLatency: 'not measured' },
  measuredRuleset: REPLAY_RULESET,
  pass,
  checkpoints,
  queue,
  windows,
  linkWindows,
}
await writeFile(resolve(output, 'commands.json'), JSON.stringify(report, null, 2) + '\n')
console.log(
  `${queue.length} queue/buffer trials; ${windows.length} frozen routes; pass=${pass}; ${output}`,
)
if (!pass) process.exitCode = 1
