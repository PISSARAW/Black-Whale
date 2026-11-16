import { Box3, Mesh, Vector3 } from 'three'
import type { Object3D, Scene } from 'three'
import type { CatShot } from './catsSpectacle'
import { gripWithPaws } from './catsGripRig'

function transforms(root: Object3D) {
  const nodes: Object3D[] = []
  root.traverse((node) => nodes.push(node))
  return nodes.map((node) => ({
    node,
    position: node.position.clone(),
    rotation: node.quaternion.clone(),
    scale: node.scale.clone(),
  }))
}
type Pose = ReturnType<typeof transforms>
const heldPoses = new WeakMap<Object3D, Pose>()
let audit: Record<string, unknown> = {}
export const catsGripAudit = () => audit
const ease = (n: number) => {
  const t = Math.max(0, Math.min(1, n))
  return t * t * (3 - 2 * t)
}
function apply(pose: Pose) {
  pose.forEach(({ node, position, rotation, scale }) => {
    node.position.copy(position)
    node.quaternion.copy(rotation)
    node.scale.copy(scale)
  })
}

/** Cinematic staging only: the native death at 48 and consumption at 84 remain untouched. */
export function presentCatsCrush(scene: Scene, shot: CatShot | undefined) {
  if (!shot || shot.progress < 24) return () => {}
  const body = scene.children.find((node) => node.getObjectByName('chrollo-open-book'))!
  if (!body) return () => {}
  if (shot.progress >= 84) {
    const visible = body.visible
    body.visible = false
    return () => {
      body.visible = visible
    }
  }
  if (!body.visible) return () => {}
  const original = transforms(body)
  const held = heldPoses.get(body) ?? original
  heldPoses.set(body, held)
  apply(held)
  const book = body.getObjectByName('chrollo-open-book')
  if (book) book.visible = false
  const f = shot.progress
  const compression = ease((f - 46) / 18)
  const absorption = ease((f - 72) / 12)
  body.scale
    .multiply(new Vector3(1 - compression * 0.72, 1 - compression * 0.3, 1 - compression * 0.45))
    .multiplyScalar(1 - absorption * 0.96)
  body.position.set(shot.camera.x, 0, 0)
  body.updateWorldMatrix(true, true)
  const torso = body.getObjectByName('torso')!
  const centre = new Box3().setFromObject(torso).getCenter(new Vector3())
  const destination = new Vector3(shot.camera.x, 1.14, 0.72)
  body.position.add(destination.sub(centre).multiplyScalar(ease((f - 24) / 12)))
  body.updateWorldMatrix(true, true)
  const bounds = new Box3().setFromObject(torso)
  const paws = gripWithPaws(scene, {
    body: bounds,
    x: shot.camera.x,
    approach: ease((f - 24) / 12),
  })
  const energy = scene.getObjectByName('cats-name-life-energy')!
  const line = scene.children.find(
    (node) =>
      node.type === 'Line' &&
      'material' in node &&
      (node as Mesh).material &&
      (node as Mesh<never, import('three').LineBasicMaterial>).material.color?.getHexString() ===
        'ffe694',
  )
  const energyVisible = energy.visible,
    energyAt = energy.position.clone(),
    lineVisible = line?.visible
  if (f < 72) {
    energy.visible = false
    if (line) line.visible = false
  } else energy.position.lerpVectors(new Vector3(shot.camera.x, 1.14, 0.82), energyAt, absorption)
  audit = {
    phase: f < 46 ? 'grip' : f < 72 ? 'crush' : 'absorb',
    frame: f,
    compression,
    absorption,
    bodyWidth: bounds.max.x - bounds.min.x,
    paws: paws.contacts,
    bothPawsTouching: paws.contacts.every((p) => Math.abs(p.inner - p.bodyEdge) < 0.04),
    energyVisible: energy.visible,
  }
  return () => {
    paws.restore()
    energy.visible = energyVisible
    energy.position.copy(energyAt)
    if (line) line.visible = lineVisible!
    apply(original)
    body.updateWorldMatrix(true, true)
  }
}
