import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readdir, readFile, writeFile, rm, access } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadFrozenCombatTapes } from './clash-frozen-tapes'
import {
  initialReplayState,
  executeReplayPacket,
} from '../apps/web/src/lib/fighting/fightReplayCommands'
import { createReplayRecorder } from '../apps/web/src/lib/fighting/fightReplayRecorder'
import { decodeFightReplay } from '../apps/web/src/lib/fighting/fightReplayCodec'
import { fightReplayHash } from '../apps/web/src/lib/fighting/fightReplayHash'
import { REPLAY_RULESET } from '../apps/web/src/lib/fighting/fightReplayTypes'
import { PVP_RULESET } from '../apps/web/src/lib/fighting/pvp/types'

const root = fileURLToPath(new URL('../', import.meta.url))
const original = join(root, 'apps/web/ui-tests/fighting-reference/reference')
const output = resolve(process.env.CLASH_COMBO_REFERENCE_OUTPUT ?? join(original, REPLAY_RULESET.replace('clash-combat-', 'v')))
if (
  await access(join(output, 'baseline.json')).then(
    () => true,
    () => false,
  )
)
  throw Error('Choose a new directory; existing reference recordings are immutable')
const frozen = await loadFrozenCombatTapes(original)
const temporary = await mkdtemp(join(tmpdir(), 'clash-reference-record-'))
const sha256 = (content: string | Buffer) => createHash('sha256').update(content).digest('hex')
const rows = []
try {
  await mkdir(join(temporary, 'replays'))
  for (const row of frozen.rows) {
    const source = frozen.tapes[row.id]
    let state = initialReplayState(source.setup)
    const initialHash = fightReplayHash(state)
    if (initialHash !== row.initialHash) throw Error(`Initial premise changed: ${row.id}`)
    const recorder = createReplayRecorder(state)
    if (!recorder) throw Error(`Cannot record ${row.id}`)
    for (const packet of source.packets) {
      const next = executeReplayPacket(state, packet)
      recorder.append(state, packet, next)
      state = next
    }
    const recorded = recorder.snapshot()
    if (!recorded || recorder.error) throw Error(`Recording failed: ${row.id}`)
    const replay = decodeFightReplay(JSON.stringify(recorded))
    if (JSON.stringify(replay.packets) !== JSON.stringify(source.packets))
      throw Error(`Input stream changed while recording ${row.id}`)
    await writeFile(join(temporary, row.file), JSON.stringify(replay) + '\n')
    rows.push({
      id: row.id,
      file: row.file,
      initialHash,
      finalHash: fightReplayHash(state),
      packets: replay.packets.length,
      checkpoints: replay.checkpoints.length,
      originalFinalHash: row.finalHash,
      inputPacketsSha256: sha256(JSON.stringify(source.packets)),
    })
  }
  const files = await sourceManifest(join(root, 'apps/web/src/lib/fighting'))
  const sourceFingerprint = sha256(JSON.stringify(files))
  await mkdir(output, { recursive: true })
  await writeFile(
    join(output, 'sources.json'),
    JSON.stringify(
      { scope: 'Combat TypeScript excluding tests', sourceFingerprint, files },
      null,
      2,
    ) + '\n',
  )
  await writeFile(
    join(output, 'baseline.json'),
    JSON.stringify(
      {
        version: 1,
        ruleset: REPLAY_RULESET,
        protocol: PVP_RULESET,
        sourceFingerprint,
        evidence: 're-recorded-original-command-streams',
        provenance: {
          originalRuleset: frozen.ruleset,
          originalArchiveSha256: frozen.archiveSha256,
          originalSourceFingerprint: frozen.sourceFingerprint,
          initialPremisesVerified: true,
          baseCommit: process.env.CLASH_REFERENCE_BASE_COMMIT ?? null,
        },
        rows,
      },
      null,
      2,
    ) + '\n',
  )
  const archive = join(output, 'replays.tar.gz')
  execFileSync('tar', ['-czf', archive, '-C', temporary, 'replays'], {
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  })
  await writeFile(
    join(output, 'SHA256SUMS'),
    `${sha256(await readFile(archive))}  replays.tar.gz\n`,
  )
  console.log(
    `Recorded ${rows.length} original command streams under ${REPLAY_RULESET}; ${rows.filter((row) => row.finalHash !== row.originalFinalHash).length} final states changed`,
  )
} finally {
  await rm(temporary, { recursive: true, force: true })
}

async function sourceManifest(directory: string): Promise<{ path: string; sha256: string }[]> {
  const rows: { path: string; sha256: string }[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) rows.push(...(await sourceManifest(path)))
    else if (path.endsWith('.ts') && !path.endsWith('.test.ts'))
      rows.push({ path: relative(root, path), sha256: sha256(await readFile(path)) })
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path))
}
