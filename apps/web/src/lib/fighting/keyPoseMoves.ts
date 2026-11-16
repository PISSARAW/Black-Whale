import { DOOR_LINK_POSE } from './keyPosesVoconte'
import { SHIZUKU_KEY_POSES } from './keyPosesShizuku'
import { THETA_SHOT_POSES } from './keyPosesTheta'
import { PROLOGUE_SPEAR_POSE } from './bonolenovPoses'
import { archetypeTimeline } from './fightArchetypes'
import { HISOKA_KEY_POSES } from './keyPosesHisoka'
import { CHROLLO_KEY_POSES } from './keyPosesChrollo'
import { HISOKA_SPECIAL_POSES } from './keyPosesHisokaSpecials'
import { FRANKLIN_KEY_POSES } from './keyPosesFranklin'
import { LEORIO_REMOTE_PUNCH } from './keyPosesLeorio'
import { HANZO_KEY_POSES } from './keyPosesHanzo'
import { FEITAN_PAIN_PACKER, FEITAN_RISING_SUN } from './keyPosesFeitan'
import { KURAPIKA_KEY_POSES } from './keyPosesKurapika'
import { FURYKOV_CONSOLE_POSE } from './keyPosesFurykov'
import type { MoveTimeline } from './keyPoseTimeline'
import type { FighterId, MoveSlot } from './types'

/**
 * The moves drawn by the fighting rig, by fighter. Kurapika and Hisoka, the
 * reference vertical slice, have their normals keyed by hand against their own
 * stance; Hisoka's four techniques also have distinct authored gestures.
 * Other moves without authored keys are drawn from their family's
 * gestures (`fightArchetypes.ts`) against a ready guard.
 */
const KEY_POSES: Partial<Record<FighterId, Partial<Record<MoveSlot, MoveTimeline>>>> = {
  voconte: { neutralSpecial: DOOR_LINK_POSE },
  kurapika: KURAPIKA_KEY_POSES,
  theta: THETA_SHOT_POSES,
  shizuku: SHIZUKU_KEY_POSES,
  hisoka: { ...HISOKA_KEY_POSES, ...HISOKA_SPECIAL_POSES },
  franklin: FRANKLIN_KEY_POSES,
  chrollo: CHROLLO_KEY_POSES,
  leorio: { neutralSpecial: LEORIO_REMOTE_PUNCH },
  hanzo: HANZO_KEY_POSES,
  bonolenov: { forwardSpecial: PROLOGUE_SPEAR_POSE },
  furykov: { neutralSpecial: FURYKOV_CONSOLE_POSE },
  feitan: { neutralSpecial: FEITAN_PAIN_PACKER, finisher: FEITAN_RISING_SUN },
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
