import { freezeCamillaPortrait } from './camillaStillPose'
import { softenCamillaPortrait } from './camillaPortraitLight'
import { Quaternion, Vector3 } from 'three'
import type { PerspectiveCamera, Scene } from 'three'
import type { CatShot } from './catsSpectacle'

const still = new URLSearchParams(window.location.search).has('still')
let audit: Record<string, unknown> = {}
export const camillaFaceAudit = () => audit

/** Track the face's own front and up vectors, including while the body rises. */
export function presentCamillaFace(
  scene: Scene,
  camera: PerspectiveCamera,
  shot: CatShot | undefined,
) {
  if (!shot || shot.progress < 112) return () => {}
  const head = scene.getObjectByName('manga-head:prince-camilla')
  if (!head) throw new Error('Camilla face rig missing')
  const portraitRoot = scene.children.find((node) => node.getObjectByName(head.name) === head)!
  const restorePose = still ? freezeCamillaPortrait(portraitRoot) : () => {}
  head.updateWorldMatrix(true, true)
  const background = scene.children.filter(
    (node) =>
      node !== portraitRoot && node.type !== 'AmbientLight' && node.type !== 'DirectionalLight',
  )
  const backgroundVisibility = background.map((node) => node.visible)
  background.forEach((node) => {
    node.visible = false
  })
  const lighting = softenCamillaPortrait(portraitRoot, head)
  const origin = head.getWorldPosition(new Vector3())
  const rotation = head.getWorldQuaternion(new Quaternion())
  const front = new Vector3(0, 0, 1).applyQuaternion(rotation)
  const up = camera.up.clone()
  const target = origin.clone().add(new Vector3(0, -0.025, 0.07).applyQuaternion(rotation))
  camera.position.copy(origin).add(new Vector3(0.025, 0.015, 0.92).applyQuaternion(rotation))
  camera.up.set(0, 1, 0).applyQuaternion(rotation)
  camera.lookAt(target)
  camera.updateMatrixWorld(true)
  const alive = shot.progress >= 120
  const age = shot.revivalAge ?? 0
  const opening = Math.max(0, Math.min(1, (age - 12) / 4))
  const openness = alive ? 0.045 + opening * 0.955 : 0.045
  const eyes = ['face-eye-left', 'face-eye-right'].map((name) => head.getObjectByName(name)!)
  const scales = eyes.map((eye) => eye.scale.clone())
  eyes.forEach((eye) => {
    eye.scale.y *= openness
    eye.updateWorldMatrix(true, true)
  })
  const faceSize = (0.3 / (2 * 0.92 * Math.tan((34 * Math.PI) / 360))) * 858
  audit = {
    head: head.name,
    frontalAlignment: front.dot(camera.position.clone().sub(origin).normalize()),
    eyesOpen: openness,
    alive,
    faceWidthPixels: faceSize,
    progress: shot.progress,
    auraMultiplier: lighting.auraMultiplier,
    suppressedFaceAuraMeshes: lighting.suppressedFaceMeshes,
    openingStartsAtFrame: 12,
    bodyFrozen: still,
    headMatrix: head.matrixWorld.elements.slice(),
    cameraPosition: camera.position.toArray(),
    cameraRotation: camera.quaternion.toArray(),
  }
  return () => {
    lighting.restore()
    background.forEach((node, i) => {
      node.visible = backgroundVisibility[i]
    })
    camera.up.copy(up)
    eyes.forEach((eye, i) => {
      eye.scale.copy(scales[i])
      eye.updateWorldMatrix(true, true)
    })
    restorePose()
  }
}
