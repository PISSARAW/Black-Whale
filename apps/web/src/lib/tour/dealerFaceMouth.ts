import type { Object3D } from 'three'

/** Preserve the negotiation's smile/frown states on the new native curved lip. */
export function animateDealerMouth(root: Object3D, stage: number, seconds: number) {
  const mouth = root.getObjectByName('face-mouth')
  if (!mouth) return
  const curved = mouth.userData.expressionCurve === true
  if (curved) mouth.scale.y = [1, 1.4, 1.9, -0.85, 0.4][stage] ?? 1
  else animateCorners(root, stage, seconds)
  mouth.scale.x = stage === 3 ? 0.72 : stage === 2 ? 1.12 : 1
  mouth.position.y = (curved ? -0.108 : -0.09) + (stage === 2 ? 0.006 : 0)
}

function animateCorners(root: Object3D, stage: number, seconds: number) {
  const smile = stage === 1 ? 0.28 : stage === 2 ? 0.4 : stage === 3 ? -0.22 : 0.12
  for (const [index, name] of ['morena-mouth-left', 'morena-mouth-right'].entries()) {
    const corner = root.getObjectByName(name)
    if (!corner) continue
    corner.rotation.z = (index === 0 ? -1 : 1) * smile
    corner.position.y = -0.09 + Math.sin(seconds * 0.8) * 0.002
  }
}
