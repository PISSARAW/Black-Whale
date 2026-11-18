import type { FighterId } from './types'

export type BattlePiece = 'prologue' | 'jupiter' | 'metamorphosen'
export interface BattleModel {
  frames: number
  spoken: boolean
}
export interface BattleCantabile {
  /** Presentation state: removed wrappings stay off until the next round. */
  unwrapped?: boolean
  models: Partial<Record<FighterId, BattleModel>>
  preparation: {
    piece: BattlePiece
    remaining: number
    total: number
    model?: FighterId
    duration?: number
  } | null
  prologue: boolean
  form: { model: FighterId; remaining: number; duration: number } | null
}

export const BATTLE_MOVES = {
  prologue: 'bonolenov:neutralSpecial',
  spear: 'bonolenov:forwardSpecial',
  metamorphosen: 'bonolenov:downSpecial',
  stop: 'bonolenov:backSpecial',
  jupiter: 'bonolenov:finisher',
} as const
export const BATTLE_DANCE_FRAMES = { prologue: 60, jupiter: 90, metamorphosen: 45 } as const
export const BATTLE_COST = { prologue: 40, jupiter: 55, metamorphosen: 30 } as const
export const BATTLE_SOUND_RANGE = 58
export const BATTLE_CONVERSATION_RANGE = 18
export const JUPITER_RADIUS = 12
export const emptyBattleCantabile = (): BattleCantabile => ({
  models: {},
  preparation: null,
  prologue: false,
  form: null,
})
