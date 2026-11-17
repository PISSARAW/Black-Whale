import { REPLAY_RULESET } from '../fightReplayTypes'
import type { SoloSave, SoloRun, SoloMode } from './types'
import { readSoloSave } from './validation'
import { encounterIds } from './catalogue'
export const SOLO_STORAGE = 'black-whale:clash:solo:1'
export const emptySoloSave = (): SoloSave => ({
  version: 1,
  ruleset: REPLAY_RULESET,
  run: null,
  routes: [],
  records: {},
})
export interface SoloStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export function loadSoloSave(storage?: Pick<SoloStorage, 'getItem'>): {
  save: SoloSave
  issue: 'storage' | 'invalid' | 'rules' | null
} {
  try {
    const text = storage?.getItem(SOLO_STORAGE)
    if (!text) return { save: emptySoloSave(), issue: null }
    const save = readSoloSave(text)
    if (save.ruleset !== REPLAY_RULESET)
      return { save: { ...save, ruleset: REPLAY_RULESET, run: null, records: {} }, issue: 'rules' }
    return { save, issue: null }
  } catch (error) {
    return {
      save: emptySoloSave(),
      issue:
        error instanceof SyntaxError ||
        (error instanceof Error && error.message === 'INVALID_SOLO_SAVE')
          ? 'invalid'
          : 'storage',
    }
  }
}
export function saveSoloProgress(storage: SoloStorage | undefined, save: SoloSave) {
  try {
    const previous = loadSoloSave(storage).save
    const merged = {
      ...save,
      routes: [...new Set([...previous.routes, ...save.routes])],
      records: { ...previous.records },
    }
    for (const mode of ['survival', 'time-attack', 'score-attack'] as const) {
      const record = save.records[mode]
      if (record && betterRecord(mode, record, merged.records[mode])) merged.records[mode] = record
    }
    storage?.setItem(SOLO_STORAGE, JSON.stringify(merged))
    return Boolean(storage)
  } catch {
    return false
  }
}
export function completedSoloSave(save: SoloSave, run: SoloRun): SoloSave {
  const next = { ...save, run, records: { ...save.records }, routes: [...save.routes] }
  if (run.mode === 'story') {
    if (run.status === 'complete' && !next.routes.includes(run.route)) next.routes.push(run.route)
    return next
  }
  if (!['failed', 'complete'].includes(run.status)) return next
  const record = {
    wins: run.results.length,
    frames: run.elapsed,
    score: run.score,
    cleared: run.status === 'complete' && run.results.length === encounterIds(run).length,
  }
  if (run.mode === 'time-attack' && !record.cleared) return next
  if (betterRecord(run.mode, record, next.records[run.mode])) next.records[run.mode] = record
  return next
}
type RecordValue = NonNullable<SoloSave['records']['survival']>
export function betterRecord(mode: Exclude<SoloMode, 'story'>, a: RecordValue, b?: RecordValue) {
  if (!b) return true
  if (mode === 'score-attack') return a.score > b.score
  if (a.wins !== b.wins) return a.wins > b.wins
  if (mode === 'survival' && !a.cleared) return a.frames > b.frames
  return a.frames < b.frames
}
