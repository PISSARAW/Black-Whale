import type { Mesh } from 'three'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'
import { saiyuCurve, saiyuScroll } from './mangaSaiyuOrnaments'

function saiyuBracer(build: HumanLimbsBuild) {
  const { THREE, geometry, profile, glow } = build
  const cuff = new THREE.Group()
  cuff.name = 'saiyu-gold-bracer'
  const shell = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-bracer', () => new THREE.CylinderGeometry(0.043, 0.038, 0.16, 24)),
    glow(profile.accent, 1),
  )
  const scrolls = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-bracer-scrollwork', () => {
      const parts = []
      for (const y of [-0.078, 0.078])
        parts.push(
          new THREE.TorusGeometry(0.043, 0.004, 6, 24).rotateX(Math.PI / 2).translate(0, y, 0),
        )
      for (let i = 0; i < 3; i++)
        parts.push(
          saiyuScroll(THREE, {
            radius: 0.018,
            tube: 0.0027,
            at: [0, 0.05 - i * 0.05, 0.043],
            side: i % 2 ? -1 : 1,
          }),
        )
      return mergeHumanDetails(parts)
    }),
    glow(0x65522b, 1),
  )
  cuff.add(shell, scrolls)
  cuff.position.y = -0.209
  return cuff
}

function saiyuTrousers(build: HumanLimbsBuild) {
  const { THREE, geometry, profile, glow } = build
  const leg = new THREE.Group()
  leg.name = 'saiyu-gathered-trousers'
  const cloth = new THREE.Mesh(
    geometry(
      THREE,
      'manga:saiyu-calf-trousers',
      () =>
        new THREE.LatheGeometry(
          [
            new THREE.Vector2(0.048, -0.29),
            new THREE.Vector2(0.065, -0.27),
            new THREE.Vector2(0.064, -0.22),
            new THREE.Vector2(0.076, -0.14),
            new THREE.Vector2(0.069, 0.015),
          ],
          24,
        ),
    ),
    glow(profile.trousers, 1),
  )
  const knee = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-knee-scroll', () =>
      mergeHumanDetails([
        saiyuScroll(THREE, { radius: 0.042, tube: 0.01, at: [0, -0.012, 0.078] }),
        new THREE.CylinderGeometry(0.055, 0.048, 0.035, 24).translate(0, -0.292, 0),
        saiyuCurve(
          THREE,
          [
            [-0.037, -0.2, 0.058],
            [-0.018, -0.24, 0.063],
            [-0.028, -0.265, 0.057],
          ],
          0.002,
        ),
      ]),
    ),
    glow(profile.accent, 1),
  )
  knee.name = 'saiyu-knee-scroll'
  leg.add(cloth, knee)
  return leg
}

export function addSaiyuLimbs(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness !== 'saiyu') return
  const { THREE, geometry, profile, glow } = build
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1
    for (const group of [
      limbs.arms[i].children[0],
      limbs.arms[i].children[2],
      limbs.elbows[i].children[0],
      limbs.knees[i].children[0],
    ])
      (group.children[1] as Mesh).material = glow(profile.skin, 1)
    limbs.legs[i].children[0].scale.multiply(new THREE.Vector3(1.15, 1, 1.1))
    limbs.elbows[i].add(saiyuBracer(build))
    limbs.knees[i].add(saiyuTrousers(build))
    const shoulder = new THREE.Mesh(
      geometry(THREE, `manga:saiyu-shoulder-scroll:${side}`, () =>
        saiyuScroll(THREE, { radius: 0.04, tube: 0.008, at: [0, 0, 0] }).rotateY(
          (side * Math.PI) / 2,
        ),
      ),
      glow(profile.accent, 1),
    )
    shoulder.name = 'saiyu-shoulder-scroll'
    shoulder.position.set(side * 0.055, -0.01, 0)
    limbs.arms[i].add(shoulder)
    const shoe = limbs.knees[i].children[1]
    shoe.children.slice(0, 2).forEach((node) => {
      ;(node as Mesh).geometry = geometry(THREE, 'manga:saiyu-martial-shoe', () =>
        new THREE.SphereGeometry(1, 24, 14).scale(0.044, 0.036, 0.102).translate(0, -0.009, 0.01),
      )
    })
    ;(shoe.children[1] as Mesh).material = glow(profile.trousers, 1)
  }
}
