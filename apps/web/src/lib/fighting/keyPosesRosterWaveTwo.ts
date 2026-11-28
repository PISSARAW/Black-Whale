import type { MoveTimeline } from './keyPoseTimeline'
import { rosterWaveOneGroundedTimeline, type GroundedSignature } from './keyPosesRosterWaveOne'
import type { FighterId, MoveSlot } from './types'

export const ROSTER_WAVE_TWO_FIGHTERS = [
  'musse',
  'padaille',
  'rihan',
  'theta',
  'yokotani',
  'basho',
  'beyond',
  'leorio',
  'longhi',
  'lynch',
] as const satisfies readonly FighterId[]

export const ROSTER_WAVE_TWO_SLOTS = [
  'standingLight',
  'standingHeavy',
  'forwardLight',
] as const satisfies readonly MoveSlot[]

export const ROSTER_WAVE_TWO_SIGNATURES: Record<
  (typeof ROSTER_WAVE_TWO_FIGHTERS)[number],
  GroundedSignature
> = {
  musse: {
    load: { pelvis: [-0.025, -0.12, 0], neck: [0.012, 0.04, 0], rearWrist: [-0.08, 0, 0] },
    contact: { pelvis: [0.04, 0.18, 0], neck: [-0.012, -0.03, 0], rearPalm: [-0.07, 0.04, 0] },
    recoil: { chest: [-0.025, -0.1, 0.02], neck: [0.01, 0.02, 0] },
    settle: { pelvis: [0.006, 0.03, 0], rearWrist: [-0.03, 0, 0] },
  },
  padaille: {
    load: { pelvis: [-0.04, -0.18, 0], body: [-0.035, 0, 0], rearWrist: [-0.14, 0.06, 0] },
    contact: { pelvis: [0.06, 0.28, 0], body: [0.05, 0, 0], rearPalm: [-0.12, 0.08, 0] },
    recoil: { chest: [-0.04, -0.16, 0.03], rearWrist: [0.12, -0.04, 0] },
    settle: { pelvis: [0.01, 0.04, 0], rearPalm: [-0.05, 0.03, 0] },
  },
  rihan: {
    load: { pelvis: [-0.03, -0.14, 0], chest: [0.02, -0.16, 0], neck: [0.01, 0.05, 0] },
    contact: { pelvis: [0.045, 0.22, 0], chest: [0.04, 0.26, -0.02], leadPalm: [-0.08, 0.04, 0] },
    recoil: { chest: [-0.035, -0.14, 0.025], neck: [-0.018, -0.04, 0] },
    settle: { pelvis: [0.008, 0.035, 0], neck: [0.005, 0, 0] },
  },
  theta: {
    load: { pelvis: [-0.035, -0.1, 0], rearKnee: [0.18, 0, 0], leadWrist: [-0.08, 0, 0] },
    contact: { pelvis: [0.05, 0.2, 0], rearHip: [0, 0.16, 0], rearFoot: [0, 0.12, 0] },
    recoil: { chest: [-0.03, -0.1, 0], leadWrist: [0.07, 0, 0] },
    settle: { pelvis: [0.008, 0.03, 0], leadPalm: [-0.03, 0, 0] },
  },
  yokotani: {
    load: { pelvis: [-0.045, -0.1, 0], body: [-0.04, 0, 0], leadElbow: [-0.1, 0, 0] },
    contact: { pelvis: [0.055, 0.2, 0], body: [0.035, 0, 0], leadPalm: [-0.09, 0.06, 0] },
    recoil: { body: [-0.045, 0, 0], leadElbow: [-0.08, 0, 0] },
    settle: { pelvis: [0.01, 0.025, 0], leadPalm: [-0.035, 0.02, 0] },
  },
  basho: {
    load: { pelvis: [-0.04, -0.2, 0], chest: [0.025, -0.18, 0], rearWrist: [-0.12, 0.04, 0] },
    contact: { pelvis: [0.065, 0.3, 0], chest: [0.05, 0.28, -0.03], rearPalm: [-0.1, 0.08, 0] },
    recoil: { chest: [-0.04, -0.18, 0.025], rearWrist: [0.1, -0.04, 0] },
    settle: { pelvis: [0.01, 0.045, 0], rearPalm: [-0.04, 0.025, 0] },
  },
  beyond: {
    load: { pelvis: [-0.055, -0.16, 0], body: [-0.05, 0, 0], rearKnee: [0.26, 0, 0] },
    contact: { pelvis: [0.08, 0.32, 0], body: [0.065, 0, 0], rearFoot: [-0.03, 0.18, 0] },
    recoil: { pelvis: [0.05, 0.18, 0], chest: [0.04, 0.12, -0.025] },
    settle: { pelvis: [0.015, 0.05, 0], rearKnee: [0.06, 0, 0] },
  },
  leorio: {
    load: { pelvis: [-0.04, -0.16, 0], chest: [0.02, -0.18, 0], rearElbow: [-0.12, 0, 0] },
    contact: { pelvis: [0.065, 0.28, 0], chest: [0.05, 0.3, -0.025], rearWrist: [-0.08, 0.04, 0] },
    recoil: { chest: [-0.04, -0.16, 0.025], rearElbow: [-0.08, 0, 0] },
    settle: { pelvis: [0.01, 0.04, 0], rearWrist: [-0.03, 0, 0] },
  },
  longhi: {
    load: { pelvis: [-0.03, -0.16, 0], chest: [0.025, -0.16, 0.03], leadWrist: [-0.1, 0.05, 0] },
    contact: { pelvis: [0.05, 0.26, 0], chest: [0.045, 0.26, -0.035], leadPalm: [-0.1, 0.08, 0] },
    recoil: { chest: [-0.035, -0.14, 0.035], leadWrist: [0.09, -0.04, 0] },
    settle: { pelvis: [0.008, 0.04, 0], leadPalm: [-0.04, 0.03, 0] },
  },
  lynch: {
    load: { pelvis: [-0.05, -0.2, 0], body: [-0.04, 0, 0], rearKnee: [0.24, 0, 0] },
    contact: { pelvis: [0.075, 0.32, 0], body: [0.06, 0, 0], rearFoot: [-0.02, 0.18, 0] },
    recoil: { pelvis: [0.04, 0.16, 0], chest: [0.035, 0.12, -0.02] },
    settle: { pelvis: [0.012, 0.045, 0], rearKnee: [0.05, 0, 0] },
  },
}

export const ROSTER_WAVE_TWO_GROUNDED_POSES = Object.fromEntries(
  ROSTER_WAVE_TWO_FIGHTERS.map((id) => [
    id,
    Object.fromEntries(
      ROSTER_WAVE_TWO_SLOTS.map((slot) => [
        slot,
        rosterWaveOneGroundedTimeline(id, slot, { signature: ROSTER_WAVE_TWO_SIGNATURES[id] }),
      ]),
    ),
  ]),
) as Record<(typeof ROSTER_WAVE_TWO_FIGHTERS)[number], Partial<Record<MoveSlot, MoveTimeline>>>
