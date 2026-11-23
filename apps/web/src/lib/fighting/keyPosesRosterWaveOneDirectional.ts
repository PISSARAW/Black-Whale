import type { FightPose } from './fightPose'
import type { MoveTimeline } from './keyPoseTimeline'
import {
  ROSTER_WAVE_ONE_FIGHTERS,
  ROSTER_WAVE_ONE_SIGNATURES,
  rosterWaveOneGroundedTimeline,
  type GroundedSignature,
} from './keyPosesRosterWaveOne'
import type { MoveSlot } from './types'

export const ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS = [
  'lowLight',
  'forwardHeavy',
  'backHeavy',
] as const satisfies readonly MoveSlot[]

const SLOT_ACCENTS: Record<(typeof ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS)[number], GroundedSignature> =
  {
    lowLight: {
      load: { pelvis: [-0.08, -0.08, 0], body: [-0.06, 0, 0], leadKnee: [0.22, 0, 0] },
      contact: {
        pelvis: [-0.1, 0.1, 0],
        body: [-0.08, 0, 0],
        leadKnee: [0.3, 0, 0],
        rearKnee: [0.2, 0, 0],
      },
      recoil: { pelvis: [-0.05, -0.06, 0], leadKnee: [0.16, 0, 0] },
      settle: { pelvis: [-0.015, 0, 0], leadKnee: [0.06, 0, 0] },
    },
    forwardHeavy: {
      load: { pelvis: [-0.04, -0.18, 0], body: [-0.04, 0, 0], rearKnee: [0.26, 0, 0] },
      contact: {
        root: [0, 0, 0.05],
        pelvis: [0.08, 0.34, 0],
        body: [0.07, 0, 0],
        rearFoot: [-0.03, 0.18, 0],
      },
      recoil: { pelvis: [0.05, 0.2, 0], chest: [0.04, 0.14, -0.025] },
      settle: { root: [0, 0, 0.01], pelvis: [0.012, 0.04, 0] },
    },
    backHeavy: {
      load: { pelvis: [-0.035, 0.16, 0], body: [-0.05, 0, 0], leadKnee: [0.2, 0, 0] },
      contact: {
        root: [0, 0, -0.035],
        pelvis: [0.055, -0.28, 0],
        chest: [0.045, -0.22, 0.035],
        leadFoot: [0.02, -0.14, 0],
      },
      recoil: { pelvis: [-0.03, 0.14, 0], chest: [-0.04, 0.16, -0.03] },
      settle: { root: [0, 0, -0.008], pelvis: [0.008, -0.04, 0] },
    },
  }

export const ROSTER_WAVE_ONE_DIRECTIONAL_POSES = Object.fromEntries(
  ROSTER_WAVE_ONE_FIGHTERS.map((id) => [
    id,
    Object.fromEntries(
      ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS.map((slot) => [
        slot,
        rosterWaveOneGroundedTimeline(id, slot, ROSTER_WAVE_ONE_SIGNATURES[id], SLOT_ACCENTS[slot]),
      ]),
    ),
  ]),
) as Record<(typeof ROSTER_WAVE_ONE_FIGHTERS)[number], Partial<Record<MoveSlot, MoveTimeline>>>

export function rosterWaveOneDirectionalAccent(slot: MoveSlot): FightPose | null {
  return slot in SLOT_ACCENTS ? SLOT_ACCENTS[slot as keyof typeof SLOT_ACCENTS].contact : null
}
