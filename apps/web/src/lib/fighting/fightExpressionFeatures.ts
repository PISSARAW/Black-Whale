import type { Mesh, Object3D } from 'three'
import type { HumanFigureBuild } from '$lib/tour/humanFigure'
import type { FightFacePose } from './fightExpressions'

export interface FacePart {
  node: Object3D
  rotation: number
  y: number
  x: number
  scale: number
  side: number
}
export const captureFacePart = (node: Object3D, side = 0): FacePart => ({
  node,
  side,
  rotation: node.rotation.z,
  x: node.position.x,
  y: node.position.y,
  scale: node.scale.y,
})

export function captureFaceParts(head: Object3D, prefix: string): FacePart[] {
  return [-1, 1].flatMap((side) => {
    const node = head.getObjectByName(`${prefix}-${side < 0 ? 'left' : 'right'}`)
    return node?.visible ? [captureFacePart(node, side)] : []
  })
}

export function nativeExpressionEyes(head: Object3D): FacePart[] {
  const ordinary = captureFaceParts(head, 'face-eye')
  if (ordinary.length) return ordinary
  // Yokotani's visible arched lids replace the ordinary eyes; never reveal hidden eyes.
  return head.children
    .filter((node) => node.name === 'yokotani-smiling-eyelid')
    .map((node) => captureFacePart(node, Math.sign(node.position.x)))
}

const NATIVE_MOUTHS = new Set([
  'melody-mouth',
  'melody-tooth-left',
  'melody-tooth-right',
  'gel-lipstick',
  'saiyu-gritted-mouth',
  'luini-toothed-grin',
  'yokotani-wide-smile',
  'yokotani-smile-teeth',
])

/** Keep lips, teeth and their distinctive materials together, without adding a drawable. */
export function nativeExpressionMouth(options: {
  THREE: HumanFigureBuild['THREE']
  head: Object3D
  mouth?: Mesh
}): FacePart | undefined {
  const { THREE, head, mouth } = options
  const parts = head.children.filter((node) => node.visible && NATIVE_MOUTHS.has(node.name))
  if (!parts.length) return
  if (mouth?.visible) parts.push(mouth)
  head.updateWorldMatrix(true, true)
  const box = new THREE.Box3()
  for (const part of parts) box.union(new THREE.Box3().setFromObject(part))
  const centre = head.worldToLocal(box.getCenter(new THREE.Vector3()))
  const pivot = new THREE.Group()
  pivot.name = 'fight-expression-native-mouth'
  pivot.position.copy(centre)
  head.add(pivot)
  for (const part of parts) {
    part.position.sub(centre)
    pivot.add(part)
  }
  return captureFacePart(pivot)
}

export function drawNativeExpressionMouth(part: FacePart | undefined, pose: FightFacePose) {
  if (!part) return
  // Small coherent motions preserve the native grin, lipstick and teeth.
  part.node.scale.x = 1 + pose.effort * 0.04 + pose.smile * 0.025 - pose.pain * 0.025
  part.node.scale.y = part.scale * (1 + pose.effort * 0.1 - pose.pain * 0.12)
}
