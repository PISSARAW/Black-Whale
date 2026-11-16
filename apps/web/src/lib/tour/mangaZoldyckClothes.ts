import type { HumanClothesBuild } from './humanClothes'
import { mangaPanel, mangaChestSurface } from './mangaBody'
import { kurapikaSurfacePanel } from './kurapikaGeometry'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addIllumiTravelClothes(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  mangaPanel(build, {
    name: 'illumi-open-neckline',
    points: [
      [-0.067, 1.47],
      [0, 1.32],
      [0.067, 1.47],
    ],
    material: materials.skin ?? materials.shirt,
  })
  const folds = new THREE.Mesh(
    geometry(THREE, 'manga:illumi-wrapped-shirt-folds', () => {
      const parts = []
      for (let i = 0; i < 7; i++) {
        const y = 1.34 - i * 0.068
        const slope = i % 2 ? -0.026 : 0.026
        parts.push(
          kurapikaSurfacePanel(THREE, {
            points: [
              [-0.13, y + slope, 0],
              [0.13, y - slope, 0],
              [0.13, y - slope - 0.003, 0],
              [-0.13, y + slope - 0.003, 0],
            ],
            depth: (x, sy) => mangaChestSurface(profile, x, sy) + 0.008,
          }),
        )
      }
      return mergeHumanDetails(parts).translate(0, -1.12, 0)
    }),
    materials.accent,
  )
  folds.position.y = 1.12
  folds.name = 'illumi-wrapped-shirt-folds'
  figure.add(folds)
}

export function addKallutoKimonoDetails(build: HumanClothesBuild) {
  const { THREE, geometry, figure, frame, materials } = build
  const bow = new THREE.Mesh(
    geometry(THREE, 'manga:kalluto-obi-bow', () =>
      mergeHumanDetails([
        new THREE.SphereGeometry(1, 12, 8)
          .scale(0.08, 0.025, 0.02)
          .rotateZ(0.18)
          .translate(-0.055, 0, 0),
        new THREE.SphereGeometry(1, 12, 8)
          .scale(0.08, 0.025, 0.02)
          .rotateZ(-0.18)
          .translate(0.055, 0, 0),
      ]),
    ),
    materials.shirt,
  )
  bow.position.set(0, 1.11 * frame.neck, 0.142)
  bow.name = 'kalluto-obi-bow'
  figure.add(bow)
  const lace = new THREE.Mesh(
    geometry(THREE, 'manga:kalluto-obi-cord', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.3, 0.006).rotateZ(0.2),
        new THREE.PlaneGeometry(0.3, 0.006).rotateZ(-0.2),
      ]),
    ),
    materials.dark,
  )
  lace.position.set(0, 1.015 * frame.neck, 0.146)
  figure.add(lace)
  const flowers = new THREE.Mesh(
    geometry(THREE, 'manga:kalluto-hem-flowers', () => {
      const parts = []
      for (let i = 0; i < 16; i++) {
        const x = Math.sin(i * 2.4) * 0.17
        const y = -0.08 + (i % 5) * 0.07
        const z = Math.sqrt(Math.max(0.005, 0.23 ** 2 - x ** 2)) * 0.78
        for (let petal = 0; petal < 4; petal++) {
          const a = (petal * Math.PI) / 2
          parts.push(
            new THREE.CircleGeometry(0.012, 10)
              .scale(1, 1.6, 1)
              .rotateZ(a)
              .translate(x + Math.sin(a) * 0.01, y + Math.cos(a) * 0.01, z),
          )
        }
      }
      return mergeHumanDetails(parts)
    }),
    materials.shirt,
  )
  flowers.name = 'kalluto-kimono-flowers'
  figure.add(flowers)
}
