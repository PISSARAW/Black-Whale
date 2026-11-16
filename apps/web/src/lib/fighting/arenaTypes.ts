import type { FightSide } from './types'

export interface ArenaObject {
  width: number
  height: number
  sun?: FightSide
  moon?: FightSide
  burning?: number
}
export interface ArenaState {
  held: Record<FightSide, boolean>
  tether: Partial<Record<FightSide, { objectId: string; kind: 'gum' | 'thread'; pulling: boolean }>>
  stored: Partial<Record<FightSide, string>>
  pending: Partial<
    Record<
      FightSide,
      { objectId: string; kind: 'gum' | 'thread' | 'vacuum' | 'marks'; frames: number }
    >
  >
}
export const createArenaState = (): ArenaState => ({
  held: { player: false, opponent: false },
  tether: {},
  stored: {},
  pending: {},
})
