import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import { mergeHumanDetails } from './humanDetailGeometry'
import { addMangaDress } from './mangaRobes'
import { mangaPanel } from './mangaBody'

export function addMomozeElaboratePonytail(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const eye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')
    eye?.scale.set(1.12, 1.15, 1)
  }

  const ponytail = new THREE.Mesh(
    geometry(THREE, 'manga:momoze-ponytail-cascade', () => {
      const parts = []
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 1.6 - Math.PI * 0.25
        parts.push(
          new THREE.SphereGeometry(1, 12, 8)
            .scale(0.11 + (i % 2) * 0.025, 0.09, 0.075)
            .rotateZ(angle * 0.18)
            .translate(0.09 + Math.cos(angle) * 0.1, 0.08 - i * 0.055, -0.17),
        )
      }
      return mergeHumanDetails(parts)
    }),
    materials.hairInk,
  )
  ponytail.name = 'momoze-voluminous-ponytail'
  head.add(ponytail)

  const ringlets = new THREE.Mesh(
    geometry(THREE, 'manga:momoze-front-ringlets', () => {
      const parts = []
      for (const side of [-1, 1]) {
        const points = []
        for (let i = 0; i <= 70; i++) {
          const t = i / 70
          const angle = t * Math.PI * 6
          points.push(
            new THREE.Vector3(
              side * (0.135 + Math.cos(angle) * 0.025),
              0.05 - t * 0.43,
              0.115 + Math.sin(angle) * 0.027,
            ),
          )
        }
        parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 70, 0.018, 7, false))
      }
      return mergeHumanDetails(parts)
    }),
    materials.hairInk,
  )
  ringlets.name = 'momoze-front-ringlets'
  head.add(ringlets)

  const shine = new THREE.Mesh(
    geometry(THREE, 'manga:momoze-hair-shine', () =>
      new THREE.TorusGeometry(0.105, 0.002, 4, 24, Math.PI * 0.75).rotateZ(0.25),
    ),
    glow(0xffe4ba, 0.9),
  )
  shine.position.set(0.07, 0.16, 0.145)
  shine.name = 'momoze-lustrous-hair-shine'
  head.add(shine)
}

export function addMomozeRoyalGown(build: HumanClothesBuild): void {
  addMangaDress(build)
  const { THREE, geometry, figure, materials } = build
  mangaPanel(build, {
    name: 'momoze-dark-blouse',
    points: [
      [-0.09, 1.42],
      [-0.1, 1.15],
      [0, 1.02],
      [0.1, 1.15],
      [0.09, 1.42],
    ],
    material: materials.shirt,
    lift: 0.014,
  })

  for (const side of [-1, 1]) {
    const puff = new THREE.Mesh(
      geometry(THREE, 'manga:momoze-juliet-sleeve', () =>
        new THREE.SphereGeometry(1, 14, 9).scale(0.095, 0.13, 0.1),
      ),
      materials.cloth,
    )
    puff.position.set(side * 0.255, 1.34, 0)
    puff.name = 'momoze-juliet-sleeve'
    figure.add(puff)
  }

  const necklace = new THREE.Mesh(
    geometry(THREE, 'manga:momoze-refined-necklace', () => {
      const beads = []
      for (let i = 0; i < 11; i++) {
        const angle = Math.PI * (0.12 + (i / 10) * 0.76)
        beads.push(
          new THREE.SphereGeometry(0.009, 8, 6).translate(
            Math.cos(angle) * 0.095,
            -Math.sin(angle) * 0.05,
            0,
          ),
        )
      }
      return mergeHumanDetails(beads)
    }),
    materials.accent,
  )
  necklace.position.set(0, 1.43, 0.17)
  necklace.name = 'momoze-refined-necklace'
  figure.add(necklace)
}
