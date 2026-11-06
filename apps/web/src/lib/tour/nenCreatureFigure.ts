import type { Group, Material, Mesh, MeshBasicMaterial, Object3D } from 'three'
import type { ApparitionKind } from './apparitions'
import { contactShadow } from './contactShadow'

type Three = typeof import('three')

/**
 * The animal and monster silhouettes made by Nen.
 *
 * They keep their ability-specific anatomy, but share the manga treatment of
 * the human figure: a dark contour, a grounded silhouette and hard, readable
 * colour.  Keeping this list explicit prevents tools, cards and vapour from
 * acquiring a cartoon outline merely because they are apparitions too.
 */
export const NEN_CREATURE_KINDS = new Set<ApparitionKind>([
  'cookie',
  'hoover',
  'animal-object',
  'benjamin-guardian',
  'halkenburg-guardian',
  'nasubi-guardian',
  'tserriednich-second',
  'dolphin',
  'predator-salesale',
  'blood-snake',
  'nen-spider',

  'owl',
  'fish',
  'insect',
  'medusa',
  'chimera',
  'monster',
  'toad',
  'wheel',
  'tyson-guardian',
  'wog',
  'centipede',
  'mouths',
  'sprite',
  'dragon',
  'ghost',
  'cat',
])

export function isNenCreatureKind(kind: ApparitionKind): boolean {
  return NEN_CREATURE_KINDS.has(kind)
}

const outlineMaterials = new WeakMap<Material, MeshBasicMaterial>()

function outlineMaterial(THREE: Three, source: Material): MeshBasicMaterial {
  const held = outlineMaterials.get(source)
  if (held) return held
  const made = new THREE.MeshBasicMaterial({
    color: 0x171318,
    side: THREE.BackSide,
    transparent: source.transparent,
    opacity: source.transparent ? Math.min(0.72, source.opacity) : 0.94,
    depthWrite: source.depthWrite,
  })
  outlineMaterials.set(source, made)
  return made
}

function outlinedMesh(THREE: Three, source: Mesh, thickness: number): Mesh | null {
  if (!source.geometry || Array.isArray(source.material)) return null
  const material = source.material as Material
  // Fumes, glows and portal-like washes need soft edges. Outlining only the
  // substantial surfaces keeps the figure legible without drawing black fog.
  if (material.transparent && material.opacity < 0.45) return null
  // Scaling a merged mesh moves every feature away from the model origin:
  // a high eye acquires a thick displaced black cap. Extrude along surface
  // normals instead, with the same thin stroke on the face and the feet.
  const geometry = source.geometry.clone()
  if (!geometry.attributes.normal) geometry.computeVertexNormals()
  const positions = geometry.attributes.position,
    normals = geometry.attributes.normal
  const normal = new THREE.Vector3()
  for (let i = 0; i < positions.count; i++) {
    normal.fromBufferAttribute(normals, i).divide(source.scale).normalize()
    positions.setXYZ(
      i,
      positions.getX(i) + (normal.x * thickness) / source.scale.x,
      positions.getY(i) + (normal.y * thickness) / source.scale.y,
      positions.getZ(i) + (normal.z * thickness) / source.scale.z,
    )
  }
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  const edge = new THREE.Mesh(geometry, outlineMaterial(THREE, material))
  edge.name = 'nen-creature-ink'
  edge.renderOrder = Math.max(0, source.renderOrder - 1)
  return edge
}

/** Applies the shared human model's ink-and-ground language to a Nen beast. */
export function styleNenCreature(
  THREE: Three,
  root: Group,
  {
    kind,
    size,
    groundOffset = 0,
    shadow: drawShadow = true,
  }: { kind: ApparitionKind; size: number; groundOffset?: number; shadow?: boolean },
): void {
  if (!isNenCreatureKind(kind)) return

  // Snapshot first: adding children while traversing would make the traversal
  // visit its own outlines. Each contour remains attached to the anatomical
  // part it describes, so head turns and limb animation carry it naturally.
  const meshes: Mesh[] = []
  root.traverse((part: Object3D) => {
    const mesh = part as Mesh
    if (mesh.isMesh && mesh.name !== 'nen-creature-ink') meshes.push(mesh)
  })
  for (const mesh of meshes) {
    const edge = outlinedMesh(THREE, mesh, size * 0.009)
    if (edge) mesh.add(edge)
  }

  // A contact patch anchors hovering and oddly proportioned bodies in the room.
  // It is deliberately not a light: Nen keeps its colour and the ship keeps
  // control of illumination — and a patch that multiplies rather than paints
  // makes no claim about colour at all. See `$lib/tour/contactShadow`.
  //
  // Weaker than a person's: half of this list does not touch the floor, and a
  // creature that hovers wants to be told where it is without being told it is
  // standing there.
  if (!drawShadow) return
  const shadow = contactShadow(THREE, { radius: Math.max(0.08, size * 0.9), strength: 0.34 })
  shadow.position.y += groundOffset
  root.add(shadow)
}
