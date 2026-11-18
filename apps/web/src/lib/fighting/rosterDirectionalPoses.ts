import { isAirPursuit, type DirectionalEnding } from './directionalChain'
import { addPoses, scalePose, type FightPose } from './fightPose'
import type { KeyedMove } from './keyPoseMoves'
import type { MoveTimeline } from './keyPoseTimeline'
import { ROSTER_CHOREOGRAPHY, type RosterFighterId } from './rosterChoreography'
import type { ArcadeFighter, AttackPhase } from './types'

type Gesture = Record<AttackPhase, FightPose>

const FINISH_MOTION: Record<DirectionalEnding, Gesture> = {
  ground: {
    startup: { root: [0, -0.065, 0], rearKnee: [0.26, 0, 0], body: [0.1, 0.08, 0] },
    active: { root: [0, -0.105, 0.07], body: [0.15, -0.2, 0], rearKnee: [0.18, 0, 0] },
    recovery: { root: [0, -0.045, 0.025], body: [0.06, -0.08, 0] },
  },
  air: {
    startup: { root: [0, -0.12, -0.04], body: [0.11, 0.08, 0], leadKnee: [0.32, 0, 0] },
    active: {
      root: [0, 0.11, 0.075],
      body: [-0.16, -0.14, 0],
      head: [-0.18, 0, 0],
      rearHip: [0.12, 0, 0],
    },
    recovery: { root: [0, 0.04, 0.03], chest: [-0.06, -0.06, 0], head: [-0.06, 0, 0] },
  },
  close: {
    startup: { chest: [0, 0.18, 0], root: [0, -0.02, -0.025], leadKnee: [0.08, 0, 0] },
    active: { chest: [0.09, -0.26, 0], root: [0, -0.015, 0.08], rearShoulder: [-0.12, 0, -0.15] },
    recovery: { chest: [0.04, -0.08, 0], root: [0, 0, 0.025] },
  },
  carry: {
    startup: { root: [0, -0.055, -0.09], rearKnee: [0.25, 0, 0], chest: [0, 0.23, 0] },
    active: { root: [0, 0.035, 0.16], body: [0.18, -0.31, 0], rearHip: [0.18, 0, 0] },
    recovery: { root: [0, 0.005, 0.065], body: [0.075, -0.13, 0], rearHip: [0.07, 0, 0] },
  },
}

const TIMELINES = new WeakMap<MoveTimeline, Map<string, MoveTimeline>>()

/** Keep the fighter's native limb path and accent the intent and timing of this finish. */
export function rosterDirectionalMove(fighter: ArcadeFighter, native: KeyedMove): KeyedMove {
  const ending = fighter.attack?.directionalChain
  if (!ending || ending === 'bridge' || isAirPursuit(ending) || signaturePose(fighter))
    return native
  if (fighter.id === 'kurapika' || fighter.id === 'hisoka') return native
  const profile = ROSTER_CHOREOGRAPHY[fighter.id as RosterFighterId]
  if (!profile) return native
  return {
    ...native,
    timeline: accentTimeline(native.timeline, {
      fighter: fighter.id,
      ending,
      strength: profile.amplitude,
    }),
  }
}

function signaturePose(fighter: ArcadeFighter): boolean {
  return fighter.attack?.kind === 'special' || fighter.attack?.kind === 'ranged'
}

function accentTimeline(
  native: MoveTimeline,
  profile: { fighter: string; ending: DirectionalEnding; strength: number },
): MoveTimeline {
  const key = `${profile.fighter}:${profile.ending}`
  const cached = TIMELINES.get(native) ?? new Map<string, MoveTimeline>()
  const previous = cached.get(key)
  if (previous) return previous
  const gesture = FINISH_MOTION[profile.ending]
  const timeline = native.map((pose) => ({
    ...pose,
    pose: addPoses(pose.pose, scalePose(gesture[pose.phase], profile.strength)),
  }))
  cached.set(key, timeline)
  TIMELINES.set(native, cached)
  return timeline
}
