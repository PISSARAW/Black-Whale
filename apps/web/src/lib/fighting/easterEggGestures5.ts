import { gesturePose as pose, gestureKeys as keys } from './easterEggGestureKit'

export const EASTER_GESTURES_5 = {
  directions: keys(
    pose([-1.1, -0.2, 0.35], [-1.1, -0.6, -0.35], { head: [-0.08, 0, 0] }),
    { head: [0, 0.25, 0] },
    { rearElbow: [0.3, 0, 0], leadWrist: [0.2, 0, 0] },
  ),
  doorHeight: keys(
    pose([-2.2, -0.35, 0.5], [-0.65, -1, -0.4], { head: [-0.2, 0, 0] }),
    { leadShoulder: [0.12, 0, 0] },
    { head: [0.3, 0, 0], leadElbow: [-0.3, 0, 0] },
  ),
  holdDoor: keys(
    pose([-1.25, -0.35, 0.6], [-0.6, -0.75, -0.45], { head: [0, 0.3, 0.05] }),
    { head: [0, 0.12, 0] },
    { body: [0.15, 0, 0], head: [0.2, -0.25, 0.12] },
  ),
  rules: keys(
    pose([-1.15, -1.05, 0.2], [-0.7, -1.4, -0.25], { head: [0.02, 0, 0] }),
    { leadWrist: [0.25, 0, 0] },
    { head: [0.08, 0, 0] },
  ),
  ledger: keys(
    pose([-0.9, -1.3, 0.18], [-0.9, -1.25, -0.3], { head: [0.34, 0, -0.03] }),
    { leadWrist: [0, 0.2, 0.1] },
    { head: [0.1, 0.12, 0] },
  ),
  stamp: keys(
    pose([-0.9, -1.05, 0.2], [-0.85, -1.25, -0.3], { head: [0.3, 0, 0] }),
    { leadElbow: [0.35, 0, 0] },
    { head: [0.12, 0, 0.15], leadWrist: [0.25, 0, 0] },
  ),
}
