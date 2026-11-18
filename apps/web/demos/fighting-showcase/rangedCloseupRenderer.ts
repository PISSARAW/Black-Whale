import { PerspectiveCamera, Quaternion, Vector3, Vector4 } from 'three'
import type { Object3D, Scene, WebGLRenderer } from 'three'
import type { CloseupFrame } from './closeupTrack'
import { DETAIL_RECT } from './closeupRenderer'
import { presentRangedAura } from './rangedAuraPresentation'
import { fightWorldX } from '../../src/lib/fighting/fightCoordinates'

const camera = new PerspectiveCamera(30, DETAIL_RECT.width / DETAIL_RECT.height, 0.02, 100)
const audit = {
  renders: 0,
  faces: { player: 0, opponent: 0 },
  minimumFacePixels: Infinity,
  minimumFrontalAlignment: 1,
  punches: 0,
  barrages: 0,
}
export const rangedCloseupAudit = () => ({ ...audit, faces: { ...audit.faces } })

function headOf(actor: Object3D) {
  const head = actor.getObjectByName('face-eye-left')?.parent
  if (!head) throw new Error('Face rig missing from ranged closeup')
  return head
}

function aim(scene: Scene, frame: CloseupFrame) {
  const roots = scene.children.filter((node) => node.userData.fightSide)
  const actor = roots.find((node) => node.userData.fightSide === frame.side)
  if (!actor) throw new Error(`Missing closeup actor: ${frame.side}`)
  actor.updateWorldMatrix(true, true)
  const head = headOf(actor)
  const origin = head.getWorldPosition(new Vector3())
  const rotation = head.getWorldQuaternion(new Quaternion())
  const front = new Vector3(0, 0, 1).applyQuaternion(rotation)
  const target = origin.clone()
  let hidden: Object3D[]
  if (frame.kind === 'face') {
    target.add(new Vector3(0, -0.025, 0.08).applyQuaternion(rotation))
    camera.position.copy(origin).add(new Vector3(0.015, 0.025, 1.25).applyQuaternion(rotation))
    camera.up.set(0, 1, 0).applyQuaternion(rotation)
    hidden = scene.children.filter((node) => node !== actor)
    const pixels = (0.32 / (2 * 1.25 * Math.tan(Math.PI / 12))) * DETAIL_RECT.height
    audit.minimumFacePixels = Math.min(audit.minimumFacePixels, pixels)
    audit.minimumFrontalAlignment = Math.min(
      audit.minimumFrontalAlignment,
      front.dot(camera.position.clone().sub(origin).normalize()),
    )
    audit.faces[frame.side!]++
  } else {
    camera.up.set(0, 1, 0)
    if (frame.kind === 'barrage') {
      const hands = ['hand-left', 'hand-right'].map((n) => actor.getObjectByName(n)!)
      const hand = hands[0]
        .getWorldPosition(new Vector3())
        .lerp(hands[1].getWorldPosition(new Vector3()), 0.5)
      target.lerp(hand, 0.45)
      camera.position
        .copy(target)
        .addScaledVector(front, 3.5)
        .add(new Vector3(0, 0.25, 0.55))
      if (frame.tip === 'fingers') {
        target.copy(hand)
        camera.position
          .copy(hand)
          .addScaledVector(front, 1.35)
          .add(new Vector3(0.2, 0.16, 0.3))
      }
      audit.barrages++
    } else {
      target.set(fightWorldX(frame.targetX!), 0.9, 0.12)
      camera.position.copy(target).add(new Vector3(0.65, 0.35, 2.8))
      audit.punches++
    }
    hidden = roots.filter((node) => node !== actor)
  }
  camera.lookAt(target)
  camera.updateMatrixWorld(true)
  return hidden
}

/** A second live camera, with frontal portraits and native hands/projectiles. */
export function drawRangedCloseup(renderer: WebGLRenderer, scene: Scene, frame: CloseupFrame) {
  const hidden = aim(scene, frame)
  const visibility = hidden.map((node) => node.visible)
  const restoreAura = presentRangedAura(scene)
  const viewport = renderer.getViewport(new Vector4())
  const scissor = renderer.getScissor(new Vector4())
  const scissorTest = renderer.getScissorTest()
  const autoClear = renderer.autoClear
  const fog = scene.fog
  try {
    hidden.forEach((node) => (node.visible = false))
    scene.fog = null
    const rect = DETAIL_RECT
    const x = (rect.x / 1920) * viewport.z
    const y = ((858 - rect.y - rect.height) / 858) * viewport.w
    renderer.setViewport(x, y, (rect.width / 1920) * viewport.z, (rect.height / 858) * viewport.w)
    renderer.setScissor(x, y, (rect.width / 1920) * viewport.z, (rect.height / 858) * viewport.w)
    renderer.setScissorTest(true)
    renderer.autoClear = true
    renderer.render(scene, camera)
    audit.renders++
  } finally {
    restoreAura()
    scene.fog = fog
    renderer.autoClear = autoClear
    renderer.setViewport(viewport)
    renderer.setScissor(scissor)
    renderer.setScissorTest(scissorTest)
    hidden.forEach((node, i) => (node.visible = visibility[i]))
  }
}
