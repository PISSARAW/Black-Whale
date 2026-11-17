import { readFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FightReplay } from '../apps/web/src/lib/fighting/fightReplayTypes'

export async function loadFrozenCombatTapes(directoryOverride?: string) {
  const directory = resolve(
    directoryOverride ??
      process.env.CLASH_REFERENCE_DIRECTORY ??
      fileURLToPath(
        new URL('../apps/web/ui-tests/fighting-reference/reference/v17', import.meta.url),
      ),
  )
  const baseline = JSON.parse(await readFile(resolve(directory, 'baseline.json'), 'utf8')) as {
    ruleset: string
    sourceFingerprint: string
    rows: { id: string; file: string; initialHash: string; finalHash: string }[]
  }
  const archive = await readFile(resolve(directory, 'replays.tar.gz'))
  const archiveSha256 = createHash('sha256').update(archive).digest('hex')
  const expected = (await readFile(resolve(directory, 'SHA256SUMS'), 'utf8'))
    .split('\n')
    .find((line) => line.endsWith('  replays.tar.gz'))
    ?.split(' ')[0]
  if (archiveSha256 !== expected) throw Error('Frozen replay archive checksum mismatch')
  const files = untar(gunzipSync(archive))
  const selected = baseline.rows.filter((row) => row.id.endsWith('-right-center-6'))
  const tapes = Object.fromEntries(
    selected.map((row) => {
      const text = files.get(row.file)
      if (!text) throw Error(`Missing frozen tape: ${row.file}`)
      return [row.id, JSON.parse(text) as FightReplay]
    }),
  )
  return {
    ruleset: baseline.ruleset,
    sourceFingerprint: baseline.sourceFingerprint,
    archiveSha256,
    rows: selected,
    tapes,
  }
}

/** The retained replay archive contains regular files with short POSIX paths. */
function untar(buffer: Buffer) {
  const files = new Map<string, string>()
  for (let offset = 0; offset + 512 <= buffer.length;) {
    const header = buffer.subarray(offset, offset + 512)
    const name = header.subarray(0, 100).toString('utf8').split('\0')[0]
    if (!name) break
    const size = parseInt(header.subarray(124, 136).toString('ascii').replace(/\0/g, '').trim(), 8)
    if (!Number.isFinite(size)) throw Error('Invalid frozen archive header')
    const content = buffer.subarray(offset + 512, offset + 512 + size)
    if (header[156] === 0 || header[156] === 48) files.set(name, content.toString('utf8'))
    offset += 512 + Math.ceil(size / 512) * 512
  }
  return files
}
