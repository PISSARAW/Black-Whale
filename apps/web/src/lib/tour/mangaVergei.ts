import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import { mergeHumanDetails } from './humanDetailGeometry'
import { addMangaSuit } from './mangaTailoring'
import { mangaPanel } from './mangaBody'

export function addVergeiAngularFaceAndHair(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  const contours = new THREE.Mesh(
    geometry(THREE, 'manga:vergei-angular-cheekbones', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.PlaneGeometry(0.004, 0.082)
            .rotateZ(side * 0.61)
            .translate(side * 0.105, -0.047, 0.178),
        )
        parts.push(
          new THREE.PlaneGeometry(0.004, 0.054)
            .rotateZ(side * -0.28)
            .translate(side * 0.069, -0.096, 0.183),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x655046, 0.82),
  )
  contours.name = 'vergei-prominent-cheekbone-lines'
  head.add(contours)

  const hairline = new THREE.Mesh(
    geometry(THREE, 'manga:vergei-high-forehead-hairline', () => {
      const parts: BufferGeometry[] = []
      for (let strand = -5; strand <= 5; strand++) {
        const x = strand * 0.029
        parts.push(
          new THREE.ConeGeometry(0.021, 0.12 + (5 - Math.abs(strand)) * 0.004, 4)
            .rotateZ(strand * -0.045)
            .translate(x, 0.216 - Math.abs(strand) * 0.002, 0.045),
        )
      }
      return mergeHumanDetails(parts)
    }),
    materials.hairInk,
  )
  hairline.name = 'vergei-groomed-short-hairline'
  head.add(hairline)

  const combLines = new THREE.Mesh(
    geometry(THREE, 'manga:vergei-combed-hair-lines', () => {
      const parts: BufferGeometry[] = []
      for (let line = -4; line <= 4; line++)
        parts.push(
          new THREE.BoxGeometry(0.002, 0.105, 0.003)
            .rotateZ(-0.7 + line * 0.045)
            .translate(line * 0.027, 0.222, 0.079 - Math.abs(line) * 0.003),
        )
      return mergeHumanDetails(parts)
    }),
    glow(0x8b8b8c, 0.72),
  )
  combLines.name = 'vergei-combed-hair-lines'
  head.add(combLines)
}

export function addVergeiBodyguardSuit(build: HumanClothesBuild): void {
  addMangaSuit(build)
  const { materials } = build
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `vergei-sharp-lapel-seam-${side}`,
      points: [
        [side * 0.055, 1.43],
        [side * 0.14, 1.25],
        [side * 0.125, 1.235],
        [side * 0.045, 1.405],
      ],
      material: materials.shirt,
      lift: 0.014,
    })
}
