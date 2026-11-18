import { Vector3, type Object3D } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'

export interface IntroLandmarkBounds {
  left: number
  right: number
  bottom: number
  top: number
  near: number
  far: number
}
const point = new Vector3()
const anchors = new WeakMap<Object3D, Array<{ node: Object3D; radius: number }>>()

/** Fit the animated body rather than backing away for an imaginary maximum-size fighter. */
export function introLandmarkBounds(figure?: Object3D): IntroLandmarkBounds | undefined {
  if (!figure) return undefined
  const rig = humanAnimationRig(figure)
  if (!rig) return undefined
  let nodes = anchors.get(figure)
  if (!nodes) {
    nodes = [
      { node: rig.head, radius: 0.38 },
      { node: rig.torso, radius: 0.34 },
      ...rig.arms.map((arm) => ({
        node:
          arm.getObjectByName('hand-right') ??
          arm.getObjectByName('hand-left') ??
          arm.children[1] ??
          arm,
        radius: 0.2,
      })),
      ...rig.knees.map((knee) => ({ node: knee.children[1] ?? knee, radius: 0.18 })),
    ]
    anchors.set(figure, nodes)
  }
  const bounds = {
    left: Infinity,
    right: -Infinity,
    bottom: Infinity,
    top: -Infinity,
    near: Infinity,
    far: -Infinity,
  }
  for (const { node, radius } of nodes) {
    node.getWorldPosition(point)
    bounds.left = Math.min(bounds.left, point.x - radius)
    bounds.right = Math.max(bounds.right, point.x + radius)
    bounds.bottom = Math.min(bounds.bottom, Math.max(0.02, point.y - radius))
    bounds.top = Math.max(bounds.top, point.y + radius)
    bounds.near = Math.min(bounds.near, point.z - radius)
    bounds.far = Math.max(bounds.far, point.z + radius)
  }
  return bounds
}
