import type { Group } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import { addMangaSuit } from './mangaTailoring'
import type { HumanHeadBuild } from './humanHead'
import type { MangaHairKit } from './mangaHair'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'

/** Long side and back locks leave Melody's round crown fully exposed. */
export function mangaMelodyHair(kit: MangaHairKit) {
  const { THREE, parts } = kit
  parts.push(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.195, -0.63),
        new THREE.Vector2(0.225, -0.42),
        new THREE.Vector2(0.202, -0.13),
        new THREE.Vector2(0.184, 0.04),
      ],
      32,
      0.9,
      Math.PI * 2 - 1.8,
    ).scale(1, 1, 0.82),
  )
  for (const side of [-1, 1])
    for (let i = 0; i < 9; i++)
      kit.lock({
        width: 0.022,
        depth: 0.009,
        points: [
          [side * 0.17, 0.04, 0.03 - i * 0.025],
          [side * 0.195, -0.15, 0.075 - i * 0.027],
          [side * (0.225 + Math.sin(i) * 0.012), -0.4, 0.07 - i * 0.027],
          [side * 0.21, -0.64 - (i % 3) * 0.014, 0.055 - i * 0.027],
        ],
      })
}

export function addMelodySoftFeatures(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(
      geometry(THREE, 'manga:melody-soft-cheek', () =>
        new THREE.SphereGeometry(1, 16, 12).scale(0.045, 0.05, 0.015),
      ),
      materials.skin,
    )
    cheek.position.set(side * 0.135, -0.07, 0.112)
    cheek.name = side < 0 ? 'melody-cheek-left' : 'melody-cheek-right'
    head.add(cheek)
    const tooth = new THREE.Mesh(
      geometry(THREE, 'manga:melody-small-tooth', () => new THREE.BoxGeometry(0.014, 0.009, 0.004)),
      glow(0xf6efe4, 1),
    )
    tooth.position.set(side * 0.008, -0.11, 0.14)
    tooth.name = side < 0 ? 'melody-tooth-left' : 'melody-tooth-right'
    head.add(tooth)
  }
  const lip = new THREE.Mesh(
    geometry(THREE, 'manga:melody-soft-mouth', () =>
      new THREE.TorusGeometry(0.036, 0.0025, 6, 24, Math.PI).scale(1, 0.5, 1).rotateZ(Math.PI),
    ),
    materials.ink,
  )
  lip.name = 'melody-mouth'
  lip.position.set(0, -0.107, 0.172)
  head.add(lip)
}

export function shapeMelodyLimbs(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness !== 'melody') return
  for (let i = 0; i < 2; i++) {
    limbs.arms[i].children[0].scale.x *= 1.2
    limbs.elbows[i].children[0].scale.x *= 1.15
    limbs.legs[i].children[0].scale.x *= 1.3
    limbs.knees[i].children[0].scale.x *= 1.2
  }
}

export function addMelodySuit(build: HumanClothesBuild) {
  addMangaSuit(build)
  for (const name of ['manga-tie', 'manga-tie-knot']) {
    const tie = build.figure.getObjectByName(name) as import('three').Mesh
    tie.material = build.materials.dark
  }
}
