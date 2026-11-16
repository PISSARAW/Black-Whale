import { HISOKA_KEY_POSES } from './keyPosesHisoka'
import { KURAPIKA_KEY_POSES } from './keyPosesKurapika'
import type { MoveTimeline } from './keyPoseTimeline'
import type { FighterId, MoveSlot } from './types'

/**
 * The moves drawn by the fighting rig, by fighter. Kurapika and Hisoka, the
 * reference vertical slice, come first; a move absent here keeps its procedural
 * gesture from `fightMoves.ts`.
 */
const KEY_POSES: Partial<Record<FighterId, Partial<Record<MoveSlot, MoveTimeline>>>> = {
  kurapika: KURAPIKA_KEY_POSES,
  hisoka: HISOKA_KEY_POSES,
}

export function keyPoseTimeline(id: FighterId, slot: MoveSlot): MoveTimeline | null {
  return KEY_POSES[id]?.[slot] ?? null
}

export function keyedSlots(id: FighterId): MoveSlot[] {
  return Object.keys(KEY_POSES[id] ?? {}) as MoveSlot[]
}
