import type { Mesh } from 'three'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'

function trouserFold(build: HumanLimbsBuild, lower: boolean) {
  const { THREE } = build
  const points = lower
    ? [
        [0.028, -0.04, 0.137],
        [0.052, -0.17, 0.132],
        [0.021, -0.29, 0.103],
      ]
    : [
        [-0.024, -0.12, 0.146],
        [-0.054, -0.23, 0.145],
        [-0.041, -0.34, 0.15],
      ]
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    20,
    0.0015,
    4,
    false,
  )
}

function trouserGeometry(build: HumanLimbsBuild, lower: boolean) {
  const { THREE } = build
  const sections = lower
    ? [
        [0.055, -0.21],
        [0.08, -0.13],
        [0.117, 0.04],
        [0.12, 0.16],
        [0.09, 0.21],
      ]
    : [
        [0.09, -0.22],
        [0.13, -0.13],
        [0.12, 0.08],
        [0.11, 0.22],
      ]
  const points = [[0, sections[0][1]], ...sections, [0, sections.at(-1)![1]]]
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    24,
  )
}

export function addZhangLeiLimbs(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, profile, glow } = build
  const upper = geometry(THREE, 'manga:zhanglei-baggy-thigh', () => trouserGeometry(build, false))
  const lower = geometry(THREE, 'manga:zhanglei-baggy-calf', () => trouserGeometry(build, true))
  for (let index = 0; index < 2; index++) {
    const leg = limbs.legs[index].children[0],
      shin = limbs.knees[index].children[0]
    for (const mesh of leg.children) (mesh as Mesh).geometry = upper
    for (const mesh of shin.children) (mesh as Mesh).geometry = lower
    ;(leg.children[1] as Mesh).material = glow(profile.trousers, 1)
    ;(shin.children[1] as Mesh).material = glow(profile.trousers, 1)
    leg.name = 'zhanglei-baggy-trouser-thigh'
    shin.name = 'zhanglei-baggy-trouser-calf'
    limbs.arms[index].children[0].scale.multiply(new THREE.Vector3(1.4, 1, 1.4))
    limbs.arms[index].children[2].scale.multiply(new THREE.Vector3(1.22, 1, 1.22))
    limbs.elbows[index].children[0].scale.multiply(new THREE.Vector3(1.6, 1, 1.6))
    const cuff = new THREE.Mesh(
      geometry(
        THREE,
        'manga:zhanglei-sleeve-trim',
        () => new THREE.CylinderGeometry(0.068, 0.07, 0.018, 24),
      ),
      glow(profile.shirt, 1),
    )
    cuff.name = 'zhanglei-wide-sleeve-cuff'
    cuff.position.y = -0.265
    limbs.elbows[index].add(cuff)
    const ankle = new THREE.Mesh(
      geometry(
        THREE,
        'manga:zhanglei-dark-ankle-band',
        () => new THREE.CylinderGeometry(0.063, 0.057, 0.09, 24),
      ),
      glow(0x24252a, 1),
    )
    ankle.name = 'zhanglei-dark-ankle-band'
    ankle.position.y = -0.365
    limbs.knees[index].add(ankle)
    const shoe = limbs.knees[index].children[1]
    ;(shoe.children[1] as Mesh).material = glow(profile.jacket, 1)
    const upperFold = new THREE.Mesh(
      geometry(THREE, 'manga:zhanglei-upper-trouser-fold', () => trouserFold(build, false)),
      glow(0xaaa18f, 1),
    )
    upperFold.name = 'zhanglei-trouser-fold'
    limbs.legs[index].add(upperFold)
    const lowerFold = new THREE.Mesh(
      geometry(THREE, 'manga:zhanglei-lower-trouser-fold', () => trouserFold(build, true)),
      glow(0xaaa18f, 1),
    )
    lowerFold.name = 'zhanglei-trouser-fold'
    limbs.knees[index].add(lowerFold)
  }
}
