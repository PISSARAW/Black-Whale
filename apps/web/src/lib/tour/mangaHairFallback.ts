import type { BufferGeometry, Mesh, Material } from 'three'
import type { MangaHairKit } from './mangaHair'
import type { HumanHeadBuild } from './humanHead'
import { addHumanHair } from './humanHair'

/** Retain the catalogue styles when no manga-specific coiffure overrides them. */
export function legacyMangaHairExtras(kit: MangaHairKit, build: HumanHeadBuild): void {
  const group = new kit.THREE.Group()
  const geometryCache = new Map<string, BufferGeometry>()
  const placeholder = new kit.THREE.MeshBasicMaterial()
  addHumanHair({
    THREE: kit.THREE,
    style: build.profile.hairStyle,
    head: { group, hairInk: placeholder, ink: placeholder },
    geometry: (_THREE, key, make) => {
      let shape = geometryCache.get(key)
      if (!shape) {
        shape = make()
        geometryCache.set(key, shape)
      }
      return shape
    },
    outlined: ({ geometry }) => {
      const shell = new kit.THREE.Group()
      shell.add(new kit.THREE.Mesh(geometry, placeholder))
      return shell
    },
  })
  group.updateMatrixWorld(true)
  const materials = new Set<Material>([placeholder])
  group.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return
    for (const material of [mesh.material].flat()) materials.add(material)
    if (mesh.name !== 'hair-flow-lines')
      kit.parts.push(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld))
  })
  geometryCache.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
}
