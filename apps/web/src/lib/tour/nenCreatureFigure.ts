import type { Group, Material, Mesh, MeshBasicMaterial, Object3D } from 'three'
import type { ApparitionKind } from './apparitions'

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

function outlinedMesh(THREE: Three, source: Mesh): Mesh | null {
  if (!source.geometry || Array.isArray(source.material)) return null
  const material = source.material as Material
  // Fumes, glows and portal-like washes need soft edges. Outlining only the
  // substantial surfaces keeps the figure legible without drawing black fog.
  if (material.transparent && material.opacity < 0.45) return null
  const edge = new THREE.Mesh(source.geometry, outlineMaterial(THREE, material))
  edge.name = 'nen-creature-ink'
  edge.scale.setScalar(1.055)
  edge.renderOrder = Math.max(0, source.renderOrder - 1)
  return edge
}

/** Applies the shared human model's ink-and-ground language to a Nen beast. */
export function styleNenCreature(
  THREE: Three,
  root: Group,
  kind: ApparitionKind,
  size: number,
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
    const edge = outlinedMesh(THREE, mesh)
    if (edge) mesh.add(edge)
  }

  // A faint ink wash anchors hovering and oddly proportioned bodies in the
  // room. It is deliberately not a light: Nen keeps its colour and the ship
  // keeps control of illumination.
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(Math.max(0.08, size * 0.9), 20),
    new THREE.MeshBasicMaterial({
      color: 0x171318,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  )
  ground.name = 'nen-creature-ground'
  ground.rotation.x = -Math.PI / 2
  ground.scale.y = 0.55
  ground.position.y = -Math.max(0.01, size * 0.04)
  root.add(ground)
}
