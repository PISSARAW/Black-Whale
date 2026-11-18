import type { HumanAnimationLayer } from '$lib/tour/humanAnimation'
import { fightBodyMotion } from '../fightBodyMotion'
import { rightHandedPose } from '../fightHandedPose'
import type { BodyPlan, FightPose } from '../fightPose'
import { sampleTimeline, type MoveTimeline } from '../keyPoseTimeline'
import { poseProgress } from '../sceneMotion'
import { reactionPlan } from '../fightReactions'
import type { ArcadeFighter } from '../types'
import { KAMEO_CATALOGUE } from './catalogue'
import type { KameoSlot } from './types'
import { tubeppaGlassesMotion } from './tubeppaContacts'

// Art direction for the support adaptation: no new canon ability or combat action.
const COMPOSED: FightPose = {
  chest: [0.015, -0.2, 0],
  head: [0.015, 0, 0],
  leadShoulder: [-0.18, 0, 0.06],
  rearShoulder: [-0.12, 0, -0.08],
  leadElbow: [-0.45, 0, 0],
  rearElbow: [-0.35, 0, 0],
  leadHip: [-0.07, 0, 0.025],
  rearHip: [0.06, 0, -0.025],
  leadKnee: [0.09, 0, 0],
  rearKnee: [0.06, 0, 0],
}
const ADJUST_GLASSES: FightPose = {
  ...COMPOSED,
  chest: [0.015, -0.16, 0],
  head: [0.035, 0, 0.015],
  leadShoulder: [-1.9, 0, -0.25],
  leadElbow: [-1.75, 0, 0],
  leadWrist: [0.12, 0.1, 0.05],
}
const PREPARE: FightPose = {
  ...COMPOSED,
  chest: [0.055, -0.12, 0],
  head: [0.09, 0, 0],
  leadShoulder: [-0.52, -0.1, 0.13],
  rearShoulder: [-0.48, 0.1, -0.13],
  leadElbow: [-1.5, 0, 0],
  rearElbow: [-1.4, 0, 0],
  leadWrist: [0.2, 0.3, 0],
  rearWrist: [0.15, -0.3, 0],
}
const DELIVER: FightPose = {
  ...COMPOSED,
  chest: [0.08, -0.32, 0],
  head: [-0.035, 0, 0],
  leadShoulder: [-1.18, 0, 0.11],
  leadElbow: [-0.42, 0, 0],
  leadWrist: [0.2, 0.35, 0.1],
  rearShoulder: [-0.45, 0, -0.1],
  rearElbow: [-1.5, 0, 0],
  rearWrist: [0.12, -0.2, 0],
  leadKnee: [0.16, 0, 0],
  rearKnee: [0.08, 0, 0],
}
const EXIT: FightPose = {
  ...COMPOSED,
  chest: [0.01, -0.08, 0],
  leadShoulder: [-0.1, 0, 0.04],
  rearShoulder: [0.08, 0, -0.04],
  leadHip: [0.11, 0, 0.02],
  rearHip: [-0.12, 0, -0.02],
  rearKnee: [0.18, 0, 0],
}
const ENTER: MoveTimeline = [
  { phase: 'recovery', at: 0, pose: COMPOSED },
  { phase: 'recovery', at: 0.5, pose: ADJUST_GLASSES },
  { phase: 'recovery', at: 1, pose: PREPARE },
]
const ACT: MoveTimeline = [
  { phase: 'startup', at: 0, pose: PREPARE },
  { phase: 'startup', at: 0.6, pose: { ...PREPARE, chest: [0.07, -0.09, 0] } },
  { phase: 'active', at: 0, pose: DELIVER, ease: 'out' },
  { phase: 'recovery', at: 0.2, pose: DELIVER },
  { phase: 'recovery', at: 1, pose: COMPOSED },
]
const LEAVE: MoveTimeline = [
  { phase: 'recovery', at: 0, pose: COMPOSED },
  { phase: 'recovery', at: 1, pose: EXIT },
]
const TIMING = KAMEO_CATALOGUE.tubeppa.timing

function supportPlan(slot: KameoSlot): BodyPlan {
  const phases = {
    entering: { timeline: ENTER, frames: { startup: 0, active: 0, recovery: TIMING.enter } },
    acting: {
      timeline: ACT,
      frames: { startup: TIMING.startup, active: 0, recovery: TIMING.recovery },
    },
    leaving: { timeline: LEAVE, frames: { startup: 0, active: 0, recovery: TIMING.leave } },
  }
  const phase = phases[slot.phase as keyof typeof phases]
  const pose = phase
    ? sampleTimeline(phase.timeline, {
        frame: slot.phaseFrames,
        frames: phase.frames,
        settle: false,
        continuous: true,
      })
    : COMPOSED
  return {
    key: `tubeppa:${slot.phase}`,
    pose: slot.fighter.facing === -1 ? rightHandedPose(pose) : pose,
    plant: slot.fighter.y <= 0,
    // The timeline already eases between phases; it also samples correctly after a seek.
    blend: 0,
  }
}

function reacting(fighter: ArcadeFighter): boolean {
  return (
    fighter.health <= 0 ||
    fighter.hitStun > 0 ||
    fighter.knockdownFrames > 0 ||
    ['hit', 'down', 'ko', 'wakeup'].includes(fighter.pose)
  )
}

function presentedFighter(slot: KameoSlot): ArcadeFighter {
  const { fighter } = slot
  if (slot.phase === 'eliminated' || fighter.health <= 0) return { ...fighter, pose: 'ko' }
  if (fighter.knockdownFrames > 0) return { ...fighter, pose: 'down' }
  if (fighter.hitStun > 0) return { ...fighter, pose: 'hit' }
  return fighter
}

function supportActivity(slot: KameoSlot): number {
  const settle = Math.max(0, slot.phaseFrames - TIMING.startup) / TIMING.recovery
  return slot.phase === 'acting' ? 0.8 * (1 - Math.min(1, settle)) : 0
}

export function tubeppaAnimation(
  slot: KameoSlot,
  seconds: number,
  fallenProgress = 1,
): HumanAnimationLayer {
  const dead = slot.phase === 'eliminated' || slot.fighter.health <= 0
  const fighter = presentedFighter(slot)
  const reaction = dead || reacting(fighter)
  const progress = dead ? fallenProgress : poseProgress(fighter, { seconds, started: seconds })
  const recoil = reaction ? reactionPlan(fighter, { progress }, COMPOSED) : null
  return {
    afterMotion: reaction ? undefined : tubeppaGlassesMotion(slot),
    motion: fightBodyMotion({
      fighter,
      seconds,
      progress,
      plan: recoil ? { ...recoil, blend: 0 } : supportPlan(slot),
      activity: reaction ? 0 : supportActivity(slot),
    }),
  }
}
