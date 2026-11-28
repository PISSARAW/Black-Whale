import type { MoveTimeline } from './keyPoseTimeline'
import { rosterWaveOneGroundedTimeline, type GroundedSignature } from './keyPosesRosterWaveOne'
import type { FighterId, MoveSlot } from './types'

export const ROSTER_WAVE_THREE_FIGHTERS = [
  'phinks',
  'zakuro',
  'franklin',
  'sayird',
  'voconte',
  'bill',
  'biscuit',
  'furykov',
  'halkenburg',
  'hinrigh',
  'saiyu',
] as const satisfies readonly FighterId[]

export const ROSTER_WAVE_THREE_SLOTS = [
  'standingLight',
  'standingHeavy',
  'forwardLight',
] as const satisfies readonly MoveSlot[]

export const ROSTER_WAVE_THREE_SIGNATURES: Record<
  (typeof ROSTER_WAVE_THREE_FIGHTERS)[number],
  GroundedSignature
> = {
  phinks: {
    load: { pelvis: [-0.06, -0.24, 0], body: [-0.05, 0, 0], rearKnee: [0.28, 0, 0] },
    contact: { pelvis: [0.09, 0.38, 0], body: [0.08, 0, 0], rearFoot: [-0.04, 0.2, 0] },
    recoil: { pelvis: [0.06, 0.22, 0], chest: [0.05, 0.16, -0.03] },
    settle: { pelvis: [0.015, 0.055, 0], rearKnee: [0.07, 0, 0] },
  },
  zakuro: {
    load: { pelvis: [-0.035, -0.16, 0], chest: [0.025, -0.15, 0.03], leadWrist: [-0.12, 0.05, 0] },
    contact: { pelvis: [0.05, 0.25, 0], chest: [0.045, 0.24, -0.035], leadPalm: [-0.12, 0.08, 0] },
    recoil: { chest: [-0.035, -0.14, 0.035], leadWrist: [0.1, -0.04, 0] },
    settle: { pelvis: [0.008, 0.04, 0], leadPalm: [-0.045, 0.03, 0] },
  },
  franklin: {
    load: { pelvis: [-0.055, -0.14, 0], body: [-0.05, 0, 0], rearKnee: [0.24, 0, 0] },
    contact: { pelvis: [0.075, 0.3, 0], body: [0.065, 0, 0], rearFoot: [-0.03, 0.18, 0] },
    recoil: { pelvis: [0.05, 0.18, 0], chest: [0.04, 0.12, -0.02] },
    settle: { pelvis: [0.014, 0.05, 0], rearKnee: [0.06, 0, 0] },
  },
  sayird: {
    load: { pelvis: [-0.03, -0.14, 0], neck: [0.012, 0.04, 0], leadWrist: [-0.09, 0.04, 0] },
    contact: { pelvis: [0.045, 0.22, 0], neck: [-0.012, -0.03, 0], leadFoot: [0.025, 0.1, 0] },
    recoil: { chest: [-0.03, -0.12, 0.03], neck: [0.01, 0.02, 0] },
    settle: { pelvis: [0.007, 0.035, 0], leadWrist: [-0.035, 0, 0] },
  },
  voconte: {
    load: { pelvis: [-0.04, 0.16, 0], body: [-0.04, 0, 0], leadKnee: [0.2, 0, 0] },
    contact: { pelvis: [0.055, -0.24, 0], chest: [0.045, -0.2, 0.03], leadFoot: [0.02, -0.12, 0] },
    recoil: { pelvis: [-0.03, 0.12, 0], chest: [-0.035, 0.14, -0.025] },
    settle: { pelvis: [0.008, -0.035, 0], leadKnee: [0.05, 0, 0] },
  },
  bill: {
    load: { pelvis: [-0.05, -0.16, 0], body: [-0.045, 0, 0], rearKnee: [0.24, 0, 0] },
    contact: { pelvis: [0.07, 0.3, 0], body: [0.06, 0, 0], rearFoot: [-0.02, 0.17, 0] },
    recoil: { pelvis: [0.045, 0.17, 0], chest: [0.035, 0.12, -0.02] },
    settle: { pelvis: [0.012, 0.045, 0], rearKnee: [0.055, 0, 0] },
  },
  biscuit: {
    load: { pelvis: [-0.04, -0.18, 0], chest: [0.025, -0.18, 0], rearKnee: [0.28, 0, 0] },
    contact: {
      pelvis: [0.065, 0.3, 0],
      chest: [0.05, 0.3, -0.025],
      rearKnee: [0.12, 0, 0],
      rearFoot: [-0.025, 0.17, 0],
    },
    recoil: { chest: [-0.04, -0.16, 0.025], leadWrist: [0.08, 0, 0] },
    settle: { pelvis: [0.01, 0.045, 0], leadPalm: [-0.035, 0, 0] },
  },
  furykov: {
    load: { pelvis: [-0.03, -0.14, 0], neck: [0.01, 0.05, 0], rearWrist: [-0.08, 0, 0] },
    contact: { pelvis: [0.045, 0.22, 0], neck: [-0.015, -0.04, 0], rearPalm: [-0.08, 0.04, 0] },
    recoil: { chest: [-0.03, -0.13, 0.025], neck: [0.012, 0.025, 0] },
    settle: { pelvis: [0.008, 0.035, 0], rearWrist: [-0.03, 0, 0] },
  },
  halkenburg: {
    load: { pelvis: [-0.05, -0.18, 0], body: [-0.045, 0, 0], rearKnee: [0.25, 0, 0] },
    contact: { pelvis: [0.075, 0.32, 0], body: [0.06, 0, 0], rearFoot: [-0.03, 0.18, 0] },
    recoil: { pelvis: [0.045, 0.18, 0], chest: [0.04, 0.13, -0.025] },
    settle: { pelvis: [0.012, 0.05, 0], rearKnee: [0.06, 0, 0] },
  },
  hinrigh: {
    load: { pelvis: [-0.035, -0.16, 0], chest: [0.02, -0.16, 0.025], leadWrist: [-0.1, 0.05, 0] },
    contact: { pelvis: [0.055, 0.26, 0], chest: [0.045, 0.27, -0.03], leadPalm: [-0.1, 0.08, 0] },
    recoil: { chest: [-0.035, -0.14, 0.03], leadWrist: [0.09, -0.04, 0] },
    settle: { pelvis: [0.009, 0.04, 0], leadPalm: [-0.04, 0.025, 0] },
  },
  saiyu: {
    load: { pelvis: [-0.045, -0.2, 0], chest: [0.03, -0.2, 0.04], rearWrist: [-0.13, 0.06, 0] },
    contact: { pelvis: [0.07, 0.32, 0], chest: [0.055, 0.32, -0.045], rearPalm: [-0.11, 0.09, 0] },
    recoil: { chest: [-0.045, -0.18, 0.04], rearWrist: [0.11, -0.04, 0] },
    settle: { pelvis: [0.012, 0.05, 0], rearPalm: [-0.045, 0.03, 0] },
  },
}

export const ROSTER_WAVE_THREE_GROUNDED_POSES = Object.fromEntries(
  ROSTER_WAVE_THREE_FIGHTERS.map((id) => [
    id,
    Object.fromEntries(
      ROSTER_WAVE_THREE_SLOTS.map((slot) => [
        slot,
        rosterWaveOneGroundedTimeline(id, slot, { signature: ROSTER_WAVE_THREE_SIGNATURES[id] }),
      ]),
    ),
  ]),
) as Record<(typeof ROSTER_WAVE_THREE_FIGHTERS)[number], Partial<Record<MoveSlot, MoveTimeline>>>
