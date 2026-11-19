import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
} from 'three'
import type { Object3D } from 'three'
import type { LastContactFace } from './lastContactEmotions'

interface FaceRig {
  head: Object3D
  original: Object3D
  mouth: Mesh<BufferGeometry>
  teeth: Mesh<BufferGeometry>
}
const RIGS = new WeakMap<Object3D, FaceRig>()
function surface(colour: string) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(33 * 2 * 3), 3))
  const indices: number[] = []
  for (let i = 0; i < 32; i++)
    indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  geometry.setIndex(indices)
  return new Mesh(geometry, new MeshBasicMaterial({ color: colour, side: DoubleSide }))
}
function rigFor(root: Object3D): FaceRig | undefined {
  const cached = RIGS.get(root)
  if (cached) return cached
  const original = root.getObjectByName('face-mouth')
  if (!original?.parent) return
  const layer = new Group()
  layer.name = 'last-contact-expression'
  layer.position.copy(original.position)
  layer.position.z += 0.002
  const mouth = surface('#26161d'),
    teeth = surface('#eee5d8')
  teeth.position.z = 0.0008
  layer.add(mouth, teeth)
  original.parent.add(layer)
  const rig = { original, head: original.parent, mouth, teeth }
  RIGS.set(root, rig)
  return rig
}
function drawMouth(mesh: Mesh<BufferGeometry>, pose: LastContactFace, teeth: boolean) {
  const points = mesh.geometry.getAttribute('position')
  for (let i = 0; i <= 32; i++) {
    const t = i / 32,
      edge = 2 * t - 1,
      curve = pose.curve * edge * edge + pose.asymmetry * (t - 0.5)
    const radius = Math.sin(t * Math.PI)
    const top = curve + pose.open * radius * 0.5
    const bottom = curve - pose.open * radius * 0.5 - 0.0013 * radius
    const upper = teeth ? top - 0.001 * radius : top
    const lower = teeth ? top - (top - bottom) * pose.teeth : bottom
    const x = (t - 0.5) * pose.width * (teeth ? 0.96 : 1)
    points.setXYZ(i * 2, x, upper, 0)
    points.setXYZ(i * 2 + 1, x, lower, 0)
  }
  points.needsUpdate = true
  mesh.geometry.computeBoundingSphere()
  mesh.visible = !teeth || (pose.teeth > 0.12 && pose.open > 0.004)
}

/** Pose existing brows, eyes and pupils; add a deformable mouth on the existing face. */
export function presentLastContactFace(root: Object3D, pose: LastContactFace) {
  const rig = rigFor(root)
  if (!rig) return () => {}
  const restores: Array<() => void> = []
  const visible = rig.original.visible
  rig.original.visible = false
  restores.push(() => {
    rig.original.visible = visible
  })
  drawMouth(rig.mouth, pose, false)
  drawMouth(rig.teeth, pose, true)
  for (const side of [-1, 1]) {
    const eye = rig.head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')
    const brow = rig.head.getObjectByName(side < 0 ? 'face-brow-left' : 'face-brow-right')
    if (eye) {
      const scale = eye.scale.clone(),
        rotation = eye.rotation.z
      eye.scale.y *= pose.eye
      eye.rotation.z = side * pose.brow * 0.35
      restores.push(() => {
        eye.scale.copy(scale)
        eye.rotation.z = rotation
      })
      const pupil = eye.getObjectByName('eye-pupil')
      if (pupil) {
        const scale = pupil.scale.clone()
        pupil.scale.multiplyScalar(pose.pupil)
        restores.push(() => pupil.scale.copy(scale))
      }
    }
    if (brow) {
      const y = brow.position.y,
        rotation = brow.rotation.z
      brow.position.y += pose.lift
      brow.rotation.z = side * pose.brow
      restores.push(() => {
        brow.position.y = y
        brow.rotation.z = rotation
      })
    }
  }
  return () => restores.forEach((restore) => restore())
}
