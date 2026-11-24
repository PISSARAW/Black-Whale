import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import { mergeHumanDetails } from './humanDetailGeometry'

function tube(
  THREE: typeof import('three'),
  points: readonly (readonly [number, number, number])[],
  radius: number,
) {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    24,
    radius,
    5,
    false,
  )
}

export function addNasubiRoyalFace(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const brow = head.getObjectByName(side < 0 ? 'face-brow-left' : 'face-brow-right')
    if (brow) brow.visible = false
  }

  const contours = new THREE.Mesh(
    geometry(THREE, 'manga:nasubi-curled-face-hair', () => {
      const parts = []
      for (const side of [-1, 1]) {
        parts.push(
          tube(
            THREE,
            [
              [side * 0.025, 0.07, 0.181],
              [side * 0.066, 0.095, 0.177],
              [side * 0.11, 0.08, 0.164],
              [side * 0.125, 0.052, 0.158],
            ],
            0.0028,
          ),
        )
        parts.push(
          tube(
            THREE,
            [
              [side * 0.01, -0.068, 0.188],
              [side * 0.053, -0.058, 0.184],
              [side * 0.096, -0.074, 0.175],
              [side * 0.116, -0.108, 0.164],
              [side * 0.102, -0.132, 0.158],
            ],
            0.0042,
          ),
        )
        for (let lash = 0; lash < 3; lash++)
          parts.push(
            new THREE.BoxGeometry(0.0022, 0.018 + lash * 0.003, 0.002)
              .rotateZ(side * (0.55 + lash * 0.16))
              .translate(side * (0.078 + lash * 0.014), 0.025 - lash * 0.004, 0.184),
          )
      }
      return mergeHumanDetails(parts)
    }),
    materials.ink,
  )
  contours.name = 'nasubi-curled-brows-lashes-moustache'
  head.add(contours)

  const knot = new THREE.Mesh(
    geometry(THREE, 'manga:nasubi-topknot', () =>
      mergeHumanDetails([
        new THREE.CylinderGeometry(0.032, 0.043, 0.09, 10).rotateZ(-0.2).translate(0, 0.31, -0.04),
        new THREE.SphereGeometry(0.055, 10, 7).scale(1.3, 0.72, 0.8).translate(0.027, 0.36, -0.035),
      ]),
    ),
    materials.hairInk,
  )
  knot.name = 'nasubi-topknot'
  head.add(knot)

  const cheekCurls = new THREE.Mesh(
    geometry(THREE, 'manga:nasubi-cheek-curls', () =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          tube(
            THREE,
            [
              [side * 0.15, -0.04, 0.12],
              [side * 0.17, -0.12, 0.13],
              [side * 0.14, -0.17, 0.145],
              [side * 0.125, -0.135, 0.153],
            ],
            0.0022,
          ),
        ),
      ),
    ),
    glow(0x795744, 0.9),
  )
  cheekCurls.name = 'nasubi-cheek-curls'
  head.add(cheekCurls)
}

export function addNasubiRoyalOrnaments(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials } = build
  for (const side of [-1, 1]) {
    const trouser = new THREE.Mesh(
      geometry(THREE, 'manga:nasubi-baggy-trouser', () =>
        new THREE.SphereGeometry(1, 14, 8).scale(0.16, 0.27, 0.15),
      ),
      materials.dark,
    )
    trouser.position.set(side * 0.145, 0.56, 0)
    trouser.name = 'nasubi-baggy-trouser'
    figure.add(trouser)
  }
  const feathers: BufferGeometry[] = []
  for (let row = 0; row < 4; row++)
    for (let column = -3; column <= 3; column++) {
      const x = column * 0.045 + (row % 2 ? 0.022 : 0)
      if (Math.abs(x) > 0.145) continue
      feathers.push(
        new THREE.SphereGeometry(0.018, 7, 5)
          .scale(0.72, 1.7, 0.25)
          .rotateZ(-x * 1.8)
          .translate(x * 1.55, 1.31 - row * 0.045, 0.265),
      )
    }
  const bib = new THREE.Mesh(
    geometry(THREE, 'manga:nasubi-pectoral-feathers', () => mergeHumanDetails(feathers)),
    materials.shirt,
  )
  bib.name = 'nasubi-pectoral-feathers'
  figure.add(bib)

  for (let i = 0; i < 9; i++) {
    const angle = Math.PI * (0.14 + (i / 8) * 0.72)
    const jewel = new THREE.Mesh(
      geometry(THREE, 'manga:nasubi-necklace-jewel', () => new THREE.SphereGeometry(0.018, 8, 6)),
      materials.accent,
    )
    jewel.position.set(Math.cos(angle) * 0.215, 1.42 - Math.sin(angle) * 0.12, 0.265)
    jewel.name = 'nasubi-necklace-jewel'
    figure.add(jewel)
  }

  for (const side of [-1, 1])
    for (let row = 0; row < 6; row++) {
      const gem = new THREE.Mesh(
        geometry(THREE, 'manga:nasubi-coat-gem', () => new THREE.OctahedronGeometry(0.014, 0)),
        row % 2 ? materials.shirt : materials.accent,
      )
      gem.position.set(side * (0.27 + (row % 2) * 0.035), 1.16 - row * 0.105, 0.183)
      gem.name = 'nasubi-coat-gem'
      figure.add(gem)
    }
}
