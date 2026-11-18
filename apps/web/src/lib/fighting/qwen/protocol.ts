import type { MoveSlot } from '../types'

export const QWEN_DEADLINE_MS = 18000
export const QWEN_PLAN_TTL_MS = 18000

export const GOALS = ['pressure', 'bait', 'recover', 'zone'] as const
export const NEN_PLANS = [
  'ten',
  'ren',
  'gyo',
  'in',
  'shu',
  'ryu',
  'ko',
  'zetsu',
  'ken',
  'on',
  'en',
] as const
export interface TacticalPlan {
  goal: (typeof GOALS)[number]
  nen: (typeof NEN_PLANS)[number]
  move: MoveSlot | 'none'
}
export interface CombatObservation {
  fighter: 'hisoka' | 'machi'
  round: number
  frame: number
  self: { health: number; aura: number; wounds: number; nen: string; linked: boolean }
  enemy: { distance: number; pose: string; guarding: boolean } | null
  recent: string[]
  moves: { slot: MoveSlot; name: string; aura: number; reach: number; ready: boolean }[]
}
export interface TacticalReply {
  plan: TacticalPlan
  model: string
  requestId: string
  elapsedMs: number
}
export const FALLBACK_PLAN: TacticalPlan = { goal: 'bait', nen: 'ten', move: 'none' }

export function parseTacticalPlan(value: unknown, moves: readonly string[]): TacticalPlan | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  if (!GOALS.includes(row.goal as TacticalPlan['goal'])) return null
  if (!NEN_PLANS.includes(row.nen as TacticalPlan['nen'])) return null
  if (typeof row.move !== 'string' || !['none', ...moves].includes(row.move)) return null
  if (Object.keys(row).some((key) => !['goal', 'nen', 'move'].includes(key))) return null
  return row as unknown as TacticalPlan
}

export function planSchema(moves: readonly string[]) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      goal: { type: 'string', enum: GOALS },
      nen: { type: 'string', enum: NEN_PLANS },
      move: { type: 'string', enum: ['none', ...moves] },
    },
    required: ['goal', 'nen', 'move'],
  }
}
