import { FRANKLIN_KEY_POSES } from './keyPosesFranklin'
import { archetypeTimeline } from './fightArchetypes'
import { HISOKA_KEY_POSES } from './keyPosesHisoka'
import { KURAPIKA_KEY_POSES } from './keyPosesKurapika'
import type { MoveTimeline } from './keyPoseTimeline'
import type { FighterId, MoveSlot } from './types'

/**
 * The moves drawn by the fighting rig, by fighter. Kurapika and Hisoka, the
 * reference vertical slice, have their normals keyed by hand against their own
 * stance; every other move of every fighter is drawn from its family's
 * gestures (`fightArchetypes.ts`) against a ready guard.
 */
const KEY_POSES: Partial<Record<FighterId, Partial<Record<MoveSlot, MoveTimeline>>>> = {
  kurapika: KURAPIKA_KEY_POSES,
  hisoka: HISOKA_KEY_POSES,
  franklin: FRANKLIN_KEY_POSES,
}

export interface KeyedMove {
  timeline: MoveTimeline
  /** Keyed by hand against the fighter's stance, rather than a family gesture. */
  authored: boolean
}

export function keyedMove(id: FighterId, slot: MoveSlot): KeyedMove {
  const authored = KEY_POSES[id]?.[slot]
  if (authored) return { timeline: authored, authored: true }
  return { timeline: archetypeTimeline(id, slot), authored: false }
}

/** The hand-keyed timeline of a move, or `null` when it uses its family's gesture. */
export function keyPoseTimeline(id: FighterId, slot: MoveSlot): MoveTimeline | null {
  return KEY_POSES[id]?.[slot] ?? null
}

export function keyedSlots(id: FighterId): MoveSlot[] {
  return Object.keys(KEY_POSES[id] ?? {}) as MoveSlot[]
}
