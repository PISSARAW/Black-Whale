import { FIGHTING_ROSTER } from '../roster'
import type { SoloSave, SoloRun, SoloObjective, SoloResult } from './types'
import { SOLO_ROUTES, SOLO_MODES, encounterIds, SURVIVAL_FIGHTERS } from './catalogue'
import { readSoloCarry } from './setup'
import { REPLAY_RULESET } from '../fightReplayTypes'
const object = (v: unknown): v is Record<string, unknown> =>
  Boolean(v && typeof v === 'object' && !Array.isArray(v))
const integer = (v: unknown, max = 10000000): v is number =>
  Number.isInteger(v) && Number(v) >= 0 && Number(v) <= max
const fail = (): never => {
  throw Error('INVALID_SOLO_SAVE')
}
const recordKeys = ['survival', 'time-attack', 'score-attack'] as const
function record(v: unknown): boolean {
  return (
    object(v) &&
    integer(v.wins, 5) &&
    integer(v.frames, 100000) &&
    integer(v.score) &&
    typeof v.cleared === 'boolean'
  )
}
function objective(v: unknown): v is SoloObjective {
  if (!object(v)) return false
  return (
    ['start', 'lastFrame', 'lastImpact', 'held'].every((k) => integer(v[k])) &&
    typeof v.contact === 'boolean' &&
    typeof v.threat === 'boolean'
  )
}
function result(v: unknown): v is SoloResult {
  return (
    object(v) && typeof v.encounter === 'string' && integer(v.frames, 100000) && integer(v.score)
  )
}
function runIdentity(v: Record<string, unknown>) {
  if (typeof v.id !== 'string' || !v.id || v.id.length > 100) return false
  return (
    SOLO_MODES.some((m) => m.id === v.mode) &&
    SOLO_ROUTES.some((r) => r.id === v.route) &&
    FIGHTING_ROSTER.some((f) => f.id === v.fighter) &&
    integer(v.seed, 0xffffffff)
  )
}
function runState(v: Record<string, unknown>) {
  if (!['briefing', 'playing', 'won', 'failed', 'complete'].includes(String(v.status))) return false
  if (
    ![null, 'defeat', 'timeout', 'object-lost', 'objective', 'invalid'].includes(v.failure as null)
  )
    return false
  return (
    integer(v.index, 4) && integer(v.elapsed, 100000) && integer(v.score) && objective(v.objective)
  )
}
function readRun(value: unknown): SoloRun | null {
  if (value === null) return null
  if (!object(value) || !runIdentity(value) || !runState(value)) return fail()
  if (!validResults(value.results)) return fail()
  const run = value as unknown as SoloRun,
    ids = encounterIds(run)
  if (run.index >= ids.length || run.results.some((r, i) => r.encounter !== ids[i])) return fail()
  if (!validResultCount(run, ids.length)) return fail()
  validateCarry(run)
  return structuredClone(run)
}
function validResults(v: unknown): v is SoloResult[] {
  return Array.isArray(v) && v.length <= 5 && v.every(result)
}
function validResultCount(run: SoloRun, total: number) {
  if (run.status === 'complete')
    return (
      run.results.length === total ||
      (run.mode === 'score-attack' && run.elapsed >= 10800 && run.results.length === run.index)
    )
  return run.results.length === run.index + Number(run.status === 'won')
}
function validateCarry(run: SoloRun) {
  if (run.mode !== 'survival') {
    if (run.carry !== undefined) fail()
    return
  }
  if (!SURVIVAL_FIGHTERS.includes(run.fighter)) return fail()
  const required = needsCarry(run)
  if (!required && run.carry === undefined) return
  if (typeof run.carry !== 'string' || run.carry.length > 1000000) return fail()
  try {
    readSoloCarry(run)
  } catch {
    fail()
  }
}
function needsCarry(run: SoloRun) {
  return run.index > 0 || run.status === 'won' || run.status === 'complete'
}
function readRoutes(value: unknown) {
  if (!Array.isArray(value) || value.length > 3) return fail()
  if (
    !value.every((id) => SOLO_ROUTES.some((r) => r.id === id)) ||
    new Set(value).size !== value.length
  )
    return fail()
  return structuredClone(value) as SoloSave['routes']
}
function readRecords(value: unknown) {
  if (
    !object(value) ||
    !Object.keys(value).every((k) => recordKeys.includes(k as (typeof recordKeys)[number]))
  )
    return fail()
  if (!Object.values(value).every(record)) return fail()
  return structuredClone(value) as SoloSave['records']
}
export function readSoloSave(text: string): SoloSave {
  if (text.length > 2000000) return fail()
  const value = JSON.parse(text)
  if (
    !object(value) ||
    value.version !== 1 ||
    typeof value.ruleset !== 'string' ||
    value.ruleset.length > 100
  )
    return fail()
  return {
    version: 1,
    ruleset: value.ruleset,
    routes: readRoutes(value.routes),
    records: readRecords(value.records),
    run: value.ruleset === REPLAY_RULESET ? readRun(value.run) : null,
  } as SoloSave
}
