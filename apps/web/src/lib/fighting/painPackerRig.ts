import type { Object3D } from 'three'
import type { VisitHatsuModel } from './visitHatsuModel'
import type { Three } from '$lib/tour/silentMajorityParts'

const HIDDEN = new WeakMap<Object3D, Map<Object3D, boolean>>()

export function restorePainPackerWearer(root: Object3D) {
  for (const [part, visible] of HIDDEN.get(root) ?? []) part.visible = visible
  HIDDEN.delete(root)
}

function follow(options: {
  THREE: Three
  joint?: Object3D
  target?: Object3D | null
  offset?: readonly [number, number, number]
}) {
  const { THREE, joint, target, offset = [0, 0, 0] } = options
  if (!joint?.parent || !target) return
  target.updateWorldMatrix(true, false)
  joint.parent.updateWorldMatrix(true, false)
  const world = new THREE.Vector3(...offset).applyMatrix4(target.matrixWorld)
  joint.position.copy(joint.parent.worldToLocal(world))
  const parentRotation = joint.parent.getWorldQuaternion(new THREE.Quaternion()).invert()
  joint.quaternion.copy(parentRotation.multiply(target.getWorldQuaternion(new THREE.Quaternion())))
  joint.scale.copy(
    target
      .getWorldScale(new THREE.Vector3())
      .divide(joint.parent.getWorldScale(new THREE.Vector3())),
  )
}

/** Keep coat on hips, sleeves on arms and hood on the head; restore the wearer on removal. */
export function syncPainPackerRig(options: {
  THREE: Three
  outfit: VisitHatsuModel
  figure: Object3D
  active: boolean
}) {
  const { THREE, outfit, figure, active } = options
  restorePainPackerWearer(outfit.root)
  if (!active) return
  const head = hideBaseWearer(outfit.root, figure)
  const common = { THREE }
  follow({ ...common, joint: outfit.joints.get('pain-packer-hood'), target: head })
  follow({
    ...common,
    joint: outfit.joints.get('pain-packer-chest'),
    target: figure.getObjectByName('torso'),
    offset: [0, 0.22, 0],
  })
  const hip = figure.getObjectByName('hip-left')
  follow({
    ...common,
    joint: outfit.joints.get('pain-packer-coat'),
    target: hip?.parent ?? undefined,
    offset: [0, (hip?.position.y ?? 0.77) + 0.07, 0],
  })
  for (const side of ['left', 'right']) {
    follow({
      ...common,
      joint: outfit.joints.get(`pain-packer-arm-${side}`),
      target: figure.getObjectByName(`shoulder-${side}`),
    })
    follow({
      ...common,
      joint: outfit.joints.get(`pain-packer-elbow-${side}`),
      target: figure.getObjectByName(`elbow-${side}`),
    })
  }
}

function hideBaseWearer(root: Object3D, figure: Object3D) {
  const head =
    figure.getObjectByName('manga-head:feitan-portor') ??
    figure.getObjectByName('face-mouth')?.parent
  const hidden = new Map<Object3D, boolean>()
  for (const name of ['manga-long-coat', 'feitan-coat-folds']) {
    const part = figure.getObjectByName(name)
    if (part) {
      hidden.set(part, part.visible)
      part.visible = false
    }
  }
  if (head) {
    hidden.set(head, head.visible)
    head.visible = false
  }
  HIDDEN.set(root, hidden)
  return head
}
