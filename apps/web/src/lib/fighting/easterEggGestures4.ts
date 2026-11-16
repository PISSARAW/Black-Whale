import { gesturePose as pose, gestureKeys as keys } from './easterEggGestureKit'

export const EASTER_GESTURES_4 = {
  doorFrame: keys(
    pose([-1.6, -0.45, 0.7], [-1.6, -0.45, -0.7], { head: [0, 0, 0] }),
    { leadShoulder: [0.15, 0, 0.1] },
    { rearShoulder: [0.3, 0, 0] },
  ),
  peek: keys(
    pose([-0.6, -1, 0.2], [-0.4, -1, -0.2], { head: [0.08, 0.35, 0.08] }),
    { chest: [0, 0.2, 0] },
    { head: [0, -0.65, 0], body: [0.12, 0, 0] },
  ),
  knock: keys(
    pose([-1.15, -0.9, 0.2], [-0.2, -0.6, -0.2], { head: [0.02, 0, 0] }),
    { leadElbow: [0.25, 0, 0] },
    { head: [0.08, 0, 0.18], leadWrist: [0.2, 0, 0] },
  ),
  leaf: keys(
    pose([-1, -1.45, 0.18], [-0.2, -0.5, -0.2], { head: [0.23, 0, 0.1] }),
    { leadWrist: [0, 0.3, 0] },
    { head: [0.08, 0, -0.08] },
  ),
  sleeveLeaf: keys(
    pose([-0.7, -1.25, 0.25], [-1, -1.6, -0.3], { head: [0.32, 0, 0] }),
    { rearElbow: [0.2, 0, 0] },
    { head: [-0.12, 0.1, 0], leadWrist: [0.3, 0, 0] },
  ),
  chin: keys(
    pose([-1.3, -2, 0.18], [-0.5, -1.55, -0.25], { head: [0.18, 0, 0] }),
    { head: [0.03, 0, 0.05] },
    { head: [0.08, -0.15, 0] },
  ),
  scrutinise: keys(
    pose([-0.6, -1.2, 0.22], [-0.2, -0.8, -0.25], { head: [0.05, 0.12, -0.1] }),
    { head: [0.06, 0, 0] },
    { body: [0.12, 0, 0], head: [0, -0.2, 0] },
  ),
  selfInspect: keys(
    pose([-0.7, -1.4, 0.3], [-0.9, -1.5, -0.25], { head: [0.3, 0.1, 0] }),
    { rearWrist: [0, 0.15, 0] },
    { head: [0.15, -0.15, -0.08], leadWrist: [0.25, 0, 0] },
  ),
  hat: keys(
    pose([-2.4, -1.8, 0.45], [-0.2, -0.5, -0.3], { head: [-0.08, 0, 0.1] }),
    { leadWrist: [0.2, 0, 0] },
    { head: [0.1, 0, -0.1] },
  ),
  letter: keys(
    pose([-0.85, -1.35, 0.2], [-0.85, -1.35, -0.2], { head: [0.3, 0, 0] }),
    { leadWrist: [0.2, 0, 0.1] },
    { rearWrist: [-0.25, 0, 0] },
  ),
  wrongFold: keys(
    pose([-0.9, -1.45, 0.2], [-0.9, -1.45, -0.2], { head: [0.25, 0, 0.08] }),
    { leadWrist: [0.2, 0.2, 0] },
    { head: [0.12, 0, -0.2], rearShoulder: [0.12, 0, 0] },
  ),
  beard: keys(
    pose([-1.1, -1.9, 0.25], [-0.25, -0.8, -0.3], { head: [-0.06, 0, 0.1] }),
    { leadWrist: [0.2, 0, 0] },
    { head: [-0.12, 0, 0] },
  ),
  expedition: keys(
    pose([-0.9, -0.45, 1], [-0.9, -0.45, -1], { head: [-0.18, 0, 0] }),
    { chest: [-0.06, 0, 0] },
    { head: [0, 0.18, 0] },
  ),
  map: keys(
    pose([-0.95, -0.8, 0.5], [-0.95, -0.8, -0.5], { head: [0.32, 0, 0] }),
    { leadShoulder: [0, 0, 0.12] },
    { rearWrist: [0, 0.2, 0] },
  ),
  upsideDown: keys(
    pose([-0.85, -1.1, 0.35], [-0.85, -1.1, -0.35], { head: [0.25, 0, 0] }),
    { leadWrist: [0, 0.3, 0] },
    { head: [-0.22, 0, 0.1], rearWrist: [0, -0.6, 0] },
  ),
  handshake: keys(
    pose([-1, -0.4, 0.15], [-0.15, -0.5, -0.2], { head: [0.04, 0, 0.04] }),
    { leadElbow: [0.1, 0, 0] },
    { head: [0.08, 0, 0] },
  ),
  sign: keys(
    pose([-0.8, -1.45, 0.2], [-0.8, -1.2, -0.2], { head: [0.3, 0, 0] }),
    { leadWrist: [0, 0.2, 0.15] },
    { head: [0.08, 0, 0] },
  ),
  dryPen: keys(
    pose([-1.2, -1.4, 0.25], [-0.7, -1.3, -0.3], { head: [0.18, 0, 0] }),
    { leadWrist: [0, 0.6, 0] },
    { head: [0.12, 0, 0.18], leadElbow: [-0.2, 0, 0] },
  ),
  owlSketch: keys(
    pose([-0.9, -1.35, 0.24], [-0.9, -1.25, -0.24], { head: [0.34, 0, 0.02] }),
    { leadWrist: [0, 0.2, 0.16] },
    { head: [0.05, 0, -0.08] },
  ),
  yawn: keys(
    pose([-1.7, -1.9, 0.24], [-0.5, -1.3, -0.2], { head: [-0.18, 0, 0] }),
    { chest: [0.06, 0, 0] },
    { head: [0.3, 0, 0], leadShoulder: [0.2, 0, 0] },
  ),
  align: keys(
    pose([-1.05, -1.1, 0.25], [-0.85, -1.1, -0.3], { head: [0.27, 0, 0] }),
    { leadWrist: [0, 0.2, 0] },
    { rearWrist: [0.3, 0, 0] },
  ),
  wrongHand: keys(
    pose([-1, -0.5, 0.2], [-0.3, -0.7, -0.2], { head: [0.08, 0, 0] }),
    { head: [0, 0.2, 0] },
    { leadElbow: [-0.9, 0, 0], rearShoulder: [-0.7, 0, 0], head: [0.1, 0, 0.1] },
  ),
  wave: keys(
    pose([-1.9, -1.25, 0.65], [0.1, -0.4, -0.2], { head: [-0.03, 0, 0.06] }),
    { leadWrist: [0, 0, 0.4] },
    { head: [0.08, 0, 0] },
  ),
  memoDrop: keys(
    pose([-0.8, -1.1, 0.25], [-0.4, -1.2, -0.2], { head: [0.2, 0, 0] }),
    { body: [0.1, 0, 0] },
    { head: [0.3, 0, 0.1], leadShoulder: [-0.15, 0, 0] },
  ),
  palms: keys(
    pose([-0.9, -1, 0.4], [-0.9, -1, -0.4], { head: [0.3, 0, 0] }),
    { leadWrist: [0.3, 0, 0] },
    { rearWrist: [-0.25, 0, 0] },
  ),
  squareFold: keys(
    pose([-0.85, -1.15, 0.2], [-0.85, -1.15, -0.2], { head: [0.3, 0, 0] }),
    { leadElbow: [0.12, 0, 0] },
    { rearWrist: [0.35, 0, 0], head: [-0.05, 0, 0] },
  ),
  wrongSleeve: keys(
    pose([-0.65, -1.5, 0.22], [-0.75, -1.4, -0.22], { head: [0.25, 0.2, 0] }),
    { rearWrist: [0.2, 0, 0] },
    { head: [0.1, -0.4, 0.1], leadShoulder: [0.1, 0.2, 0] },
  ),
}
