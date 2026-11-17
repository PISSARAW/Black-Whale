import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { FIGHTING_ROSTER } from '../apps/web/src/lib/fighting/roster'
import { probeGroundedExchange } from '../apps/web/src/lib/fighting/exchangeProbe'
import { exchangeFighterProfile } from '../apps/web/src/lib/fighting/exchangeStudy'
import { REPLAY_RULESET } from '../apps/web/src/lib/fighting/fightReplayTypes'

const output = process.env.FIGHT_BALANCE_OUTPUT ?? '/tmp/black-whale-fighting-balance'
await mkdir(output, { recursive: true })
const rows = FIGHTING_ROSTER.flatMap(({ id }) =>
  (['player', 'opponent'] as const).flatMap((side) =>
    (['center', 'left', 'right'] as const).map((position) => ({
      fighter: id,
      defender: 'bill',
      side,
      position,
      ...probeGroundedExchange({ fighter: id, defender: 'bill', side, position }),
    })),
  ),
)
const report = {
  version: 1,
  ruleset: REPLAY_RULESET,
  evidence: 'scripted-engine-trials',
  premises: {
    frames: 360,
    slot: 'standingLight',
    guardAfterHits: 3,
    infiniteHealth: true,
    infiniteAura: false,
    arenaInteractions: false,
  },
  pass: rows.every(
    (row) =>
      row.hits >= 3 && row.maxCombo <= 6 && (row.position === 'center' || row.guardAt !== null),
  ),
  profiles: FIGHTING_ROSTER.map(({ id }) => exchangeFighterProfile(id)),
  rows,
}
await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(
  `${rows.length} scripted exchanges; pass=${report.pass}; ${join(output, 'report.json')}`,
)
if (!report.pass) process.exitCode = 1
if (process.argv.includes('--all-matchups')) {
  const matchups = FIGHTING_ROSTER.flatMap(({ id: fighter }) =>
    FIGHTING_ROSTER.map(({ id: defender }) => ({
      fighter,
      defender,
      ...probeGroundedExchange({ fighter, defender, position: 'right' }),
    })),
  )
  const pass = matchups.every((row) => row.hits >= 3 && row.maxCombo <= 6 && row.guardAt !== null)
  await writeFile(
    join(output, 'matchups.json'),
    JSON.stringify(
      {
        version: 1,
        ruleset: REPLAY_RULESET,
        evidence: 'scripted-engine-trials',
        position: 'right',
        premises: report.premises,
        pass,
        matchups,
      },
      null,
      2,
    ) + '\n',
  )
  console.log(`${matchups.length} ordered matchups; pass=${pass}`)
  if (!pass) process.exitCode = 1
}
