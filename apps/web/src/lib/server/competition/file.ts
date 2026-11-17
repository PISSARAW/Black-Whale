import {
  mkdirSync,
  readFileSync,
  openSync,
  writeFileSync,
  fsyncSync,
  closeSync,
  renameSync,
  unlinkSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { OnlineSnapshot } from '$lib/fighting/online/types'
import { readCompetitionSnapshot } from './validation'
export interface CompetitionStorage {
  load(): OnlineSnapshot | undefined
  save(value: OnlineSnapshot): void
}
export function competitionFile(
  path = resolve(process.env.CLASH_DATA_DIR ?? '.clash-data', 'competition.json'),
): CompetitionStorage {
  return {
    load() {
      try {
        const text = readFileSync(path, 'utf8')
        if (text.length > 64_000_000) throw Error('COMPETITION_STORAGE')
        return readCompetitionSnapshot(JSON.parse(text))
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
        throw error
      }
    },
    save(value) {
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
      const temporary = `${path}.${process.pid}.${crypto.randomUUID()}.tmp`
      let fd: number | undefined
      try {
        fd = openSync(temporary, 'wx', 0o600)
        writeFileSync(fd, JSON.stringify(value), 'utf8')
        fsyncSync(fd)
        closeSync(fd)
        fd = undefined
        renameSync(temporary, path)
      } finally {
        if (fd !== undefined) closeSync(fd)
        try {
          unlinkSync(temporary)
        } catch {
          /* renamed or not created */
        }
      }
    },
  }
}
