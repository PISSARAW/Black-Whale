import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import { mangaBodyShape } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addMangaBandagedHead(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow, profile } = build
  const face = (head.getObjectByName('manga-face')!.children[1] as Mesh).geometry
  const wrap = new THREE.Mesh(
    geometry(THREE, 'manga:bonolenov-head-wrap', () => face.clone().scale(1.04, 1.04, 1.04)),
    glow(profile.jacket, 1),
  )
  wrap.name = 'bonolenov-head-wrap'
  head.add(wrap)
  const lines = new THREE.Mesh(
    geometry(THREE, 'manga:bonolenov-head-seams', () => {
      const parts = []
      for (const y of [-0.15, -0.11, -0.07, -0.025, 0.055, 0.1, 0.145, 0.185]) {
        const radius = Math.sqrt(Math.max(0, 0.195 ** 2 - (y / 1.13) ** 2)) + 0.001
        parts.push(
          new THREE.CylinderGeometry(radius, radius, 0.0024, 28, 1, true)
            .scale(0.92, 1, 0.98)
            .translate(0, y, 0),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(profile.shirt, 0.65),
  )
  lines.name = 'bonolenov-bandage-seams'
  head.add(lines)
  const holes = new THREE.Mesh(
    geometry(THREE, 'manga:bonolenov-face-openings', () =>
      mergeHumanDetails([
        new THREE.CircleGeometry(0.018, 20).scale(1.2, 0.65, 1).translate(-0.057, 0.012, 0.187),
        new THREE.CircleGeometry(0.018, 20).scale(1.2, 0.65, 1).translate(0.057, 0.012, 0.187),
        new THREE.CircleGeometry(0.014, 20).scale(0.8, 1.35, 1).translate(0, -0.102, 0.175),
      ]),
    ),
    glow(0x211e1b, 1),
  )
  holes.name = 'bonolenov-bandage-openings'
  head.add(holes)
}

export function addMangaBodyBandages(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  const shape = mangaBodyShape(profile)
  const bands = new THREE.Mesh(
    geometry(THREE, 'manga:bonolenov-body-bandages', () => {
      const parts = []
      for (let i = 0; i < 11; i++) {
        const y = 0.78 + i * 0.055
        const radius = shape.waist + (shape.chest - shape.waist) * Math.max(0, (y - 1.03) / 0.32)
        parts.push(
          new THREE.CylinderGeometry(radius + 0.003, radius + 0.003, 0.006, 28, 1, true)
            .scale(1, 1, shape.depth / shape.chest)
            .translate(0, y - 1.12, 0),
        )
      }
      return mergeHumanDetails(parts)
    }),
    materials.shirt,
  )
  bands.name = 'signature-bandages'
  bands.position.y = 1.12
  figure.add(bands)
}
