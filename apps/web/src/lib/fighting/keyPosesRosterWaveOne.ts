import { addPoses, scalePose, type FightPose } from './fightPose'
import { rosterKeyPoses } from './rosterKeyPoses'
import type { MoveTimeline } from './keyPoseTimeline'
import type { FighterId, MoveSlot } from './types'

export const ROSTER_WAVE_ONE_FIGHTERS = [
  'melody',
  'mizaistom',
  'camilla',
  'gel',
  'illumi',
  'terebellum',
  'tserriednich',
  'cluck',
  'luini',
  'machi',
] as const satisfies readonly FighterId[]

export const ROSTER_WAVE_ONE_SLOTS = [
  'standingLight',
  'standingHeavy',
  'forwardLight',
] as const satisfies readonly MoveSlot[]

export interface GroundedSignature {
  load: FightPose
  contact: FightPose
  recoil: FightPose
  settle: FightPose
}

export const ROSTER_WAVE_ONE_SIGNATURES: Record<
  (typeof ROSTER_WAVE_ONE_FIGHTERS)[number],
  GroundedSignature
> = {
  melody: {
    load: { pelvis: [-0.025, -0.08, 0], chest: [0.02, -0.08, 0], leadPalm: [-0.04, 0, 0] },
    contact: { pelvis: [0.035, 0.14, 0], leadKnee: [0.12, 0, 0], rearFoot: [0, 0.08, 0] },
    recoil: { chest: [-0.025, -0.08, 0], leadWrist: [0.05, 0, 0] },
    settle: { neck: [-0.012, 0, 0], leadPalm: [-0.025, 0, 0] },
  },
  mizaistom: {
    load: { pelvis: [-0.035, -0.12, 0], rearKnee: [0.18, 0, 0], leadElbow: [-0.08, 0, 0] },
    contact: { pelvis: [0.05, 0.2, 0], rearHip: [0, 0.14, 0], rearFoot: [0, 0.12, 0] },
    recoil: { chest: [-0.04, -0.1, 0], rearShoulder: [0.08, 0, 0] },
    settle: { pelvis: [0.01, 0.025, 0], leadElbow: [-0.05, 0, 0] },
  },
  camilla: {
    load: { pelvis: [-0.02, -0.16, 0], body: [-0.035, 0, 0], rearPalm: [-0.08, 0.06, 0] },
    contact: { pelvis: [0.045, 0.22, 0], chest: [0.04, 0.12, -0.025], leadPalm: [-0.1, 0.08, 0] },
    recoil: { body: [-0.035, 0, 0.025], leadWrist: [0.08, 0, 0] },
    settle: { neck: [-0.018, -0.02, 0], rearPalm: [-0.04, 0.02, 0] },
  },
  gel: {
    load: { pelvis: [-0.04, -0.2, 0], chest: [0.03, -0.16, 0.035], leadWrist: [-0.08, 0.04, 0] },
    contact: { pelvis: [0.055, 0.28, 0], chest: [0.055, 0.24, -0.04], leadFoot: [0.02, 0.08, 0] },
    recoil: { chest: [-0.035, -0.14, 0.04], leadWrist: [0.1, -0.04, 0] },
    settle: { pelvis: [0, 0.04, 0], leadPalm: [-0.04, 0.04, 0] },
  },
  illumi: {
    load: { pelvis: [-0.02, -0.1, 0], neck: [0.015, 0, 0], leadWrist: [-0.1, 0, 0] },
    contact: { pelvis: [0.03, 0.16, 0], neck: [-0.015, 0, 0], leadPalm: [-0.12, 0.02, 0] },
    recoil: { chest: [-0.02, -0.08, 0], leadWrist: [0.08, 0, 0] },
    settle: { neck: [0.006, 0, 0], leadPalm: [-0.035, 0, 0] },
  },
  terebellum: {
    load: { pelvis: [-0.05, -0.1, 0], body: [-0.045, 0, 0], rearKnee: [0.22, 0, 0] },
    contact: { pelvis: [0.07, 0.24, 0], body: [0.04, 0, 0], rearFoot: [0, 0.14, 0] },
    recoil: { body: [-0.05, 0, 0], chest: [-0.04, -0.12, 0] },
    settle: { pelvis: [0.012, 0.035, 0], rearKnee: [0.05, 0, 0] },
  },
  tserriednich: {
    load: { pelvis: [-0.025, -0.18, 0], chest: [0.02, -0.2, 0], neck: [0.015, 0.06, 0] },
    contact: { pelvis: [0.05, 0.25, 0], chest: [0.045, 0.3, -0.03], rearPalm: [-0.08, 0.05, 0] },
    recoil: { chest: [-0.04, -0.16, 0.035], neck: [-0.025, -0.05, 0] },
    settle: { pelvis: [0.006, 0.045, 0], rearPalm: [-0.035, 0.02, 0] },
  },
  cluck: {
    load: { pelvis: [-0.035, -0.14, 0], chest: [0.025, -0.12, 0.05], leadElbow: [-0.1, 0, 0] },
    contact: { pelvis: [0.055, 0.22, 0], chest: [0.04, 0.2, -0.065], leadFoot: [0.03, 0.1, 0] },
    recoil: { chest: [-0.03, -0.12, 0.06], leadElbow: [-0.08, 0, 0] },
    settle: { neck: [-0.015, 0, -0.015], leadFoot: [0, 0.025, 0] },
  },
  luini: {
    load: { pelvis: [-0.04, -0.2, 0], body: [-0.04, 0, 0], rearWrist: [-0.12, 0.04, 0] },
    contact: { pelvis: [0.065, 0.3, 0], body: [0.05, 0, 0], rearPalm: [-0.1, 0.08, 0] },
    recoil: { chest: [-0.04, -0.18, 0.025], rearWrist: [0.1, -0.04, 0] },
    settle: { pelvis: [0.01, 0.04, 0], rearPalm: [-0.04, 0.025, 0] },
  },
  machi: {
    load: { pelvis: [-0.03, -0.16, 0], chest: [0.02, -0.14, 0], leadWrist: [-0.14, 0.06, 0] },
    contact: { pelvis: [0.05, 0.24, 0], chest: [0.04, 0.22, -0.025], leadPalm: [-0.14, 0.1, 0] },
    recoil: { chest: [-0.03, -0.12, 0.02], leadWrist: [0.12, -0.04, 0] },
    settle: { pelvis: [0.008, 0.035, 0], leadPalm: [-0.05, 0.03, 0] },
  },
}

