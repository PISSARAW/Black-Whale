import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaPanel } from './kurapikaGeometry'
import { mangaPanel } from './mangaBody'

export function addMangaHood(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow, profile } = build
  const cloth = glow(profile.jacket, 1)
  const hood = new THREE.Mesh(
    geometry(THREE, 'manga:tserriednich-hood', () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.17, -0.28),
          new THREE.Vector2(0.225, -0.12),
          new THREE.Vector2(0.231, 0.09),
          new THREE.Vector2(0.18, 0.225),
          new THREE.Vector2(0.09, 0.285),
          new THREE.Vector2(0, 0.303),
        ],
        32,
        0.8,
        Math.PI * 2 - 1.6,
      ).scale(1, 1, 0.91),
    ),
    cloth,
  )
  hood.name = 'tserriednich-hood'
  head.add(hood)
  const rim = new THREE.Mesh(
    geometry(THREE, 'manga:hood-rim', () => {
      const points = [
        [0, 0.29, 0.09],
        [-0.13, 0.18, 0.14],
        [-0.175, 0.02, 0.16],
        [-0.15, -0.22, 0.16],
        [0, -0.28, 0.18],
        [0.15, -0.22, 0.16],
        [0.175, 0.02, 0.16],
        [0.13, 0.18, 0.14],
        [0, 0.29, 0.09],
      ]
      return new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
        64,
        0.012,
        8,
        false,
      )
    }),
    glow(new THREE.Color(profile.jacket).multiplyScalar(0.8).getHex(), 1),
  )
  head.add(rim)
  const glasses = new THREE.Mesh(
    geometry(THREE, 'manga:hood-sunglasses', () =>
      mergeHumanDetails([
        new THREE.CircleGeometry(0.057, 32).translate(-0.064, 0.015, 0.203),
        new THREE.CircleGeometry(0.057, 32).translate(0.064, 0.015, 0.203),
        new THREE.PlaneGeometry(0.025, 0.008).translate(0, 0.015, 0.204),
      ]),
    ),
    glow(0x141419, 1),
  )
  glasses.name = 'tserriednich-sunglasses'
  head.add(glasses)
  const cover = new THREE.Mesh(
    geometry(THREE, 'manga:hood-face-cover', () =>
      kurapikaPanel(THREE, [
        [-0.15, -0.055, 0.195],
        [0.15, -0.055, 0.195],
        [0.12, -0.24, 0.2],
        [0, -0.28, 0.203],
        [-0.12, -0.24, 0.2],
      ]),
    ),
    cloth,
  )
  cover.name = 'tserriednich-hood-face-cover'
  head.add(cover)
}

export function addMangaHoodie(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials } = build
  mangaPanel(build, {
    name: 'hoodie-zipper',
    points: [
      [-0.003, 1.49],
      [-0.003, 0.84],
      [0.003, 0.84],
      [0.003, 1.49],
    ],
    material: materials.dark,
  })
  mangaPanel(build, {
    name: 'hoodie-pocket',
    points: [
      [-0.125, 1.02],
      [-0.15, 0.87],
      [0.15, 0.87],
      [0.125, 1.02],
    ],
    material: materials.cloth,
    lift: 0.011,
  })
  mangaPanel(build, {
    name: 'tserriednich-bag-strap',
    points: [
      [0.15, 1.46],
      [0.198, 1.44],
      [-0.164, 0.83],
      [-0.21, 0.85],
    ],
    material: materials.shirt,
    lift: 0.018,
  })
  const rings = new THREE.Mesh(
    geometry(THREE, 'manga:hoodie-drawstrings', () =>
      mergeHumanDetails([
        new THREE.CylinderGeometry(0.003, 0.003, 0.2, 6).translate(-0.027, 1.32, 0.154),
        new THREE.CylinderGeometry(0.003, 0.003, 0.26, 6).translate(0.027, 1.29, 0.154),
        new THREE.TorusGeometry(0.012, 0.003, 6, 18).translate(-0.027, 1.22, 0.156),
        new THREE.TorusGeometry(0.012, 0.003, 6, 18).translate(0.027, 1.16, 0.156),
      ]),
    ),
    materials.dark,
  )
  rings.name = 'hoodie-drawstrings'
  rings.geometry = geometry(THREE, 'manga:hoodie-drawstrings-local', () =>
    rings.geometry.clone().translate(0, -1.12, 0),
  )
  rings.position.y = 1.12
  figure.add(rings)
  const bag = new THREE.Mesh(
    geometry(THREE, 'manga:hoodie-shoulder-bag', () => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.087, -0.1)
      shape.lineTo(0.087, -0.1)
      shape.lineTo(0.087, 0.1)
      shape.lineTo(-0.087, 0.1)
      shape.closePath()
      return new THREE.ExtrudeGeometry(shape, {
        depth: 0.065,
        bevelEnabled: true,
        bevelSize: 0.009,
        bevelThickness: 0.009,
        bevelSegments: 2,
      }).translate(-0.205, -0.28, 0.11)
    }),
    materials.shirt,
  )
  bag.name = 'tserriednich-shoulder-bag'
  bag.position.y = 1.12
  figure.add(bag)
}
