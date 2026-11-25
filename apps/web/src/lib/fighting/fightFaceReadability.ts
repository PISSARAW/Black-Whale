import {
  Box3,
  Vector3,
  type BufferGeometry,
  type Material,
  type Mesh,
  type MeshBasicMaterial,
  type Object3D,
} from 'three'
import type { HumanFigure } from '$lib/tour/humanFigure'
import type { HumanProfile } from '$lib/tour/humanProfiles'
import { humanGeometryVariant } from '$lib/tour/humanGeometryVariant'

const materials = new WeakMap<Material, MeshBasicMaterial>()

/** Bake the face relief once. No lights, shadow maps, extra meshes or render passes. */
export function combatFaceGeometry(source: BufferGeometry): BufferGeometry {
  return humanGeometryVariant(source, 'clash:face-readability', (canonical) => {
    const geometry = canonical.clone()
    const normal = geometry.getAttribute('normal')
    const position = geometry.getAttribute('position')
    if (!normal || !position) return canonical
    // Reuse the existing attribute's constructor without adding a Three runtime import.
    const color = position.clone()
    for (let i = 0; i < normal.count; i++) {
      const light = normal.getX(i) * -0.25 + normal.getY(i) * 0.55 + normal.getZ(i) * 0.6
      const value = light > 0.42 ? 1 : light > -0.15 ? 0.83 : 0.64
      color.setXYZ(i, value, value * (value < 1 ? 0.97 : 1), value * (value < 1 ? 0.95 : 1))
    }
    geometry.setAttribute('color', color)
    return geometry
  })
}

function faceMaterial(source: MeshBasicMaterial): MeshBasicMaterial {
  const cached = materials.get(source)
  if (cached) return cached
  const material = source.clone()
  material.vertexColors = true
  materials.set(source, material)
  return material
}

function shadeSkin(node: Object3D, skin: number) {
  const mesh = node as Mesh<BufferGeometry, MeshBasicMaterial>
  if (!mesh.isMesh || Array.isArray(mesh.material)) return
  if (!mesh.material.isMeshBasicMaterial || mesh.material.color.getHex() !== skin) return
  if (mesh.geometry.userData.authoredHeadTones && mesh.material.vertexColors) return
  // Backface outlines must retain their ink and their original material.
  mesh.geometry = combatFaceGeometry(mesh.geometry)
  mesh.material = faceMaterial(mesh.material)
}

function faceChinInParentY(head: Object3D): number {
  const parent = head.parent
  if (!parent) return head.position.y - head.scale.y * 0.18
  const face = head.getObjectByName('manga-face') ?? head.getObjectByName('kurapika-face')
  if (!face) {
    const fallback = head.localToWorld(new Vector3(0, -0.18, 0))
    return parent.worldToLocal(fallback).y
  }
  head.updateWorldMatrix(true, true)
  const bounds = new Box3().setFromObject(face)
  const chin = bounds.getCenter(new Vector3())
  chin.y = bounds.min.y
  return parent.worldToLocal(chin).y
}

/** The combat model keeps its canonical features; broad shapes carry identity at game distance. */
export function improveFightFace(model: HumanFigure, profile: HumanProfile) {
  const eye = model.root.getObjectByName('face-eye-left')
  const head = eye?.parent
  if (!head || head.userData.combatFace) return
  head.userData.combatFace = true
  const gain = profile.frame === 'child' ? 1.06 : 1.12
  const chinBefore = faceChinInParentY(head)
  // Readability is a screen-plane adjustment. Inflating depth pulled hair and
  // facial hair away from the skull at Clash's three-quarter camera angle.
  head.scale.x *= gain
  head.scale.y *= gain
  // Anchor the authored face's actual chin rather than assuming every model
  // ends at -0.18; this keeps necks, collars and long beards visually joined.
  head.position.y += chinBefore - faceChinInParentY(head)
  head.traverse((node) => {
    shadeSkin(node, profile.skin)
    if (profile.likeness === 'kurapika' && node.name.startsWith('face-eye-')) {
      node.scale.y *= 0.76
      node.scale.x *= 1.06
    }
    if (node.name.startsWith('face-brow-')) node.scale.y *= 1.18
    if (node.name === 'signature-star' || node.name === 'signature-tear')
      node.scale.multiplyScalar(1.12)
  })
}
