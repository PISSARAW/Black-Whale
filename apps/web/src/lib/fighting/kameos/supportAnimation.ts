import type { HumanAnimationLayer, HumanMotion } from '$lib/tour/humanAnimation'
import { fightBodyMotion } from '../fightBodyMotion'
import { rightHandedPose } from '../fightHandedPose'
import type { BodyPlan, FightPose } from '../fightPose'
import { sampleTimeline, type MoveTimeline } from '../keyPoseTimeline'
import { reactionPlan } from '../fightReactions'
import { poseProgress } from '../sceneMotion'
import type { ArcadeFighter } from '../types'
import { KAMEO_CATALOGUE } from './catalogue'
import type { KameoId, KameoSlot } from './types'

export interface SupportChoreography {
  stance: FightPose
  enter: MoveTimeline
  act: MoveTimeline
  leave: MoveTimeline
  effort: number
  rightHanded?: boolean
  contact?: (slot: KameoSlot) => HumanMotion | undefined
}

function presentedFighter(slot: KameoSlot): ArcadeFighter {
  const { fighter } = slot
  if (slot.phase === 'eliminated' || fighter.health <= 0) return { ...fighter, pose: 'ko' }
  if (fighter.knockdownFrames > 0) return { ...fighter, pose: 'down' }
  if (fighter.hitStun > 0) return { ...fighter, pose: 'hit' }
  return fighter
}

function reacting(fighter: ArcadeFighter): boolean {
  return (
    fighter.health <= 0 ||
    fighter.hitStun > 0 ||
    fighter.knockdownFrames > 0 ||
    ['hit', 'down', 'ko', 'wakeup'].includes(fighter.pose)
  )
}

function supportPlan(slot: KameoSlot, style: SupportChoreography): BodyPlan {
  const timing = KAMEO_CATALOGUE[slot.fighter.id as KameoId].timing
  const phases = {
    entering: { timeline: style.enter, frames: { startup: 0, active: 0, recovery: timing.enter } },
    acting: {
      timeline: style.act,
      frames: { startup: timing.startup, active: 0, recovery: timing.recovery },
    },
    leaving: { timeline: style.leave, frames: { startup: 0, active: 0, recovery: timing.leave } },
  }
  const phase = phases[slot.phase as keyof typeof phases]
  const pose = phase
    ? sampleTimeline(phase.timeline, {
        frame: slot.phaseFrames,
        frames: phase.frames,
        settle: false,
        continuous: true,
      })
    : style.stance
  return {
    key: `${slot.fighter.id}:${slot.phase}`,
    pose: style.rightHanded && slot.fighter.facing === -1 ? rightHandedPose(pose) : pose,
    plant: slot.fighter.y <= 0,
    // The authored keys already ease continuously, including when seeking a replay.
    blend: 0,
  }
}

function supportActivity(slot: KameoSlot, effort: number): number {
  const timing = KAMEO_CATALOGUE[slot.fighter.id as KameoId].timing
  const settle = Math.max(0, slot.phaseFrames - timing.startup) / timing.recovery
  return slot.phase === 'acting' ? effort * (1 - Math.min(1, settle)) : 0
}

/** Authored supports share the roster's articulation, feet, reactions and face blending. */
export function supportAnimation(options: {
  slot: KameoSlot
  seconds: number
  fallenProgress: number
  style: SupportChoreography
}): HumanAnimationLayer {
  const { slot, seconds, style } = options
  const fighter = presentedFighter(slot)
  const dead = slot.phase === 'eliminated' || fighter.health <= 0
  const reaction = dead || reacting(fighter)
  const progress = dead
    ? options.fallenProgress
    : poseProgress(fighter, { seconds, started: seconds })
  const recoil = reaction ? reactionPlan(fighter, { progress }, style.stance) : null
  return {
    afterMotion: reaction ? undefined : style.contact?.(slot),
    motion: fightBodyMotion({
      fighter,
      seconds,
      progress,
      plan: recoil ? { ...recoil, blend: 0 } : supportPlan(slot, style),
      activity: reaction ? 0 : supportActivity(slot, style.effort),
    }),
  }
}
