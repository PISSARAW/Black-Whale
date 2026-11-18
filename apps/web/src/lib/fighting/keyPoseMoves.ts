import { KURAPIKA_COMMAND_POSES, HISOKA_COMMAND_POSES } from './keyPosesKurapikaHisokaCommands'
import { CHROLLO_COMMAND_POSES, BENJAMIN_COMMAND_POSES } from './keyPosesChrolloBenjaminCommands'
import { holdNormalContacts } from './keyPoseContact'
import { CHROLLO_NORMAL_POSES } from './keyPosesChrolloNormals'
import { BENJAMIN_NORMAL_POSES } from './keyPosesBenjaminNormals'
import { DOOR_LINK_POSE } from './keyPosesVoconte'
import { SHIZUKU_KEY_POSES } from './keyPosesShizuku'
import { THETA_SHOT_POSES } from './keyPosesTheta'
import { PROLOGUE_SPEAR_POSE } from './bonolenovPoses'
import { archetypeTimeline } from './fightArchetypes'
import { rosterKeyPoses } from './rosterKeyPoses'
import { HISOKA_KEY_POSES } from './keyPosesHisoka'
import { CHROLLO_KEY_POSES } from './keyPosesChrollo'
import { HISOKA_SPECIAL_POSES } from './keyPosesHisokaSpecials'
import { FRANKLIN_KEY_POSES } from './keyPosesFranklin'
import { LEORIO_REMOTE_PUNCH } from './keyPosesLeorio'
import { HANZO_KEY_POSES } from './keyPosesHanzo'
import { FEITAN_PAIN_PACKER, FEITAN_RISING_SUN } from './keyPosesFeitan'
import { KALLUTO_KEY_POSES } from './keyPosesKalluto'
import { KURAPIKA_REFERENCE_POSES } from './keyPosesKurapikaReference'
import { KURAPIKA_CAST_POSES } from './keyPosesKurapikaCasts'
import { KURAPIKA_KEY_POSES } from './keyPosesKurapika'
import { FURYKOV_CONSOLE_POSE } from './keyPosesFurykov'
import type { MoveTimeline } from './keyPoseTimeline'
import type { FighterId, MoveSlot } from './types'

/**
 * Existing technique clips take precedence. The forty playable fighters also
 * have individual choreography for every remaining slot, against their own guard.
 * The family fallback is retained only for legacy, non-playable identities.
 */
const KEY_POSES: Partial<Record<FighterId, Partial<Record<MoveSlot, MoveTimeline>>>> = {
  voconte: { neutralSpecial: DOOR_LINK_POSE },
  kurapika: {
    ...holdNormalContacts(KURAPIKA_KEY_POSES),
    ...KURAPIKA_COMMAND_POSES,
    ...KURAPIKA_REFERENCE_POSES,
    ...KURAPIKA_CAST_POSES,
  },
  theta: THETA_SHOT_POSES,
  shizuku: SHIZUKU_KEY_POSES,
  hisoka: {
    ...holdNormalContacts(HISOKA_KEY_POSES),
    ...HISOKA_COMMAND_POSES,
    ...HISOKA_SPECIAL_POSES,
  },
  franklin: FRANKLIN_KEY_POSES,
  kalluto: KALLUTO_KEY_POSES,
  chrollo: { ...CHROLLO_NORMAL_POSES, ...CHROLLO_COMMAND_POSES, ...CHROLLO_KEY_POSES },
  benjamin: { ...BENJAMIN_NORMAL_POSES, ...BENJAMIN_COMMAND_POSES },
  leorio: { neutralSpecial: LEORIO_REMOTE_PUNCH },
  hanzo: HANZO_KEY_POSES,
  bonolenov: { forwardSpecial: PROLOGUE_SPEAR_POSE },
  furykov: { neutralSpecial: FURYKOV_CONSOLE_POSE },
  feitan: { neutralSpecial: FEITAN_PAIN_PACKER, finisher: FEITAN_RISING_SUN },
}

export interface KeyedMove {
  timeline: MoveTimeline
  /** Personal choreography sampled against this fighter's stance. */
  authored: boolean
}

export function keyedMove(id: FighterId, slot: MoveSlot): KeyedMove {
  const authored = keyPoseTimeline(id, slot)
  if (authored) return { timeline: authored, authored: true }
  return { timeline: archetypeTimeline(id, slot), authored: false }
}

/** The personal timeline of a move, or null for a legacy family gesture. */
export function keyPoseTimeline(id: FighterId, slot: MoveSlot): MoveTimeline | null {
  return KEY_POSES[id]?.[slot] ?? rosterKeyPoses(id)[slot] ?? null
}

export function keyedSlots(id: FighterId): MoveSlot[] {
  return Object.keys({ ...rosterKeyPoses(id), ...KEY_POSES[id] }) as MoveSlot[]
}
