import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'
import { mangaPanel, mangaChestSurface } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function mangaGelHair(kit: MangaHairKit) {
  const { THREE, parts } = kit
  parts.push(openForehead(mangaScalpGeometry(kit)))
  parts.push(
    openForehead(
      new THREE.SphereGeometry(0.184, 32, 20, 0, Math.PI * 2, 0, 1.2)
        .scale(1, 1.17, 0.92)
        .translate(0, 0.04, -0.012),
    ),
  )
  parts.push(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.15, -0.87),
        new THREE.Vector2(0.2, -0.58),
        new THREE.Vector2(0.19, -0.22),
        new THREE.Vector2(0.185, 0.1),
      ],
      32,
      0.99,
      Math.PI * 2 - 1.98,
    ).scale(1, 1, 0.86),
  )
  for (const side of [-1, 1])
    for (let i = 0; i < 8; i++)
      kit.lock({
        width: 0.023,
        depth: 0.01,
        points: [
          [side * 0.1, 0.19, -i * 0.02],
          [side * 0.177, 0.015, 0.075 - i * 0.026],
          [side * 0.177, -0.4, 0.05 - i * 0.026],
          [side * (0.22 + (i % 2) * 0.02), -0.87 - i * 0.008, 0.02 - i * 0.026],
        ],
      })
}

export function addGelFace(build: HumanHeadBuild, head: Group) {
  if (build.profile.likeness !== 'gel') return
  const { THREE, geometry, glow, materials } = build
  for (const side of [-1, 1]) {
    const eye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')!
    const iris = eye.getObjectByName('eye-pupil') as Mesh
    iris.geometry = geometry(THREE, 'manga:gel-turquoise-iris', () =>
      new THREE.CircleGeometry(0.027, 32).scale(0.72, 1.08, 1),
    )
    iris.material = glow(0x66bfc4, 1)
    const pupil = new THREE.Mesh(
      geometry(THREE, 'manga:gel-slit-pupil', () =>
        new THREE.CircleGeometry(0.009, 24).scale(0.5, 2.4, 1),
      ),
      glow(0x18353a, 1),
    )
    pupil.position.z = 0.0016
    pupil.name = 'gel-slit-pupil'
    iris.add(pupil)
    const lashes = new THREE.Mesh(
      geometry(THREE, `manga:gel-lashes:${side}`, () =>
        mergeHumanDetails([
          new THREE.ConeGeometry(0.004, 0.025, 3)
            .rotateZ(side * -0.6)
            .translate(side * 0.036, 0.023, 0.003),
          new THREE.ConeGeometry(0.003, 0.018, 3)
            .rotateZ(side * -1.1)
            .translate(side * 0.04, 0.009, 0.003),
        ]),
      ),
      materials.ink,
    )
    eye.add(lashes)
  }
  head.getObjectByName('face-mouth')!.visible = false
  const lips = new THREE.Mesh(
    geometry(THREE, 'manga:gel-lipstick', () =>
      mergeHumanDetails([
        new THREE.SphereGeometry(1, 16, 10).scale(0.031, 0.009, 0.007).translate(0, -0.104, 0.169),
        new THREE.SphereGeometry(1, 16, 10).scale(0.027, 0.011, 0.007).translate(0, -0.12, 0.169),
      ]),
    ),
    glow(0x8c4d67, 1),
  )
  lips.name = 'gel-lipstick'
  head.add(lips)
}

export function addGelScallopedTop(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  mangaPanel(build, {
    name: 'gel-open-neckline',
    points: [
      [-0.145, 1.47],
      [-0.155, 1.405],
      [-0.1, 1.31],
      [0, 1.27],
      [0.1, 1.31],
      [0.155, 1.405],
      [0.145, 1.47],
    ],
    material: materials.skin ?? materials.shirt,
    lift: 0.016,
  })
  const trim = new THREE.Mesh(
    geometry(THREE, 'manga:gel-scalloped-neckline', () => {
      const parts = []
      for (let i = -4; i <= 4; i++) {
        const x = i * 0.027,
          y = 1.27 + Math.abs(i / 4) ** 1.6 * 0.075
        parts.push(
          new THREE.SphereGeometry(1, 12, 10)
            .scale(0.023, 0.021, 0.008)
            .translate(x, y, mangaChestSurface(profile, x, y) + 0.024),
        )
      }
      return mergeHumanDetails(parts).translate(0, -1.12, 0)
    }),
    materials.cloth,
  )
  trim.position.y = 1.12
  trim.name = 'gel-scalloped-neckline'
  figure.add(trim)
}

export function shapeGelShoulders(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness !== 'gel') return
  for (const arm of limbs.arms)
    (arm.children[2].children[1] as Mesh).material = build.glow(build.profile.skin, 1)
}

function openForehead(shape: BufferGeometry) {
  const positions = shape.getAttribute('position'),
    source = shape.index!,
    triangles = []
  for (let i = 0; i < source.count; i += 3) {
    const ids = [source.getX(i), source.getX(i + 1), source.getX(i + 2)]
    const onForehead = ids.some(
      (id) =>
        positions.getZ(id) > 0.025 &&
        positions.getY(id) < 0.21 - (positions.getX(id) / 0.18) ** 2 * 0.2,
    )
    if (!onForehead) triangles.push(...ids)
  }
  shape.setIndex(triangles)
  return shape
}
