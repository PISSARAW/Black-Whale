import type { ArenaReplay } from './replay/types'
import type { ChallengeResult } from './challenges/types'
import { playReplay } from './replay/player'

export const ARENA_PROFILE_VERSION = 1
export const NEN_MASTERIES = [
  'ten',
  'zetsu',
  'ren',
  'gyo',
  'in',
  'ken',
  'ko',
  'ryu',
  'hatsu',
] as const
export type NenMastery = (typeof NEN_MASTERIES)[number]

export interface ArenaProfile {
  version: typeof ARENA_PROFILE_VERSION
  bouts: number
  wins: number
  bestGrades: Record<string, ChallengeResult['grade']>
  mastery: Record<NenMastery, number>
  unlocked: string[]
  replayIds: string[]
  updatedAt: string
}

export interface ProfileStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const ARENA_PROFILE_KEY = 'black-whale:arena-profile-v3'

export function freshArenaProfile(now = new Date(0)): ArenaProfile {
  return {
    version: ARENA_PROFILE_VERSION,
    bouts: 0,
    wins: 0,
    bestGrades: {},
    mastery: Object.fromEntries(NEN_MASTERIES.map((id) => [id, 0])) as ArenaProfile['mastery'],
    unlocked: ['initiation'],
    replayIds: [],
    updatedAt: now.toISOString(),
  }
}

export function loadArenaProfile(storage: ProfileStorage): ArenaProfile {
  try {
    const value = JSON.parse(storage.getItem(ARENA_PROFILE_KEY) ?? '') as ArenaProfile
    if (value.version !== ARENA_PROFILE_VERSION || !value.mastery) throw new Error('invalid')
    return value
  } catch {
    return freshArenaProfile()
  }
}

export function saveArenaProfile(storage: ProfileStorage, profile: ArenaProfile): void {
  storage.setItem(ARENA_PROFILE_KEY, JSON.stringify(profile))
}

/** The bout being recorded: what was played, against which challenge, and how it went. */
export interface ArenaBout {
  replay: ArenaReplay
  challengeId: string | null
  result: ChallengeResult | null
  /** Injectable so a test can pin the timestamp. */
  now?: Date
}

export function recordArenaResult(
  profile: ArenaProfile,
  { replay, challengeId, result, now = new Date() }: ArenaBout,
): ArenaProfile {
  const mastery = { ...profile.mastery }
  for (const command of replay.commands) {
    const technique = masteryFor(command.action)
    if (technique) mastery[technique] = Math.min(100, mastery[technique] + 1)
  }
  const completed = challengeId && result?.complete ? challengeId : null
  const bestGrades = { ...profile.bestGrades }
  if (challengeId && result)
    bestGrades[challengeId] = betterGrade(bestGrades[challengeId], result.grade)
  return {
    ...profile,
    bouts: profile.bouts + 1,
    wins: profile.wins + (playReplay(replay).state.outcome === 'won' ? 1 : 0),
    mastery,
    bestGrades,
    unlocked: completed ? [...new Set([...profile.unlocked, completed])] : profile.unlocked,
    replayIds: [...new Set([replay.checksum, ...profile.replayIds])].slice(0, 20),
    updatedAt: now.toISOString(),
  }
}

function masteryFor(action: ArenaReplay['commands'][number]['action']): NenMastery | null {
  if (action.type === 'MODE') return action.mode
  if (action.type === 'GYO') return 'gyo'
  if (action.type === 'IN') return 'in'
  if (action.type === 'KEN') return 'ken'
  if (action.type === 'KO') return 'ko'
  if (action.type === 'RYU') return 'ryu'
  if (action.type === 'HATSU') return 'hatsu'
  return null
}

function betterGrade(
  previous: ChallengeResult['grade'] | undefined,
  next: ChallengeResult['grade'],
) {
  const order = ['C', 'B', 'A', 'S']
  return !previous || order.indexOf(next) > order.indexOf(previous) ? next : previous
}
