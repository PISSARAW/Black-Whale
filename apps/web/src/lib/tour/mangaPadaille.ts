import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'
import { mangaPanel, mangaBodyShape, mangaChestSurface } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaSurfacePanel } from './kurapikaGeometry'

export function mangaPadailleHair(kit: MangaHairKit) {
  const { THREE, parts } = kit
  parts.push(mangaScalpGeometry(kit))
  parts.push(
    new THREE.SphereGeometry(0.195, 32, 20, 0, Math.PI * 2, 0, 1.3)
      .scale(1, 1.2, 0.94)
      .translate(0, 0.045, 0),
  )
  parts.push(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.168, -0.025),
        new THREE.Vector2(0.191, 0.07),
        new THREE.Vector2(0.176, 0.17),
        new THREE.Vector2(0.115, 0.23),
      ],
      32,
      0.93,
      Math.PI * 2 - 1.86,
    ).scale(1, 1, 0.86),
  )
  for (const side of [-1, 1])
    for (let i = 0; i < 7; i++)
      kit.lock({
        width: 0.023,
        depth: 0.011,
        points: [
          [side * 0.018, 0.235, -0.01 - i * 0.011],
          [side * 0.08, 0.2, 0.14 - i * 0.018],
          [side * 0.14, 0.12, 0.18 - i * 0.018],
          [side * (0.035 + i * 0.022), 0.025 - (i % 3) * 0.016, 0.183 - i * 0.018],
        ],
      })
}

export function addPadailleFace(build: HumanHeadBuild, head: Group) {
  if (build.profile.likeness !== 'padaille') return
  const { THREE, geometry, glow } = build
  const features = new THREE.Mesh(
    geometry(THREE, 'manga:padaille-angular-face', () => {
      const parts = []
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.PlaneGeometry(0.002, 0.093)
            .rotateZ(side * 0.04)
            .translate(side * 0.014, -0.035, 0.185),
        )
        parts.push(
          new THREE.PlaneGeometry(0.027, 0.002)
            .rotateZ(side * 0.28)
            .translate(side * 0.013, -0.082, 0.186),
        )
        parts.push(
          new THREE.PlaneGeometry(0.051, 0.002)
            .rotateZ(side * 0.07)
            .translate(side * 0.065, -0.017, 0.18),
        )
        parts.push(
          new THREE.PlaneGeometry(0.002, 0.05)
            .rotateZ(side * -0.25)
            .translate(side * 0.115, -0.085, 0.15),
        )
      }
      parts.push(new THREE.PlaneGeometry(0.034, 0.002).translate(0, -0.127, 0.15))
      return mergeHumanDetails(parts)
    }),
    glow(0x65584d, 0.8),
  )
  features.name = 'padaille-angular-face'
  head.add(features)
}

export function addPadailleShirt(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  const { chest } = mangaBodyShape(profile)
  const neckline = new THREE.Mesh(
    geometry(THREE, 'manga:padaille-crew-neck', () =>
      new THREE.TorusGeometry(0.073, 0.009, 8, 36).rotateX(Math.PI / 2).scale(1.25, 1, 1),
    ),
    materials.shirt,
  )
  neckline.position.y = 1.465
  neckline.name = 'padaille-crew-neck'
  figure.add(neckline)
  mangaPanel(build, {
    name: 'padaille-neck-opening',
    points: [
      [-0.054, 1.49],
      [-0.065, 1.46],
      [-0.04, 1.44],
      [0, 1.435],
      [0.04, 1.44],
      [0.065, 1.46],
      [0.054, 1.49],
    ],
    material: materials.skin ?? materials.shirt,
    lift: 0.018,
  })
  const folds = new THREE.Mesh(
    geometry(THREE, 'manga:padaille-loose-shirt-folds', () => {
      const parts = []
      for (const side of [-1, 1]) {
        const points = [
          [side * chest * 0.7, 1.33, 0],
          [side * chest * 0.24, 0.97, 0],
          [side * chest * 0.17, 0.94, 0],
          [side * chest * 0.66, 1.31, 0],
        ] as const
        parts.push(
          kurapikaSurfacePanel(THREE, {
            points,
            depth: (x, y) => mangaChestSurface(profile, x, y) + 0.018,
          }),
        )
      }
      return mergeHumanDetails(parts).translate(0, -1.12, 0)
    }),
    materials.shirt,
  )
  folds.position.y = 1.12
  folds.name = 'padaille-loose-shirt-folds'
  figure.add(folds)
}

export function shapePadailleSleeves(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness !== 'padaille') return
  const { THREE, geometry, glow, profile } = build
  for (let i = 0; i < 2; i++) {
    limbs.arms[i].children[0].scale.x *= 1.28
    limbs.arms[i].children[0].scale.z *= 1.28
    limbs.elbows[i].children[0].scale.x *= 1.25
    limbs.elbows[i].children[0].scale.z *= 1.25
    const cuff = new THREE.Mesh(
      geometry(
        THREE,
        'manga:padaille-shirt-cuff',
        () => new THREE.CylinderGeometry(0.039, 0.036, 0.045, 24),
      ),
      glow(profile.shirt, 1),
    )
    cuff.position.y = -0.265
    cuff.name = 'padaille-shirt-cuff'
    limbs.elbows[i].add(cuff)
  }
}
