import type { HumanClothesBuild } from './humanClothes'
import { mangaBodyShape, mangaClothesKey, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addMangaSuit(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, frame, materials } = build
  const { chest } = mangaBodyShape(build.profile)
  mangaPanel(build, {
    name: 'manga-shirt',
    points: [
      [-0.05, 1.492],
      [-0.064, 1.39],
      [0, 1.22],
      [0.064, 1.39],
      [0.05, 1.492],
    ],
    material: materials.shirt,
  })
  for (const side of [-1, 1]) {
    mangaPanel(build, {
      name: `manga-collar-${side}`,
      points: [
        [side * 0.052, 1.494],
        [side * 0.004, 1.45],
        [side * 0.027, 1.365],
        [side * 0.076, 1.4],
      ],
      material: materials.shirt,
      lift: 0.008,
    })
    mangaPanel(build, {
      name: `manga-lapel-${side}`,
      points: [
        [side * 0.066, 1.48],
        [side * 0.155, 1.375],
        [side * 0.106, 1.325],
        [side * 0.12, 1.3],
        [0, 1.15],
        [side * 0.048, 1.375],
      ],
      material: materials.cloth,
      lift: 0.01,
    })
  }
  mangaPanel(build, {
    name: 'manga-tie-knot',
    points: [
      [0, 1.45],
      [-0.014, 1.427],
      [0, 1.408],
      [0.014, 1.427],
    ],
    material: materials.accent,
    lift: 0.014,
  })
  mangaPanel(build, {
    name: 'manga-tie',
    points: [
      [0, 1.41],
      [-0.018, 1.28],
      [0, 1.235],
      [0.018, 1.28],
    ],
    material: materials.accent,
    lift: 0.014,
  })
  const seams = new THREE.Mesh(
    geometry(THREE, `manga:suit-seams:${mangaClothesKey(build.profile)}`, () =>
      mergeHumanDetails([
        new THREE.BoxGeometry(0.055, 0.004, 0.004).translate(
          -chest * 0.43,
          0.2 * frame.neck,
          0.104,
        ),
        new THREE.BoxGeometry(0.062, 0.004, 0.004).translate(
          chest * 0.4,
          -0.16 * frame.neck,
          0.079,
        ),
        new THREE.BoxGeometry(0.062, 0.004, 0.004).translate(
          -chest * 0.4,
          -0.16 * frame.neck,
          0.079,
        ),
        new THREE.SphereGeometry(0.006, 8, 6).scale(1, 1, 0.4).translate(0.012, -0.025, 0.1),
      ]),
    ),
    materials.dark,
  )
  seams.name = 'garment-seams'
  seams.position.y = 1.12 * frame.neck
  figure.add(seams)
}

export function addMangaUniform(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, frame, materials, profile } = build
  const { chest, depth } = mangaBodyShape(profile)
  const details = new THREE.Mesh(
    geometry(THREE, `manga:uniform:${mangaClothesKey(profile)}`, () => {
      const parts = []
      for (let i = 0; i < 5; i++)
        parts.push(
          new THREE.SphereGeometry(0.007, 8, 6)
            .scale(1, 1, 0.6)
            .translate(0.008, (0.22 - i * 0.09) * frame.neck, depth * 0.88),
        )
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.BoxGeometry(chest * 0.62, 0.018, 0.065).translate(
            side * chest * 0.78,
            0.27 * frame.neck,
            0,
          ),
        )
        parts.push(
          new THREE.BoxGeometry(0.07, 0.008, 0.012).translate(
            side * chest * 0.46,
            0.11 * frame.neck,
            depth * 0.85,
          ),
        )
      }
      return mergeHumanDetails(parts)
    }),
    materials.accent,
  )
  details.name = 'manga-uniform-insignia'
  details.position.y = 1.12 * frame.neck
  figure.add(details)
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:uniform-collar',
      () => new THREE.CylinderGeometry(0.065, 0.076, 0.067, 20, 1, true),
    ),
    materials.cloth,
  )
  collar.position.y = 1.457 * frame.neck
  figure.add(collar)
}
