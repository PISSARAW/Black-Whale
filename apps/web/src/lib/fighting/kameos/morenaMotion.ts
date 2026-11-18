import type { HumanAnimationLayer, HumanMotion } from '$lib/tour/humanAnimation'
import type { FightPose } from '../fightPose'
import { supportAnimation, type SupportChoreography } from './supportAnimation'
import { placeSupportHand } from './supportHandContact'
import { morenaHairMotion } from './morenaHairMotion'
import type { KameoSlot } from './types'

const COMPOSED: FightPose = {
  chest: [0.01, -0.16, 0.015],
  head: [0.035, 0, -0.025],
  leadShoulder: [-0.15, 0, 0.035],
  rearShoulder: [-0.12, 0, -0.035],
  leadElbow: [-0.48, 0, 0],
  rearElbow: [-0.5, 0, 0],
  leadWrist: [0.1, 0.15, 0.05],
  rearWrist: [0.08, -0.15, -0.04],
  leadHip: [-0.035, 0, 0.012],
  rearHip: [0.025, 0, -0.012],
  leadKnee: [0.065, 0, 0],
  rearKnee: [0.05, 0, 0],
}
const LIPS: FightPose = {
  ...COMPOSED,
  chest: [0.025, -0.1, 0.025],
  head: [0.045, 0, -0.035],
  leadShoulder: [-1.25, 0, -0.15],
  leadElbow: [-1.9, 0, 0],
  leadWrist: [0.25, 0.15, -0.12],
  rearElbow: [-0.68, 0, 0],
}
const INVITE: FightPose = {
  ...COMPOSED,
  chest: [0.055, -0.28, 0.015],
  head: [-0.025, 0, -0.035],
  leadShoulder: [-1.18, 0, 0.11],
  leadElbow: [-0.37, 0, 0],
  leadWrist: [0.15, 0.78, 0.12],
  rearShoulder: [-0.22, 0, -0.06],
  rearElbow: [-0.9, 0, 0],
  leadKnee: [0.1, 0, 0],
}
const WITHDRAW: FightPose = {
  ...COMPOSED,
  chest: [0.01, -0.06, 0],
  head: [0.025, 0.06, -0.015],
  leadHip: [0.045, 0, 0.012],
  rearHip: [-0.045, 0, -0.012],
  rearKnee: [0.1, 0, 0],
}
const smooth = (t: number) => {
  const p = Math.min(1, Math.max(0, t))
  return p * p * (3 - 2 * p)
}

function lipsContact(slot: KameoSlot): HumanMotion | undefined {
  if (slot.phase !== 'entering' && slot.phase !== 'acting') return
  const strength =
    slot.phase === 'entering'
      ? smooth(slot.phaseFrames / 9)
      : 1 - smooth((slot.phaseFrames - 7) / 5)
  return (human) => placeSupportHand({ human, target: [0.032, -0.103, 0.215], strength })
}

const STYLE: SupportChoreography = {
  stance: COMPOSED,
  effort: 0.68,
  rightHanded: true,
  contact: lipsContact,
  enter: [
    { phase: 'recovery', at: 0, pose: COMPOSED },
    { phase: 'recovery', at: 0.5, pose: LIPS },
    { phase: 'recovery', at: 1, pose: LIPS },
  ],
  act: [
    { phase: 'startup', at: 0, pose: LIPS },
    { phase: 'startup', at: 0.58, pose: LIPS },
    { phase: 'active', at: 0, pose: INVITE, ease: 'out' },
    { phase: 'recovery', at: 0.2, pose: INVITE },
    { phase: 'recovery', at: 1, pose: COMPOSED },
  ],
  leave: [
    { phase: 'recovery', at: 0, pose: COMPOSED },
    { phase: 'recovery', at: 1, pose: WITHDRAW },
  ],
}

export function morenaAnimation(
  slot: KameoSlot,
  seconds: number,
  fallenProgress = 1,
): HumanAnimationLayer {
  const layer = supportAnimation({ slot, seconds, fallenProgress, style: STYLE })
  const hair = morenaHairMotion(slot, seconds)
  return {
    ...layer,
    afterMotion: (human) => {
      layer.afterMotion?.(human)
      hair(human)
    },
  }
}
