import type { HumanAnimationLayer } from '$lib/tour/humanAnimation'
import type { FightPose } from '../fightPose'
import { supportAnimation, type SupportChoreography } from './supportAnimation'
import { luzurusPuffMotion } from './luzurusPuffMotion'
import type { KameoSlot } from './types'

const RELAXED: FightPose = {
  chest: [-0.025, -0.17, 0.025],
  head: [0.035, 0, -0.025],
  leadShoulder: [-0.22, 0, 0.035],
  rearShoulder: [-0.16, 0, -0.045],
  leadElbow: [-0.7, 0, 0],
  rearElbow: [-0.92, 0, 0],
  leadWrist: [0.07, 0.2, 0],
  rearWrist: [0.04, -0.2, 0],
  leadHip: [-0.055, 0, 0.025],
  rearHip: [0.035, 0, -0.015],
  leadKnee: [0.1, 0, 0],
  rearKnee: [0.07, 0, 0],
}
const INSPECT: FightPose = {
  ...RELAXED,
  chest: [0.045, -0.13, 0.02],
  head: [0.13, 0.06, -0.02],
  leadShoulder: [-0.58, 0, 0.1],
  leadElbow: [-1.15, 0, 0],
  leadWrist: [0.1, 0.55, 0.1],
  rearElbow: [-1.05, 0, 0],
}
const SET_TRAP: FightPose = {
  ...RELAXED,
  chest: [0.16, -0.28, 0.015],
  head: [0.16, 0, 0],
  leadShoulder: [-0.43, 0, 0.08],
  leadElbow: [-0.15, 0, 0],
  leadWrist: [-0.12, 0.4, 0.08],
  rearShoulder: [-0.26, 0, -0.045],
  rearElbow: [-1.1, 0, 0],
  leadKnee: [0.24, 0, 0],
  rearKnee: [0.14, 0, 0],
}
const WITHDRAW: FightPose = {
  ...RELAXED,
  chest: [-0.01, -0.07, 0.015],
  head: [0.025, 0.12, -0.02],
  leadHip: [0.07, 0, 0.015],
  rearHip: [-0.07, 0, -0.015],
  rearKnee: [0.14, 0, 0],
}
const STYLE: SupportChoreography = {
  stance: RELAXED,
  effort: 0.78,
  rightHanded: true,
  enter: [
    { phase: 'recovery', at: 0, pose: RELAXED },
    { phase: 'recovery', at: 0.5, pose: INSPECT },
    { phase: 'recovery', at: 1, pose: INSPECT },
  ],
  act: [
    { phase: 'startup', at: 0, pose: INSPECT },
    { phase: 'startup', at: 0.55, pose: { ...INSPECT, leadElbow: [-1.3, 0, 0] } },
    { phase: 'active', at: 0, pose: SET_TRAP, ease: 'out' },
    { phase: 'recovery', at: 0.2, pose: SET_TRAP },
    { phase: 'recovery', at: 1, pose: RELAXED },
  ],
  leave: [
    { phase: 'recovery', at: 0, pose: RELAXED },
    { phase: 'recovery', at: 1, pose: WITHDRAW },
  ],
}

/** Art direction for the existing arcade trap, sampled on its real phase counters. */
export function luzurusAnimation(
  slot: KameoSlot,
  seconds: number,
  fallenProgress = 1,
): HumanAnimationLayer {
  const layer = supportAnimation({ slot, seconds, fallenProgress, style: STYLE })
  return { ...layer, afterMotion: luzurusPuffMotion(slot, seconds) }
}
