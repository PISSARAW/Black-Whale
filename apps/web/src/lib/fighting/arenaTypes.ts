import type { FightSide } from './types'

export interface ArenaObject {
  width: number
  height: number
  sun?: FightSide
  moon?: FightSide
  sunCharge?: number
  moonCharge?: number
  burning?: number
}
export interface ArenaState {
  held: Record<FightSide, boolean>
  tether: Partial<Record<FightSide, { objectId: string; kind: 'gum' | 'thread'; pulling: boolean }>>
  stored: Partial<Record<FightSide, string>>
  pending: Partial<
    Record<
      FightSide,
      {
        objectId: string
        kind: 'gum' | 'thread' | 'vacuum' | 'marks'
        frames: number
        mark?: import('./sunMoonObjectHands').ObjectMark
        charge?: boolean
        contact?: { x: number; y: number }
      }
    >
  >
}
export const createArenaState = (): ArenaState => ({
  held: { player: false, opponent: false },
  tether: {},
  stored: {},
  pending: {},
})
