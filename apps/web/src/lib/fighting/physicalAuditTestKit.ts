import type { Object3D } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { HUMAN_JOINT_LIMITS } from '$lib/tour/humanJointLimits'

type Kind = keyof typeof HUMAN_JOINT_LIMITS
export interface PhysicalJoint {
  node: Object3D
  kind: Kind
  side: 1 | -1
}

/** Include scene-owned doubles, alternate bodies and the native actors. */
export function physicalJoints(root: Object3D): PhysicalJoint[] {
  const result: PhysicalJoint[] = []
  const heads = new Set<Object3D>()
  root.traverse((node) => {
    const human = humanAnimationRig(node)
    if (human) heads.add(human.head)
  })
  root.traverse((node) => {
    const match = /^(shoulder|elbow|hand|hip|knee)-(left|right)$/.exec(node.name)
    if (match) {
      result.push({
        node,
        kind: (match[1] === 'hand' ? 'wrist' : match[1]) as Kind,
        side: match[2] === 'left' ? -1 : 1,
      })
    } else if (node.name === 'fight-chest') result.push({ node, kind: 'chest', side: 1 })
    else if (isHead(node, heads)) result.push({ node, kind: 'head', side: 1 })
    else if (node.parent?.name.startsWith('knee-') && node.parent.children[1] === node)
      result.push({ node, kind: 'ankle', side: 1 })
  })
  return result
}

function isHead(node: Object3D, heads: Set<Object3D>): boolean {
  return heads.has(node) || node.name.startsWith('manga-head:') || node.name === 'kurapika-head'
}

export function physicalViolations(joints: PhysicalJoint[]) {
  return joints.flatMap(({ node, kind, side }) => {
    const limits = HUMAN_JOINT_LIMITS[kind]
    return (['x', 'y', 'z'] as const).flatMap((axis) => {
      const value = node.rotation[axis] * (axis === 'z' && 'sided' in limits ? side : 1)
      const [low, high] = limits[axis]
      const excess = Math.max(low - value, value - high, 0)
      return !Number.isFinite(value) || excess > 1e-5
        ? [
            {
              joint: `${node.name || kind}.${axis}`,
              value: (value * 180) / Math.PI,
              excess: (excess * 180) / Math.PI,
            },
          ]
        : []
    })
  })
}

/** Articulations may rotate; neither their bones nor their local scale may stretch. */
export function boneSnapshot(joints: PhysicalJoint[]) {
  return joints
    .filter(({ kind }) => ['elbow', 'knee'].includes(kind))
    .map(({ node }) => [node.uuid, ...node.position.toArray(), ...node.scale.toArray()])
}
