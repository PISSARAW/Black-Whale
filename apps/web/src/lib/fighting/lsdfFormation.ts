import { Group, InstancedMesh, Matrix4, Mesh } from 'three'
import type { MeshBasicMaterial } from 'three'
import { mergeHumanDetails } from '$lib/tour/humanDetailGeometry'
import { buildLsdfGuard } from '$lib/tour/apparitionLsdfView'

type Context = Pick<Parameters<typeof buildLsdfGuard>[0], 'THREE' | 'glow'>

/** Seven complete, identical guards; four material draws instead of hundreds of parts. */
export function buildFightLsdfFormation(context: Context, level: number) {
  const root = new Group()
  root.name = 'fighting-lsdf-guards'
  const template = buildLsdfGuard(
    { ...context, root, skin: context.glow(0xe8e5da, 1) },
    { level, scale: 0.55, at: [0, 0, 0] },
  )
  template.updateMatrixWorld(true)
  const parts = new Map<MeshBasicMaterial, Mesh[]>()
  template.traverse((node) => {
    if (!(node instanceof Mesh)) return
    const material = node.material as MeshBasicMaterial
    const held = parts.get(material) ?? []
    held.push(node)
    parts.set(material, held)
  })
  for (const [material, meshes] of parts) {
    const geometry = mergeHumanDetails(
      meshes.map((mesh) => mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)),
    )
    const batch = new InstancedMesh(geometry, material, 7)
    batch.name = `lsdf-formation-${material.color.getHexString()}`
    for (let index = 0; index < 7; index++) {
      const row = Math.floor((index + 1) / 2)
      const x = index === 0 ? 0 : (index % 2 ? -1 : 1) * 0.55
      batch.setMatrixAt(index, new Matrix4().makeTranslation(x, 0, -row * 0.55))
    }
    root.add(batch)
  }
  template.traverse((node) => {
    if (node instanceof Mesh) node.geometry.dispose()
  })
  return root
}
