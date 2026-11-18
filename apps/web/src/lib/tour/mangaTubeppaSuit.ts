import type { BufferGeometry } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import { addMangaSuit } from './mangaTailoring'
import { mangaChestSurface, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

/** Pale piping on the departure-party suit follows the actual curved jacket. */
function piping(build: HumanClothesBuild, path: readonly (readonly [number, number])[]) {
  const { THREE, profile, frame } = build
  const points = path.map(([x, y]) => {
    const px = x * profile.shoulders * frame.width
    const py = y * frame.neck
    return new THREE.Vector3(px, py - 1.12 * frame.neck, mangaChestSurface(profile, px, py) + 0.024)
  })
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.05),
    48,
    0.0032,
    5,
    false,
  )
}

function suitPiping(build: HumanClothesBuild): BufferGeometry {
  const parts: BufferGeometry[] = []
  for (const side of [-1, 1]) {
    parts.push(
      piping(build, [
        [side * 0.066, 1.48],
        [side * 0.155, 1.375],
        [side * 0.106, 1.325],
        [side * 0.12, 1.3],
        [0, 1.15],
      ]),
    )
    parts.push(
      piping(build, [
        [side * 0.15, 0.79],
        [side * 0.118, 0.759],
        [side * 0.072, 0.78],
        [0, 0.846],
      ]),
    )
    parts.push(
      piping(build, [
        [side * 0.087, 1.055],
        [side * 0.133, 1.042],
      ]),
    )
  }
  return mergeHumanDetails(parts)
}

export function addTubeppaSuit(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  addMangaSuit(build)
  for (const name of ['manga-tie', 'manga-tie-knot']) {
    const part = figure.getObjectByName(name) as import('three').Mesh
    part.material = materials.dark
  }
  const trim = new THREE.Mesh(
    geometry(THREE, 'manga:tubeppa-suit-piping', () => suitPiping(build)),
    materials.shirt,
  )
  trim.name = 'tubeppa-suit-piping'
  trim.position.y = 1.12 * build.frame.neck
  figure.add(trim)
  const buttons = new THREE.Mesh(
    geometry(THREE, 'manga:tubeppa-double-breasted-buttons', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1])
        for (const y of [1.115, 0.995, 0.875]) {
          const x = side * 0.065 * profile.shoulders
          parts.push(
            new THREE.SphereGeometry(0.008, 10, 8)
              .scale(1, 1, 0.45)
              .translate(x, y - 1.12, mangaChestSurface(profile, x, y) + 0.022),
          )
        }
      return mergeHumanDetails(parts)
    }),
    materials.shirt,
  )
  buttons.name = 'tubeppa-double-breasted-buttons'
  buttons.position.y = 1.12
  figure.add(buttons)
  mangaPanel(build, {
    name: 'tubeppa-tie-pin',
    points: [
      [-0.011, 1.306],
      [-0.011, 1.3],
      [0.011, 1.3],
      [0.011, 1.306],
    ],
    material: materials.shirt,
    lift: 0.019,
  })
}
