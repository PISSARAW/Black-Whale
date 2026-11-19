import type { FightPose } from './fightPose'

/** Stay composed while closing; reserve the low acceleration for a finite dash. */
export const HANZO_WALK_STYLE = {
  advance: {
    body: [0.07, 0, 0],
    head: [-0.04, 0, 0],
    chest: [0.02, -0.06, 0],
    leadShoulder: [-0.18, 0, 0.08],
    leadElbow: [-0.3, 0, 0],
    leadWrist: [-0.2, 0.1, 0],
    rearShoulder: [-0.08, 0, -0.1],
    rearElbow: [-0.2, 0, 0],
  },
  retreat: {
    body: [-0.03, 0, 0],
    chest: [0, 0.12, 0],
    leadShoulder: [-0.45, 0, 0.15],
    leadElbow: [-0.45, 0, 0],
    leadWrist: [-0.25, 0.15, 0],
    rearElbow: [-0.35, 0, 0],
  },
  rhythm: { chest: [0, 0.015, 0], leadShoulder: [0.025, 0, 0], rearShoulder: [-0.02, 0, 0] },
} satisfies Record<string, FightPose>

const FORWARD: FightPose[] = [
  { body: [0.12, 0, 0], leadHip: [-0.25, 0, 0], leadKnee: [0.5, 0, 0], rearKnee: [0.45, 0, 0] },
  {
    body: [0.4, 0, 0],
    chest: [0.06, -0.12, 0],
    head: [-0.3, 0, 0],
    leadShoulder: [-0.45, 0, 0.15],
    leadElbow: [-0.55, 0, 0],
    leadWrist: [-0.35, 0.15, 0],
    rearShoulder: [0.5, 0, -0.3],
    rearElbow: [-0.2, 0, 0],
    leadHip: [-0.6, 0, 0],
    leadKnee: [0.4, 0, 0],
    rearHip: [0.4, 0, 0],
    rearKnee: [0.3, 0, 0],
  },
  { body: [0.08, 0, 0], leadKnee: [0.4, 0, 0], rearHip: [-0.18, 0, 0], rearKnee: [0.45, 0, 0] },
]
const BACKWARD: FightPose[] = [
  { body: [-0.08, 0, 0], chest: [0, 0.15, 0], leadKnee: [0.5, 0, 0], rearKnee: [0.4, 0, 0] },
  {
    body: [-0.14, 0, 0],
    chest: [0.02, 0.22, 0],
    leadShoulder: [-0.7, 0, 0.18],
    leadElbow: [-0.45, 0, 0],
    leadWrist: [-0.3, 0.15, 0],
    rearShoulder: [-0.15, 0, -0.2],
    rearElbow: [-0.55, 0, 0],
    leadHip: [0.35, 0, 0],
    leadKnee: [0.3, 0, 0],
    rearHip: [-0.55, 0, 0],
    rearKnee: [0.4, 0, 0],
  },
  { body: [0.02, 0, 0], chest: [0, 0.06, 0], leadKnee: [0.4, 0, 0], rearKnee: [0.5, 0, 0] },
]

export function hanzoDashPoses(forward: boolean): FightPose[] {
  return forward ? FORWARD : BACKWARD
}
