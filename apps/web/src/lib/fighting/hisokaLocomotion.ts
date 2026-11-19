import type { FightPose } from './fightPose'

/** Upright, loose shoulders and card hand low; short elastic steps rather than a sprinting guard. */
export const HISOKA_WALK_STYLE = {
  advance: { body: [-0.015, 0, 0], chest: [-0.025, 0.06, 0.01] },
  retreat: { body: [-0.06, 0, 0], chest: [-0.025, 0.1, 0.02], leadElbow: [-0.08, 0, 0] },
  rhythm: {
    chest: [0, 0.035, 0.015],
    leadShoulder: [0.025, 0, 0.025],
    rearShoulder: [-0.025, 0, -0.02],
  },
} satisfies Record<string, FightPose>

export function hisokaDashPoses(forward: boolean): FightPose[] {
  return forward
    ? [
        {
          root: [0, -0.04, -0.025],
          body: [0.08, 0, 0],
          leadKnee: [0.32, 0, 0],
          rearKnee: [0.35, 0, 0],
        },
        {
          root: [0, 0.025, 0.075],
          body: [0.14, 0, 0],
          chest: [0.025, -0.18, 0],
          leadHip: [-0.42, 0, 0],
          leadKnee: [0.22, 0, 0],
          rearHip: [0.25, 0, 0],
        },
        {
          root: [0, -0.025, 0.025],
          body: [0.025, 0, 0],
          leadKnee: [0.28, 0, 0],
          rearKnee: [0.22, 0, 0],
        },
      ]
    : [
        {
          root: [0, -0.04, 0.025],
          body: [-0.08, 0, 0],
          leadKnee: [0.35, 0, 0],
          rearKnee: [0.28, 0, 0],
        },
        {
          root: [0, 0.045, -0.06],
          body: [-0.15, 0, 0],
          chest: [-0.04, 0.12, 0],
          leadHip: [0.24, 0, 0],
          rearHip: [-0.4, 0, 0],
          rearKnee: [0.28, 0, 0],
          leadShoulder: [-0.08, 0, 0.1],
        },
        {
          root: [0, -0.025, -0.025],
          body: [-0.03, 0, 0],
          leadKnee: [0.28, 0, 0],
          rearKnee: [0.22, 0, 0],
        },
      ]
}
