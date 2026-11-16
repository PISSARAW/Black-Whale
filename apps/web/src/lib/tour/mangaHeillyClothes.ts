import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaPanel, mangaChestSurface } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaSurfacePanel } from './kurapikaGeometry'

export function addLuiniPatternedJacket(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:luini-standing-collar',
      () => new THREE.CylinderGeometry(0.07, 0.085, 0.085, 28, 1, true),
    ),
    materials.cloth,
  )
  collar.position.y = 1.47
  collar.name = 'luini-standing-collar'
  figure.add(collar)
  const patches = new THREE.Mesh(
    geometry(THREE, 'manga:luini-jacket-pattern', () => {
      const parts = []
      for (let row = 0; row < 6; row++)
        for (let col = -3; col <= 3; col++) {
          const x = col * 0.046 + (row % 2) * 0.016,
            y = 0.86 + row * 0.085
          const w = 0.012 + ((row + col + 3) % 3) * 0.003
          parts.push(
            kurapikaSurfacePanel(THREE, {
              points: [
                [x - w, y - 0.018, 0],
                [x + w, y - 0.013, 0],
                [x + w * 0.7, y + 0.017, 0],
                [x - w * 0.5, y + 0.023, 0],
              ],
              depth: (sx, sy) => mangaChestSurface(profile, sx, sy) + 0.014,
            }),
          )
        }
      return mergeHumanDetails(parts).translate(0, -1.12, 0)
    }),
    materials.shirt,
  )
  patches.position.y = 1.12
  patches.name = 'luini-jacket-pattern'
  figure.add(patches)
  mangaPanel(build, {
    name: 'luini-jacket-centre',
    points: [
      [-0.018, 1.46],
      [-0.018, 0.79],
      [0.018, 0.79],
      [0.018, 1.46],
    ],
    material: materials.accent,
    lift: 0.023,
  })
  const clasps = new THREE.Mesh(
    geometry(THREE, 'manga:luini-horizontal-fasteners', () => {
      const parts = []
      for (let i = 0; i < 4; i++) {
        const y = 1.35 - i * 0.135
        const z = mangaChestSurface(profile, 0, y) + 0.03
        parts.push(new THREE.BoxGeometry(0.126, 0.012, 0.01).translate(0, y - 1.12, z))
        for (const side of [-1, 1])
          parts.push(
            new THREE.TorusGeometry(0.012, 0.003, 6, 16).translate(side * 0.068, y - 1.12, z),
          )
      }
      return mergeHumanDetails(parts)
    }),
    materials.accent,
  )
  clasps.position.y = 1.12
  clasps.name = 'luini-horizontal-fasteners'
  figure.add(clasps)
}

export function addHeillyReferenceLimbs(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness === 'luini') luiniLimbDetails(build, limbs)
  if (build.profile.likeness === 'yokotani') yokotaniBook(build, limbs)
}

function luiniLimbDetails(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  const patches = geometry(THREE, 'manga:luini-sleeve-pattern', () => {
    const parts = []
    for (let i = 0; i < 6; i++)
      parts.push(
        new THREE.PlaneGeometry(0.024, 0.027)
          .rotateZ(i * 0.7)
          .translate(i % 2 ? -0.02 : 0.02, -0.04 - i * 0.043, 0.055),
      )
    return mergeHumanDetails(parts)
  })
  for (let i = 0; i < 2; i++) {
    for (const joint of [limbs.arms[i], limbs.elbows[i]])
      joint.add(new THREE.Mesh(patches, glow(profile.shirt, 1)))
    const boot = new THREE.Mesh(
      geometry(
        THREE,
        'manga:luini-high-boot',
        () => new THREE.CylinderGeometry(0.055, 0.058, 0.25, 24),
      ),
      glow(0x24252a, 1),
    )
    boot.position.y = -0.33
    boot.name = 'luini-high-boot'
    limbs.knees[i].add(boot)
    const laces = new THREE.Mesh(
      geometry(THREE, 'manga:luini-boot-laces', () => {
        const parts = []
        for (let lace = 0; lace < 8; lace++)
          parts.push(
            new THREE.PlaneGeometry(0.03, 0.0025)
              .rotateZ(lace % 2 ? 0.3 : -0.3)
              .translate(0, -0.22 - lace * 0.027, 0.06),
          )
        return mergeHumanDetails(parts)
      }),
      glow(0xb1afa6, 1),
    )
    limbs.knees[i].add(laces)
  }
}

function yokotaniBook(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow } = build
  const hand = limbs.elbows[0].getObjectByName('hand-left')!
  const book = new THREE.Group()
  book.name = 'yokotani-code-book'
  book.position.set(0.045, 0.015, 0.055)
  const cover = new THREE.Mesh(
    geometry(THREE, 'manga:yokotani-book-cover', () => new THREE.BoxGeometry(0.22, 0.29, 0.052)),
    glow(0x33323a, 1),
  )
  const pages = new THREE.Mesh(
    geometry(THREE, 'manga:yokotani-book-pages', () => new THREE.BoxGeometry(0.205, 0.265, 0.041)),
    glow(0xe9e4d8, 1),
  )
  pages.position.x = 0.004
  const label = new THREE.Mesh(
    geometry(THREE, 'manga:yokotani-book-title-band', () => new THREE.PlaneGeometry(0.205, 0.055)),
    glow(0xe9e4d8, 1),
  )
  label.position.set(0, 0.073, 0.027)
  book.add(cover, pages, label)
  hand.add(book)
}
