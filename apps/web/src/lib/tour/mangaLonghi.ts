import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import { mergeHumanDetails } from './humanDetailGeometry'
import { addMangaSuit } from './mangaTailoring'
import { mangaChestSurface, mangaClothesKey, mangaPanel } from './mangaBody'

export function addLonghiGauntFaceAndPonytail(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  const cheekLines = new THREE.Mesh(
    geometry(THREE, 'manga:longhi-gaunt-cheeks', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.PlaneGeometry(0.003, 0.078)
            .rotateZ(side * 0.48)
            .translate(side * 0.109, -0.067, 0.176),
        )
        parts.push(
          new THREE.PlaneGeometry(0.003, 0.041)
            .rotateZ(side * -0.22)
            .translate(side * 0.076, -0.103, 0.182),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x765f50, 0.82),
  )
  cheekLines.name = 'longhi-gaunt-cheek-lines'
  head.add(cheekLines)

  const partAndFlow = new THREE.Mesh(
    geometry(THREE, 'manga:longhi-centre-part-flow', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1])
        for (let strand = 0; strand < 4; strand++)
          parts.push(
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3([
                new THREE.Vector3(side * (0.012 + strand * 0.01), 0.214, 0.055),
                new THREE.Vector3(side * (0.055 + strand * 0.018), 0.185, 0.13),
                new THREE.Vector3(side * (0.11 + strand * 0.014), 0.105, 0.13),
                new THREE.Vector3(side * (0.145 + strand * 0.008), 0.035, 0.07),
              ]),
              12,
              0.0015,
              4,
              false,
            ),
          )
      return mergeHumanDetails(parts)
    }),
    glow(0x8f774d, 0.86),
  )
  partAndFlow.name = 'longhi-centre-part-hair-flow'
  head.add(partAndFlow)

  const tie = new THREE.Mesh(
    geometry(THREE, 'manga:longhi-ponytail-tie', () =>
      new THREE.TorusGeometry(0.045, 0.009, 7, 18).rotateX(Math.PI / 2),
    ),
    materials.ink,
  )
  tie.name = 'longhi-ponytail-tie'
  tie.position.set(0, 0.015, -0.205)
  head.add(tie)
}

export function addLonghiRoyalBodyguardSuit(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials, profile } = build
  addMangaSuit(build)
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `longhi-shoulder-seam-${side}`,
      points: [
        [side * 0.07, 1.405],
        [side * 0.19, 1.365],
        [side * 0.187, 1.352],
        [side * 0.066, 1.392],
      ],
      material: materials.shirt,
      lift: 0.011,
    })
  const tieBar = new THREE.Mesh(
    geometry(
      THREE,
      `manga:longhi-tie-bar:${mangaClothesKey(profile)}`,
      () => new THREE.BoxGeometry(0.057, 0.008, 0.006),
    ),
    materials.accent,
  )
  tieBar.name = 'longhi-tie-bar'
  tieBar.position.set(0, 1.255, mangaChestSurface(profile, 0, 1.255) + 0.026)
  figure.add(tieBar)
}
