import { KURAPIKA_COMMAND_POSES, HISOKA_COMMAND_POSES } from './keyPosesKurapikaHisokaCommands'
import { CHROLLO_COMMAND_POSES, BENJAMIN_COMMAND_POSES } from './keyPosesChrolloBenjaminCommands'
import { holdNormalContacts } from './keyPoseContact'
import { CHROLLO_NORMAL_POSES } from './keyPosesChrolloNormals'
import { BENJAMIN_NORMAL_POSES } from './keyPosesBenjaminNormals'
import { DOOR_LINK_POSE } from './keyPosesVoconte'
import { SHIZUKU_KEY_POSES } from './keyPosesShizuku'
import { THETA_SHOT_POSES } from './keyPosesTheta'
import { BONOLENOV_KEY_POSES } from './keyPosesBonolenov'
import { archetypeTimeline } from './fightArchetypes'
import { rosterKeyPoses } from './rosterKeyPoses'
import { HISOKA_KEY_POSES } from './keyPosesHisoka'
import { CHROLLO_KEY_POSES } from './keyPosesChrollo'
import { HISOKA_SPECIAL_POSES } from './keyPosesHisokaSpecials'
import { FRANKLIN_KEY_POSES } from './keyPosesFranklin'
import { LEORIO_REMOTE_PUNCH } from './keyPosesLeorio'
import { HANZO_KEY_POSES } from './keyPosesHanzo'
import { FEITAN_PAIN_PACKER, FEITAN_RISING_SUN } from './keyPosesFeitan'
import { FEITAN_BLADE_POSES } from './keyPosesFeitanBlade'
import { KALLUTO_KEY_POSES } from './keyPosesKalluto'
import { KURAPIKA_REFERENCE_POSES } from './keyPosesKurapikaReference'
import { KURAPIKA_CAST_POSES } from './keyPosesKurapikaCasts'
import { KURAPIKA_KEY_POSES } from './keyPosesKurapika'
import { KURAPIKA_GOLDEN_HEAVY_TIMELINE } from './keyPosesKurapikaGoldenHeavy'
import { ROSTER_WAVE_ONE_GROUNDED_POSES } from './keyPosesRosterWaveOne'
import { ROSTER_WAVE_ONE_DIRECTIONAL_POSES } from './keyPosesRosterWaveOneDirectional'
import { FURYKOV_CONSOLE_POSE } from './keyPosesFurykov'
import type { MoveTimeline } from './keyPoseTimeline'
import type { FighterId, MoveSlot } from './types'

/**
 * Existing technique clips take precedence. The forty playable fighters also
 * have individual choreography for every remaining slot, against their own guard.
 * The family fallback is retained only for legacy, non-playable identities.
 */
const KEY_POSES: Partial<Record<FighterId, Partial<Record<MoveSlot, MoveTimeline>>>> = {
  ...Object.fromEntries(
    Object.keys(ROSTER_WAVE_ONE_GROUNDED_POSES).map((id) => [
      id,
      {
        ...ROSTER_WAVE_ONE_GROUNDED_POSES[id as keyof typeof ROSTER_WAVE_ONE_GROUNDED_POSES],
        ...ROSTER_WAVE_ONE_DIRECTIONAL_POSES[id as keyof typeof ROSTER_WAVE_ONE_DIRECTIONAL_POSES],
      },
    ]),
  ),
  voconte: { neutralSpecial: DOOR_LINK_POSE },
  kurapika: {
    ...holdNormalContacts(KURAPIKA_KEY_POSES),
    ...KURAPIKA_COMMAND_POSES,
    ...KURAPIKA_REFERENCE_POSES,
    ...KURAPIKA_CAST_POSES,
    standingHeavy: KURAPIKA_GOLDEN_HEAVY_TIMELINE,
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
  bonolenov: BONOLENOV_KEY_POSES,
  furykov: { neutralSpecial: FURYKOV_CONSOLE_POSE },
  feitan: {
    ...FEITAN_BLADE_POSES,
    neutralSpecial: FEITAN_PAIN_PACKER,
    finisher: FEITAN_RISING_SUN,
  },
}

export interface KeyedMove {
  timeline: MoveTimeline
  /** Personal choreography sampled against this fighter's stance. */
  authored: boolean
}

export type KeyPoseSource = 'dedicated' | 'roster' | 'archetype'

export function keyedMove(id: FighterId, slot: MoveSlot): KeyedMove {
  const authored = keyPoseTimeline(id, slot)
  if (authored) return { timeline: authored, authored: true }
  return { timeline: archetypeTimeline(id, slot), authored: false }
}

/** The personal timeline of a move, or null for a legacy family gesture. */
export function keyPoseTimeline(id: FighterId, slot: MoveSlot): MoveTimeline | null {
  return KEY_POSES[id]?.[slot] ?? rosterKeyPoses(id)[slot] ?? null
}

/** Audit provenance: dedicated clips outrank generated roster grammar. */
export function keyPoseSource(id: FighterId, slot: MoveSlot): KeyPoseSource {
  if (KEY_POSES[id]?.[slot]) return 'dedicated'
  if (rosterKeyPoses(id)[slot]) return 'roster'
  return 'archetype'
}

export function keyedSlots(id: FighterId): MoveSlot[] {
  return Object.keys({ ...rosterKeyPoses(id), ...KEY_POSES[id] }) as MoveSlot[]
}
