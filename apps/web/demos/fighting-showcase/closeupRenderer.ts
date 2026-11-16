import { PerspectiveCamera, Quaternion, Vector3, Vector4 } from 'three'
import type { Object3D, Scene, WebGLRenderer } from 'three'
import type { CloseupFrame } from './closeupTrack'

export const DETAIL_RECT = { x: 1210, y: 220, width: 650, height: 380 }
const camera = new PerspectiveCamera(28, DETAIL_RECT.width / DETAIL_RECT.height, 0.02, 100)
const target = new Vector3()
const position = new Vector3()
const rotation = new Quaternion()

function actorRoots(scene: Scene) {
  return scene.children.filter((node) => node.getObjectByName('hand-right'))
}

function aim(scene: Scene, frame: CloseupFrame): Object3D[] {
  const roots = actorRoots(scene)
  const actor = roots.find((root) => root.getObjectByName('kurapika-head'))
  if (!actor) throw new Error('Kurapika rig missing from detail camera')
  if (frame.kind === 'eyes') {
    const head = actor.getObjectByName('kurapika-head')!
    head.getWorldPosition(target)
    head.getWorldQuaternion(rotation)
    position.set(0.055, 0.012, 0.86).applyQuaternion(rotation).add(target)
    target.add(new Vector3(0, -0.015, 0.085).applyQuaternion(rotation))
    camera.position.copy(position)
    camera.lookAt(target)
    return [
      ...roots.filter((root) => root !== actor),
      ...scene.children.filter((node) => node.name === 'benjamin-secret-window'),
    ]
  }
  const chains = scene.getObjectByName('kurapika-chains:player')
  const tip = chains?.getObjectByName(
    frame.kind === 'seal' ? 'kurapika-judgment-seal' : `kurapika-chain-tip:${frame.tip}`,
  )
  if (!tip?.visible) throw new Error(`Chain tip missing: ${frame.tip ?? frame.kind}`)
  tip.getWorldPosition(target)
  if (frame.kind === 'chain') {
    const hand = actor.getObjectByName('hand-right')
    hand?.getWorldPosition(position)
    // The tip dominates the detail shot; the incoming strand stays in view.
    if (hand) target.lerp(position, 0.14)
  }
  camera.position.copy(target).add(new Vector3(0.13, 0.12, frame.kind === 'seal' ? 1.25 : 1.45))
  camera.lookAt(target)
  // Isolate the implanted point in the detail panel when the attacking body overlaps it.
  return frame.kind === 'seal' || frame.tip === 'syringe' || frame.tip === 'blade' ? [actor] : []
}

/** Render into the existing postprocessing target, scissored to the detail panel. */
export function drawCloseup(renderer: WebGLRenderer, scene: Scene, frame: CloseupFrame) {
  const hidden = aim(scene, frame)
  const oldVisibility = hidden.map((node) => node.visible)
  hidden.forEach((node) => {
    node.visible = false
  })
  const viewport = renderer.getViewport(new Vector4())
  const scissor = renderer.getScissor(new Vector4())
  const scissorTest = renderer.getScissorTest()
  const autoClear = renderer.autoClear
  const rect = DETAIL_RECT
  const x = (rect.x / 1920) * viewport.z
  const y = ((858 - rect.y - rect.height) / 858) * viewport.w
  renderer.setViewport(x, y, (rect.width / 1920) * viewport.z, (rect.height / 858) * viewport.w)
  renderer.setScissor(x, y, (rect.width / 1920) * viewport.z, (rect.height / 858) * viewport.w)
  renderer.setScissorTest(true)
  renderer.autoClear = true
  try {
    camera.updateMatrixWorld(true)
    renderer.render(scene, camera)
  } finally {
    renderer.autoClear = autoClear
    renderer.setViewport(viewport)
    renderer.setScissor(scissor)
    renderer.setScissorTest(scissorTest)
    hidden.forEach((node, index) => {
      node.visible = oldVisibility[index]
    })
  }
}
