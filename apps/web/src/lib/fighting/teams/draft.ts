import { FIGHTING_ROSTER } from '../roster'
import { FIGHT_STAGES, type FightStageId } from '../stages'
import type { FighterId, FightSide } from '../types'
export interface TeamDraft {
  version: 1
  rosters: Record<FightSide, FighterId[]>
  stage: FightStageId
  interactive: boolean
}
export const TEAM_DRAFT_KEY = 'black-whale:clash:teams:draft:1'
export interface DraftStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export const defaultTeamDraft = (): TeamDraft => ({
  version: 1,
  rosters: { player: ['kurapika', 'hisoka', 'theta'], opponent: ['chrollo', 'franklin', 'hanzo'] },
  stage: 'heavens-arena',
  interactive: false,
})
export function validTeamRoster(value: unknown): value is FighterId[] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    new Set(value).size === 3 &&
    value.every((id) => FIGHTING_ROSTER.some((f) => f.id === id))
  )
}
export function validTeamDraft(value: unknown): value is TeamDraft {
  if (!value || typeof value !== 'object') return false
  const d = value as Partial<TeamDraft>
  return (
    d.version === 1 &&
    Boolean(d.rosters) &&
    validTeamRoster(d.rosters?.player) &&
    validTeamRoster(d.rosters?.opponent) &&
    typeof d.interactive === 'boolean' &&
    FIGHT_STAGES.some((s) => s.id === d.stage)
  )
}
export function moveTeamSlot(roster: FighterId[], from: number, to: number): FighterId[] {
  if (![from, to].every((i) => Number.isInteger(i) && i >= 0 && i < roster.length)) return roster
  const next = [...roster]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}
export function readTeamDraft(storage?: Pick<DraftStorage, 'getItem'>) {
  try {
    const text = storage?.getItem(TEAM_DRAFT_KEY)
    if (!text) return { draft: defaultTeamDraft(), issue: null }
    if (text.length > 4096) throw Error('INVALID_TEAM_DRAFT')
    const draft: unknown = JSON.parse(text)
    if (!validTeamDraft(draft)) throw Error('INVALID_TEAM_DRAFT')
    return { draft: structuredClone(draft), issue: null }
  } catch {
    return { draft: defaultTeamDraft(), issue: 'unavailable' as const }
  }
}
export function saveTeamDraft(storage: DraftStorage | undefined, draft: TeamDraft): boolean {
  if (!validTeamDraft(draft)) return false
  try {
    storage?.setItem(TEAM_DRAFT_KEY, JSON.stringify(draft))
    return Boolean(storage)
  } catch {
    return false
  }
}
