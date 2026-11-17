import * as THREE from 'three'
import type { VictoryActor, VictoryContext } from './types'
import { disposeVictoryObject, ease } from './resources'
import { BEYOND_CURSE_TIMING as T } from './beyondCursePose'

export function createBeyondCurseEye() {
  const root = new THREE.Group()
  const shape = new THREE.Shape()
  shape.moveTo(-1, 0)
  shape.quadraticCurveTo(0, 1.05, 1, 0)
  shape.quadraticCurveTo(0, -1.05, -1, 0)
  const eye = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 24),
    new THREE.MeshBasicMaterial({ color: 0x09060e, side: THREE.DoubleSide }),
  )
  const iris = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 40),
    new THREE.MeshBasicMaterial({ color: 0xa82740, side: THREE.DoubleSide }),
  )
  iris.position.z = 0.002
  const pupil = new THREE.Mesh(
    new THREE.CircleGeometry(0.21, 32),
    new THREE.MeshBasicMaterial({ color: 0x07060b, side: THREE.DoubleSide }),
  )
  pupil.scale.x = 0.3
  pupil.position.z = 0.004
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.025, 6, 40),
    new THREE.MeshBasicMaterial({ color: 0xd58780 }),
  )
  rim.position.z = 0.003
  root.add(eye, iris, pupil, rim)
  return root
}

function borrow(context: VictoryContext, node: THREE.Object3D) {
  const rotation = node.rotation.clone()
  context.defer(() => node.rotation.copy(rotation))
  context.save(node)
}

function princeEyes(context: VictoryContext, panic: number) {
  for (const side of ['left', 'right']) {
    const eye = context.hero.head.getObjectByName(`face-eye-${side}`)
    if (!eye) continue
    borrow(context, eye)
    eye.scale.y *= 1 + panic * 0.9
    const pupil = eye.getObjectByName('eye-pupil')
    if (!pupil) continue
    borrow(context, pupil)
    pupil.scale.multiplyScalar(1 - panic * 0.75)
  }
}

function closeDeadEyes(context: VictoryContext, actor: VictoryActor) {
  for (const side of ['left', 'right']) {
    const eye = actor.head.getObjectByName(`face-eye-${side}`)
    if (!eye) continue
    borrow(context, eye)
    eye.scale.y *= 0.1
  }
}

function attachMouth(context: VictoryContext, actor: VictoryActor, root: THREE.Group) {
  const original = actor.head.getObjectByName('face-mouth')!
  context.save(original)
  original.visible = false
  root.position.copy(original.getWorldPosition(new THREE.Vector3()))
  root.quaternion.copy(actor.head.getWorldQuaternion(new THREE.Quaternion()))
  root.scale.copy(actor.head.getWorldScale(new THREE.Vector3()))
  root.translateZ(0.012)
  context.add(root)
}

export function createBeyondCurseFace() {
  const mouth = new THREE.Group()
  mouth.name = 'beyond-curse-under-tongue'
  const cavity = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshBasicMaterial({ color: 0x1b0c17, side: THREE.DoubleSide }),
  )
  cavity.scale.set(0.04, 0.052, 1)
  const tongue = new THREE.Mesh(
    new THREE.CircleGeometry(1, 40),
    new THREE.MeshBasicMaterial({ color: 0x9e5c67, side: THREE.DoubleSide }),
  )
  tongue.scale.set(0.029, 0.028, 1)
  tongue.position.set(0, 0.016, 0.002)
  const eye = createBeyondCurseEye()
  eye.position.set(0, -0.023, 0.004)
  eye.scale.set(0.029, 0.022, 0.029)
  mouth.add(cavity, tongue, eye)
  const gasp = new THREE.Group()
  const opening = cavity.clone()
  opening.geometry = cavity.geometry.clone()
  opening.material = cavity.material.clone()
  opening.scale.set(0.028, 0.042, 1)
  gasp.add(opening)
  return {
    sync(context: VictoryContext) {
      const { age } = context
      const awake = ease((age - T.seal) / 36)
      mouth.visible = age >= T.carrierDeath
      if (mouth.visible) {
        attachMouth(context, context.victim, mouth)
        closeDeadEyes(context, context.victim)
      }
      eye.scale.y = 0.022 * (0.08 + awake * 0.92)
      const panic = ease((age - T.contact) / 72)
      if (age < T.princeDeath) princeEyes(context, panic)
      else closeDeadEyes(context, context.hero)
      if (panic > 0) {
        opening.scale.y = age >= T.princeDeath ? 0.025 : 0.036 + panic * 0.02
        attachMouth(context, context.hero, gasp)
      }
      return { awake, source: eye.getWorldPosition(new THREE.Vector3()) }
    },
    dispose() {
      disposeVictoryObject(mouth)
      disposeVictoryObject(gasp)
    },
  }
}
