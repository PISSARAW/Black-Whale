import { Mesh, type Group, type Material, type Object3D } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const JOINTS = new Set([
  'camilla-skirt',
  'corona',
  'mouths',
  'segments',
  'wings',
  'little-eye-legs',
  'fringe',
])

function bakeMarkedGroups(parent: Object3D): void {
  for (const child of [...parent.children]) {
    if (!child.userData.bakeStatic) continue
    child.updateMatrix()
    for (const part of [...child.children]) {
      part.applyMatrix4(child.matrix)
      parent.add(part)
    }
    parent.remove(child)
  }
}
function isStaticMesh(part: Object3D): part is Mesh<import('three').BufferGeometry, Material> {
  const mesh = part as Mesh
  return (
    mesh.isMesh &&
    mesh.children.length === 0 &&
    !Array.isArray(mesh.material) &&
    !mesh.geometry.userData.sharedHuman
  )
}
function batchesOf(parent: Object3D): Map<Material, Mesh[]> {
  const byMaterial = new Map<Material, Mesh[]>()
  for (const mesh of parent.children.filter(isStaticMesh)) {
    const held = byMaterial.get(mesh.material) ?? []
    held.push(mesh)
    byMaterial.set(mesh.material, held)
  }
  return byMaterial
}
function mergeBatch(parent: Object3D, material: Material, meshes: Mesh[]): void {
  if (meshes.length < 2) return
  const geometries = meshes.map((mesh) => {
    mesh.updateMatrix()
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
    return geometry.applyMatrix4(mesh.matrix)
  })
  const merged = mergeGeometries(geometries)
  for (const geometry of geometries) geometry.dispose()
  if (!merged) return
  const batch = new Mesh(merged, material)
  batch.name = 'nen-static-anatomy'
  batch.userData.parts = meshes.map((mesh) => mesh.name)
  const owned = new Set(meshes.map((mesh) => mesh.geometry))
  for (const mesh of meshes) parent.remove(mesh)
  for (const geometry of owned) geometry.dispose()
  parent.add(batch)
}
/** Static anatomy shares draw calls. Named animation joints keep their children. */
export function batchNenModel(root: Group): void {
  function visit(parent: Object3D) {
    if (JOINTS.has(parent.name)) {
      for (const child of parent.children) if (!(child as Mesh).isMesh) visit(child)
      return
    }
    bakeMarkedGroups(parent)
    for (const child of [...parent.children]) if (!(child as Mesh).isMesh) visit(child)
    for (const [material, meshes] of batchesOf(parent)) mergeBatch(parent, material, meshes)
  }
  visit(root)
}
