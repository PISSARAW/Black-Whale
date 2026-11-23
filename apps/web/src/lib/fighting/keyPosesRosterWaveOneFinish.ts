import { addPoses, scalePose, type FightPose } from './fightPose'
import type { MoveTimeline } from './keyPoseTimeline'
import {
  ROSTER_WAVE_ONE_FIGHTERS,
  ROSTER_WAVE_ONE_SIGNATURES,
  rosterWaveOneGroundedTimeline,
  type GroundedSignature,
} from './keyPosesRosterWaveOne'
import { rosterKeyPoses } from './rosterKeyPoses'
import type { MoveSlot } from './types'

export const ROSTER_WAVE_ONE_FINISH_SLOTS = [
  'lowHeavy',
  'airLight',
  'airHeavy',
] as const satisfies readonly MoveSlot[]

const LOW_HEAVY: GroundedSignature = {
  load: {
    pelvis: [-0.11, -0.16, 0],
    body: [-0.08, 0, 0],
    leadKnee: [0.32, 0, 0],
    rearKnee: [0.28, 0, 0],
  },
  contact: {
    pelvis: [-0.08, 0.2, 0],
    body: [-0.06, 0, 0],
    leadKnee: [0.38, 0, 0],
    rearKnee: [0.24, 0, 0],
    leadFoot: [0.05, 0.08, 0],
  },
  recoil: {
    pelvis: [-0.06, -0.08, 0],
    chest: [-0.04, -0.1, 0],
    leadKnee: [0.2, 0, 0],
  },
  settle: { pelvis: [-0.02, 0, 0], leadKnee: [0.08, 0, 0], rearKnee: [0.05, 0, 0] },
}

const AIR: Record<'airLight' | 'airHeavy', GroundedSignature> = {
  airLight: {
    load: {
      root: [0, 0.025, 0],
      pelvis: [-0.04, -0.1, 0],
      leadHip: [-0.12, 0, 0],
      rearKnee: [0.24, 0, 0],
    },
    contact: {
      root: [0, 0.04, 0.025],
      pelvis: [0.04, 0.16, 0],
      leadHip: [-0.18, 0.08, 0],
      rearKnee: [0.3, 0, 0],
    },
    recoil: {
      root: [0, -0.015, 0.015],
      pelvis: [-0.03, -0.08, 0],
      rearKnee: [0.18, 0, 0],
    },
    settle: { root: [0, -0.025, 0], leadHip: [-0.08, 0, 0], rearKnee: [0.12, 0, 0] },
  },
  airHeavy: {
    load: {
      root: [0, 0.04, -0.015],
      pelvis: [-0.055, -0.16, 0],
      leadHip: [-0.2, 0, 0],
      rearKnee: [0.34, 0, 0],
    },
    contact: {
      root: [0, -0.025, 0.075],
      pelvis: [0.07, 0.26, 0],
      body: [0.07, 0, 0],
      leadHip: [-0.26, 0.12, 0],
      rearKnee: [0.4, 0, 0],
    },
    recoil: {
      root: [0, -0.04, 0.04],
      pelvis: [0.035, 0.14, 0],
      rearKnee: [0.26, 0, 0],
    },
    settle: { root: [0, -0.05, 0], leadHip: [-0.12, 0, 0], rearKnee: [0.18, 0, 0] },
  },
}

export const ROSTER_WAVE_ONE_FINISH_POSES = Object.fromEntries(
  ROSTER_WAVE_ONE_FIGHTERS.map((id) => [
    id,
    {
      lowHeavy: rosterWaveOneGroundedTimeline(
        id,
        'lowHeavy',
        ROSTER_WAVE_ONE_SIGNATURES[id],
        LOW_HEAVY,
      ),
      airLight: airTimeline(id, 'airLight'),
      airHeavy: airTimeline(id, 'airHeavy'),
    },
  ]),
) as Record<(typeof ROSTER_WAVE_ONE_FIGHTERS)[number], Partial<Record<MoveSlot, MoveTimeline>>>

function airTimeline(
  id: (typeof ROSTER_WAVE_ONE_FIGHTERS)[number],
  slot: 'airLight' | 'airHeavy',
): MoveTimeline {
  const source = rosterKeyPoses(id)[slot]!
  const startup = source.find(({ phase }) => phase === 'startup')!
  const contact = source.find(({ phase, at }) => phase === 'active' && at === 0)!
  const recovery = source.find(({ phase }) => phase === 'recovery')!
  const signature = ROSTER_WAVE_ONE_SIGNATURES[id]
  const accent = AIR[slot]
  const force = slot === 'airHeavy' ? 1 : 0.72
  const loaded = addPoses(startup.pose, scalePose(signature.load, force * 0.65), accent.load)
  const struck = addPoses(contact.pose, scalePose(signature.contact, force * 0.75), accent.contact)
  return [
    {
      phase: 'startup',
      at: 0.25,
      ease: 'smooth',
      pose: addPoses(scalePose(startup.pose, 0.4), scalePose(loaded, 0.48)),
    },
    {
      ...startup,
      pose: loaded,
      jointEase: { pelvis: 'out', leadHip: 'out', rearKnee: 'out', chest: 'in' },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: struck,
      jointEase: { pelvis: 'out', chest: 'snap', leadShoulder: 'snap', rearKnee: 'out' },
    },
    { phase: 'active', at: 1, pose: struck },
    {
      phase: 'recovery',
      at: 0.18,
      ease: 'out',
      pose: addPoses(scalePose(struck, 0.66), scalePose(signature.recoil, force), accent.recoil),
    },
    {
      phase: 'recovery',
      at: 0.55,
      ease: 'smooth',
      pose: addPoses(recovery.pose, scalePose(signature.recoil, force * 0.38), accent.recoil),
    },
    {
      phase: 'recovery',
      at: 0.88,
      ease: 'smooth',
      pose: addPoses(scalePose(signature.settle, force), accent.settle),
    },
  ]
}

export function rosterWaveOneAirContact(slot: MoveSlot): FightPose | null {
  return slot === 'airLight' || slot === 'airHeavy' ? AIR[slot].contact : null
}
