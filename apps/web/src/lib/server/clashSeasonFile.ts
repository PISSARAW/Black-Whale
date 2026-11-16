import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
  openSync,
  closeSync,
  fsyncSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { readSeasonSnapshot, type SeasonStorage, type SeasonSnapshot } from './clashSeasonSnapshot'

/** One server coordinator owns this volume. Never replace damaged data with an empty ranking. */
export function seasonFile(path: string): SeasonStorage {
  return {
    load() {
      try {
        const contents = readFileSync(path, 'utf8')
        if (contents.length > 64_000_000) throw Error('RANKING_STORAGE')
        return readSeasonSnapshot(JSON.parse(contents))
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
        throw Error('RANKING_STORAGE')
      }
    },
    save(snapshot: SeasonSnapshot) {
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
      const temporary = `${path}.${process.pid}.${crypto.randomUUID()}.tmp`
      let descriptor: number | undefined
      try {
        descriptor = openSync(temporary, 'wx', 0o600)
        writeFileSync(descriptor, JSON.stringify(snapshot), 'utf8')
        fsyncSync(descriptor)
        closeSync(descriptor)
        descriptor = undefined
        renameSync(temporary, path)
      } finally {
        if (descriptor !== undefined) closeSync(descriptor)
        try {
          unlinkSync(temporary)
        } catch {
          /* rename already removed it */
        }
      }
    },
  }
}
export const defaultSeasonFile = () =>
  seasonFile(resolve(process.env.CLASH_DATA_DIR ?? '.clash-data', 'seasons.json'))
