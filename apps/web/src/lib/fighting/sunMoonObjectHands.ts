import { historicalHandsReady } from './historicalHands'
import type { FightSide, FightState } from './types'

export type ObjectMark = 'sun' | 'moon'
export function selectedObjectMark(state: FightState, side: FightSide): ObjectMark {
  return state[side].chrolloBook?.open ? 'sun' : 'moon'
}
export function objectMarkHandReady(state: FightState, side: FightSide, mark: ObjectMark): boolean {
  if (state[side].hanzoProjection) return false
  return historicalHandsReady(state, side, [mark === 'sun' ? 'left' : 'right'])
}