export const ROSTER_WAVE_ONE_GROUNDED_POSES = Object.fromEntries(
  ROSTER_WAVE_ONE_FIGHTERS.map((id) => [
    id,
    Object.fromEntries(
      ROSTER_WAVE_ONE_SLOTS.map((slot) => [
        slot,
        rosterWaveOneGroundedTimeline(id, slot, ROSTER_WAVE_ONE_SIGNATURES[id]),
      ]),
    ),
  ]),
) as Record<(typeof ROSTER_WAVE_ONE_FIGHTERS)[number], Partial<Record<MoveSlot, MoveTimeline>>>

export function rosterWaveOneGroundedTimeline(
  id: (typeof ROSTER_WAVE_ONE_FIGHTERS)[number],
  slot: MoveSlot,
  signature: GroundedSignature,
  accent: GroundedSignature = { load: {}, contact: {}, recoil: {}, settle: {} },
): MoveTimeline {
  const source = rosterKeyPoses(id)[slot]!
  const startup = source.find(({ phase }) => phase === 'startup')!
  const contact = source.find(({ phase, at }) => phase === 'active' && at === 0)!
  const recovery = source.find(({ phase }) => phase === 'recovery')!
  const force = forceFor(slot)
  const loaded = addPoses(startup.pose, scalePose(signature.load, force), accent.load)
  const struck = addPoses(contact.pose, scalePose(signature.contact, force), accent.contact)
  return [
    {
      phase: 'startup',
      at: 0.28,
      ease: 'smooth',
      pose: addPoses(
        scalePose(startup.pose, 0.42),
        scalePose(signature.load, force * 0.48),
        scalePose(accent.load, 0.55),
      ),
    },
    {
      ...startup,
      pose: loaded,
      jointEase: { pelvis: 'out', rearKnee: 'out', chest: 'in', leadShoulder: 'in' },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: struck,
      jointEase: { pelvis: 'out', rearFoot: 'out', chest: 'snap', leadShoulder: 'snap' },
    },
    { phase: 'active', at: 1, pose: struck },
    {
      phase: 'recovery',
      at: 0.16,
      ease: 'out',
      pose: addPoses(scalePose(struck, 0.7), scalePose(signature.recoil, force), accent.recoil),
    },
    {
      phase: 'recovery',
      at: 0.52,
      ease: 'smooth',
      pose: addPoses(
        recovery.pose,
        scalePose(signature.recoil, force * 0.42),
        scalePose(accent.recoil, 0.4),
      ),
    },
    {
      phase: 'recovery',
      at: 0.86,
      ease: 'smooth',
      pose: addPoses(scalePose(signature.settle, force), accent.settle),
    },
  ]
}

function forceFor(slot: MoveSlot): number {
  if (
    slot === 'standingHeavy' ||
    slot === 'lowHeavy' ||
    slot === 'forwardHeavy' ||
    slot === 'backHeavy'
  )
    return 1
  if (slot === 'forwardLight') return 0.82
  if (slot === 'lowLight') return 0.72
  return 0.68
}
