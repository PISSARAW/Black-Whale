import type { FightPose } from './fightPose'

/** The right forearm supports the book; steps come from the hips, not a pumping run. */
export const CHROLLO_WALK_STYLE = {
  advance: { body: [0.025, 0, 0], chest: [0, 0.04, 0] },
  retreat: { body: [-0.06, 0, 0], chest: [-0.02, 0.08, 0], rearElbow: [-0.12, 0, 0] },
  rhythm: { chest: [0, 0.025, 0.012], rearShoulder: [0.025, 0, 0] },
} satisfies Record<string, FightPose>

export function chrolloDashPoses(forward: boolean): FightPose[] {
  const sign = forward ? 1 : -1
  return [
    {
      root: [0, -0.045, -0.02 * sign],
      body: [0.06 * sign, 0, 0],
      leadKnee: [0.35, 0, 0],
      rearKnee: [0.25, 0, 0],
      rearElbow: [-0.35, 0, 0],
    },
    {
      root: [0, 0.025, 0.065 * sign],
      body: [0.14 * sign, 0, 0],
      chest: [0, -0.1 * sign, 0.025],
      leadHip: [-0.4 * sign, 0, 0],
      rearHip: [0.28 * sign, 0, 0],
      rearElbow: [-0.45, 0, 0],
    },
    {
      root: [0, -0.02, 0.02 * sign],
      body: [0.02 * sign, 0, 0],
      leadKnee: [0.22, 0, 0],
      rearKnee: [0.2, 0, 0],
      rearElbow: [-0.18, 0, 0],
    },
  ]
}
