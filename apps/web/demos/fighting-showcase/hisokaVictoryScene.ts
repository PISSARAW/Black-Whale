import { presentVictoryTether } from './hisokaVictoryTether'
import { Object3D, PerspectiveCamera, Quaternion, Scene, Vector3 } from 'three'
import type { FightState } from '../../src/lib/fighting/types'
import { applyCinematicFrame, type CinematicFrame } from './cinematicCamera'
import { createVictoryCard } from './hisokaVictoryProps'
import { naturalHisokaSmile } from './hisokaNaturalSmile'

const smooth = (v: number) => {
  const t = Math.max(0, Math.min(1, v))
  return t * t * (3 - 2 * t)
}
const point = (node: Object3D) => node.getWorldPosition(new Vector3())

function aim(node: Object3D, child: Object3D, target: Vector3) {
  node.parent!.updateWorldMatrix(true, true)
  const direction = node.parent!.worldToLocal(target.clone()).sub(node.position).normalize()
  node.quaternion.setFromUnitVectors(child.position.clone().normalize(), direction)
  node.updateWorldMatrix(true, true)
}

/** Two real arm segments meet the card grip without stretching the figure. */
function reach(root: Object3D, target: Vector3, pole: Vector3) {
  const upper = root.getObjectByName('shoulder-right')!
  const lower = root.getObjectByName('elbow-right')!
  const hand = root.getObjectByName('hand-right')!
  const origin = point(upper),
    vector = target.clone().sub(origin)
  const a = point(lower).distanceTo(origin),
    b = point(hand).distanceTo(point(lower))
  const length = Math.min(a + b - 0.001, Math.max(0.001, vector.length()))
  const direction = vector.normalize()
  const along = (a * a - b * b + length * length) / (2 * length)
  const bend = pole.clone().sub(origin)
  bend.addScaledVector(direction, -bend.dot(direction)).normalize()
  const elbow = origin
    .clone()
    .addScaledVector(direction, along)
    .addScaledVector(bend, Math.sqrt(Math.max(0, a * a - along * along)))
  aim(upper, lower, elbow)
  aim(lower, hand, origin.clone().addScaledVector(direction, length))
  return point(hand).distanceTo(target)
}

function portrait(
  scene: Scene,
  camera: PerspectiveCamera,
  options: { age: number; props: ReturnType<typeof makeProps> },
) {
  const { age, props } = options
  const head = scene.getObjectByName('manga-head:hisoka')!
  const root = scene.children.find((node) => node.getObjectByName(head.name) === head)!
  const restores: Array<() => void> = []
  const save = (node: Object3D) => {
    const q = node.quaternion.clone(),
      scale = node.scale.clone(),
      position = node.position.clone(),
      visible = node.visible
    restores.push(() => {
      node.quaternion.copy(q)
      node.scale.copy(scale)
      node.position.copy(position)
      node.visible = visible
    })
  }
  for (const name of ['shoulder-right', 'elbow-right', 'hand-right', head.name])
    save(root.getObjectByName(name)!)
  root.traverse((node) => {
    if (node.name.startsWith('nen-') || /card|projectile/.test(node.name)) {
      save(node)
      node.visible = false
    }
  })
  const chest = root.getObjectByName('fight-chest')
  if (chest) {
    save(chest)
    chest.rotation.set(0, 0, 0)
    chest.position.set(0, 0, 0)
  }
  const smile = smooth((age - 400) / 110)
  head.rotation.set(0, 0, 0)
  head.updateWorldMatrix(true, true)
  const q = head.getWorldQuaternion(new Quaternion())
  const origin = point(head)
  const local = (v: Vector3) => v.applyQuaternion(q).add(origin)
  const mouth = head.getObjectByName('face-mouth')!
  save(mouth)
  mouth.visible = false
  const { restore: restoreSmile, ...facial } = naturalHisokaSmile(head, smile)
  const contours = head.getObjectByName('clash-face-contours')
  if (contours) {
    save(contours)
    contours.visible = false
  }
  const rise = smooth((age - 285) / 95)
  const cardY = -0.32 + rise * 0.25 - smile * 0.09
  const cardCentre = local(new Vector3(0.025 + smile * 0.09, cardY, 0.285))
  props.card.position.copy(cardCentre)
  props.card.quaternion.copy(q)
  props.card.rotateZ(-0.16 + Math.sin((age - 270) / 32) * 0.15 * (1 - rise))
  props.card.rotateY((1 - rise) * Math.PI * 2)
  scene.add(props.card)
  props.card.updateMatrixWorld(true)
  const wristTarget = local(new Vector3(0.092 + smile * 0.09, cardY - 0.055, 0.265))
  const handError = reach(root, wristTarget, local(new Vector3(0.48, -0.43, 0.25)))
  const distance = 1.8 - smooth((age - 270) / 330) * 0.65
  const target = local(new Vector3(-0.015, -0.025, 0.08))
  camera.position.copy(local(new Vector3(-0.015, 0.01, distance)))
  camera.up.set(0, 1, 0).applyQuaternion(q)
  camera.lookAt(target)
  camera.updateMatrixWorld(true)
  const front = new Vector3(0, 0, 1).applyQuaternion(q)
  const facePixels = (0.32 / (2 * distance * Math.tan((camera.fov * Math.PI) / 360))) * 864
  return {
    audit: {
      ...facial,
      neutralHeadPose: true,
      handError,
      facePixels,
      frontalAlignment: front.dot(camera.position.clone().sub(origin).normalize()),
      cardRise: rise,
      smile,
    },
    restore: () => {
      restoreSmile()
      scene.remove(props.card)
      restores.reverse().forEach((restore) => restore())
      root.updateWorldMatrix(true, true)
    },
  }
}

function makeProps() {
  return { card: createVictoryCard() }
}

export function captureHisokaVictory(
  read: () => { state: FightState; age: number; camera: CinematicFrame },
) {
  const props = makeProps()
  let renders = 0
  let restore: (() => void) | undefined
  let audit: Record<string, unknown> = {}
  Scene.prototype.onBeforeRender = function (_renderer, scene, camera) {
    if (!(camera instanceof PerspectiveCamera) || !scene.getObjectByName('fight-collision-boxes'))
      return
    restore?.()
    const frame = read()
    const resetCamera = applyCinematicFrame(camera, frame.camera)
    const up = camera.up.clone()
    const resetTether =
      frame.age >= 0 && frame.age < 270 ? presentVictoryTether(scene, frame.state) : undefined
    let resetPose: (() => void) | undefined
    if (frame.age >= 270) {
      const pose = portrait(scene, camera, { age: frame.age, props })
      resetPose = pose.restore
      audit = pose.audit
    } else if (frame.age >= 65 && frame.age < 120) {
      const head = scene.getObjectByName('manga-head:hisoka')!
      const root = scene.children.find((node) => node.getObjectByName(head.name) === head)!
      const hand = root.getObjectByName('hand-right')!
      const centre = point(hand)
      camera.position.copy(centre).add(new Vector3(0.3, 0.18, 1.3))
      camera.lookAt(centre)
      camera.updateMatrixWorld(true)
    }
    restore = () => {
      resetPose?.()
      resetTether?.()
      camera.up.copy(up)
      resetCamera()
    }
  }
  Scene.prototype.onAfterRender = function (_renderer, scene) {
    if (!scene.getObjectByName('fight-collision-boxes')) return
    restore?.()
    restore = undefined
    renders++
  }
  return { ready: () => renders > 3, audit: () => audit }
}
