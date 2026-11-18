import type { Mesh } from 'three'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

function trousers(build: HumanLimbsBuild, lower: boolean) {
  const { THREE } = build
  const points = lower
    ? [
        [0.099, -0.2],
        [0.128, -0.13],
        [0.139, 0.04],
        [0.126, 0.17],
        [0.105, 0.21],
      ]
    : [
        [0.105, -0.22],
        [0.139, -0.12],
        [0.133, 0.1],
        [0.105, 0.23],
      ]
  return new THREE.LatheGeometry(
    [[0, points[0][1]], ...points, [0, points.at(-1)![1]]].map(([r, y]) => new THREE.Vector2(r, y)),
    28,
  ).scale(1, 1, 0.92)
}

function folds(build: HumanLimbsBuild, lower: boolean) {
  const { THREE } = build
  const rows = lower ? [-0.06, -0.21, -0.32] : [-0.15, -0.28, -0.36]
  return mergeHumanDetails(
    rows.map(
      (y, i) =>
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.075, y + 0.03, 0.08),
            new THREE.Vector3(-0.01, y - 0.003, 0.113 - i * 0.004),
            new THREE.Vector3(0.065, y + 0.022, 0.088),
          ]),
          24,
          0.0015,
          4,
          false,
        ),
    ),
  )
}

function slipper(build: HumanLimbsBuild) {
  const { THREE } = build
  const plan = new THREE.Shape()
  plan.moveTo(-0.051, -0.08)
  plan.lineTo(0.051, -0.08)
  plan.quadraticCurveTo(0.072, 0.075, 0, 0.225)
  plan.quadraticCurveTo(-0.072, 0.075, -0.051, -0.08)
  const shape = new THREE.ExtrudeGeometry(plan, {
    depth: 0.075,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.004,
    bevelThickness: 0.003,
  })
  return shape.rotateX(Math.PI / 2).translate(0, 0.0375, 0)
}

function addSlippers(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow } = build
  const shape = geometry(THREE, 'manga:luzurus-pointed-slipper', () => slipper(build))
  const ornaments = geometry(THREE, 'manga:luzurus-slipper-pattern', () =>
    mergeHumanDetails(
      Array.from({ length: 12 }, (_, i) => {
        const row = Math.floor(i / 3),
          x = ((i % 3) - 1) * (0.021 - row * 0.003)
        return new THREE.TorusGeometry(0.006, 0.001, 4, 8)
          .rotateX(Math.PI / 2)
          .translate(x, 0.041, 0.035 + row * 0.031)
      }),
    ),
  )
  for (const knee of limbs.knees) {
    const shoe = knee.children[1]
    for (const child of shoe.children.slice(0, 2)) (child as Mesh).geometry = shape
    ;(shoe.children[1] as Mesh).material = glow(0x38342f, 1)
    const pattern = new THREE.Mesh(ornaments, glow(0xc4b18b, 1))
    pattern.name = 'luzurus-slipper-pattern'
    shoe.add(pattern)
  }
}

export function addLuzurusLimbs(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  const thigh = geometry(THREE, 'manga:luzurus-wide-trouser-thigh', () => trousers(build, false))
  const calf = geometry(THREE, 'manga:luzurus-wide-trouser-calf', () => trousers(build, true))
  for (let i = 0; i < 2; i++) {
    const upper = limbs.legs[i].children[0],
      lower = limbs.knees[i].children[0]
    for (const mesh of upper.children) (mesh as Mesh).geometry = thigh
    for (const mesh of lower.children) (mesh as Mesh).geometry = calf
    upper.name = 'luzurus-wide-trouser-thigh'
    lower.name = 'luzurus-wide-trouser-calf'
    ;(upper.children[1] as Mesh).material = glow(profile.trousers, 1)
    ;(lower.children[1] as Mesh).material = glow(profile.trousers, 1)
    for (const [joint, isLower] of [
      [limbs.legs[i], false],
      [limbs.knees[i], true],
    ] as const) {
      const creases = new THREE.Mesh(
        geometry(THREE, `manga:luzurus-trouser-folds:${isLower}`, () => folds(build, isLower)),
        glow(0x9a8d75, 1),
      )
      creases.name = 'luzurus-trouser-folds'
      joint.add(creases)
    }
    for (const segment of [limbs.arms[i].children[0], limbs.elbows[i].children[0]]) {
      segment.scale.multiply(new THREE.Vector3(1.7, 1, 1.7))
      ;(segment.children[1] as Mesh).material = glow(profile.shirt, 1)
    }
    ;(limbs.arms[i].children[2].children[1] as Mesh).material = glow(profile.shirt, 1)
    const cuff = new THREE.Mesh(
      geometry(
        THREE,
        'manga:luzurus-loose-sleeve-cuff',
        () => new THREE.CylinderGeometry(0.071, 0.065, 0.045, 24),
      ),
      glow(profile.shirt, 1),
    )
    cuff.name = 'luzurus-loose-sleeve-cuff'
    cuff.position.y = -0.264
    limbs.elbows[i].add(cuff)
  }
  addSlippers(build, limbs)
}
