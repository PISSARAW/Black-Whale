import type { HumanTrunk, HumanTrunkBuild } from './humanTrunk'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { kurapikaSurfacePanel, kurapikaShoeGeometry, type Point3 } from './kurapikaGeometry'
import { mergeHumanDetails } from './humanDetailGeometry'

export function buildKurapikaTrunk(build: HumanTrunkBuild): HumanTrunk {
  const { THREE, geometry, outlined, figure, materials } = build
  const pelvis = outlined({
    THREE,
    geometry: geometry(THREE, 'kurapika:pelvis', () =>
      new THREE.CylinderGeometry(0.13, 0.12, 0.18, 20).scale(1, 1, 0.84),
    ),
    material: materials.cloth,
    ink: materials.ink,
    scale: 1.025,
  })
  pelvis.position.y = 0.77
  figure.add(pelvis)
  const torso = outlined({
    THREE,
    geometry: geometry(THREE, 'kurapika:fitted-jacket', () =>
      new THREE.LatheGeometry(
        JACKET_SECTIONS.map(([x, y]) => new THREE.Vector2(x, y - 1.12)),
        24,
      ).scale(1, 1, 0.68),
    ),
    material: materials.cloth,
    ink: materials.ink,
    scale: 1.028,
  })
  torso.name = 'torso'
  torso.position.y = 1.12
  figure.add(torso)
  const neck = new THREE.Mesh(
    geometry(THREE, 'kurapika:neck', () => new THREE.CylinderGeometry(0.033, 0.04, 0.104, 16)),
    materials.skin,
  )
  neck.name = 'kurapika-neck'
  neck.position.y = 1.48
  figure.add(neck)
  return { pelvis, torso, width: 0.86, shoulder: 0.18 }
}

/** The scan's white collar and narrow black tie sit inside a sharply cut black jacket. */
export function addKurapikaSuit(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials } = build
  const panel = (key: string, points: readonly Point3[], material = materials.cloth) => {
    const mesh = new THREE.Mesh(
      geometry(THREE, `kurapika:suit:${key}`, () =>
        kurapikaSurfacePanel(THREE, {
          points,
          depth: (x, y) => jacketSurface(x, y) + panelLift(key),
        }).translate(0, -1.12, 0),
      ),
      material,
    )
    mesh.position.y = 1.12
    mesh.name = `kurapika-${key}`
    figure.add(mesh)
    return mesh
  }
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'kurapika:collar-band',
      () => new THREE.CylinderGeometry(0.041, 0.059, 0.055, 20, 1, true),
    ),
    materials.shirt,
  )
  collar.position.y = 1.486
  collar.name = 'kurapika-collar-band'
  figure.add(collar)
  panel(
    'shirt',
    [
      [-0.052, 1.499, 0.064],
      [-0.064, 1.394, 0.128],
      [0, 1.28, 0.115],
      [0.064, 1.394, 0.128],
      [0.052, 1.499, 0.064],
    ],
    materials.shirt,
  )
  panel(
    'collar-left',
    [
      [-0.061, 1.475, 0.073],
      [-0.005, 1.465, 0.126],
      [-0.033, 1.385, 0.144],
      [-0.077, 1.409, 0.126],
    ],
    materials.shirt,
  )
  panel(
    'collar-right',
    [
      [0.061, 1.475, 0.073],
      [0.005, 1.465, 0.126],
      [0.033, 1.385, 0.144],
      [0.077, 1.409, 0.126],
    ],
    materials.shirt,
  )
  panel(
    'tie-knot',
    [
      [0, 1.465, 0.13],
      [-0.013, 1.442, 0.138],
      [0, 1.422, 0.143],
      [0.013, 1.442, 0.138],
    ],
    materials.dark,
  )
  panel(
    'tie',
    [
      [0, 1.425, 0.144],
      [-0.018, 1.31, 0.127],
      [0, 1.26, 0.119],
      [0.018, 1.31, 0.127],
    ],
    materials.dark,
  )
  for (const side of [-1, 1]) {
    panel(`lapel-${side}`, [
      [side * 0.073, 1.468, 0.065],
      [side * 0.15, 1.375, 0.112],
      [side * 0.11, 1.333, 0.12],
      [side * 0.13, 1.315, 0.115],
      [0, 1.16, 0.105],
      [side * 0.051, 1.354, 0.145],
    ])
  }
  const seams = new THREE.Mesh(
    geometry(THREE, 'kurapika:suit-seams', () =>
      mergeHumanDetails([
        new THREE.BoxGeometry(0.035, 0.0025, 0.003).translate(-0.063, 1.316, 0.119),
        new THREE.BoxGeometry(0.065, 0.003, 0.003).translate(-0.077, 0.947, 0.072),
        new THREE.BoxGeometry(0.065, 0.003, 0.003).translate(0.077, 0.947, 0.072),
        new THREE.SphereGeometry(0.006, 8, 6).scale(1, 1, 0.4).translate(0.012, 1.103, 0.091),
      ]).translate(0, -1.12, 0),
    ),
    materials.dark,
  )
  seams.name = 'garment-seams'
  seams.position.y = 1.12
  figure.add(seams)
}

/** Refine visible masses, preserving all joint positions and their child order. */
export function shapeKurapikaLimbs(build: HumanLimbsBuild, limbs: HumanLimbs): void {
  if (build.profile.likeness !== 'kurapika') return
  for (const [index, arm] of limbs.arms.entries()) {
    arm.children[0].scale.multiply(new build.THREE.Vector3(0.84, 1, 0.84))
    arm.children[2].scale.multiply(new build.THREE.Vector3(0.72, 0.85, 0.72))
    const elbow = limbs.elbows[index]
    elbow.children[0].scale.multiply(new build.THREE.Vector3(0.84, 1, 0.84))
    elbow.getObjectByName('sleeve-cuff')!.scale.setScalar(0.8)
    limbs.legs[index].position.x *= 0.84
    limbs.legs[index].children[0].scale.x *= 0.88
    limbs.knees[index].children[0].scale.x *= 0.88
    const shoe = limbs.knees[index].children[1]
    const shape = build.geometry(build.THREE, 'kurapika:pointed-shoes', () =>
      kurapikaShoeGeometry(build.THREE),
    )
    shoe.children.slice(0, 2).forEach((child) => {
      ;(child as import('three').Mesh).geometry = shape
    })
    shoe.getObjectByName('shoe-sole-and-toecap')!.visible = false
  }
}

const JACKET_SECTIONS = [
  [0, 0.73],
  [0.142, 0.73],
  [0.14, 0.88],
  [0.126, 1],
  [0.128, 1.16],
  [0.159, 1.29],
  [0.191, 1.35],
  [0.176, 1.395],
  [0.087, 1.475],
  [0.061, 1.49],
  [0, 1.49],
] as const

function jacketSurface(x: number, y: number): number {
  y = Math.max(0.731, Math.min(1.4899, y))
  const next = JACKET_SECTIONS.findIndex(([, height]) => height >= y)
  const upper = JACKET_SECTIONS[Math.max(1, next)]
  const lower = JACKET_SECTIONS[Math.max(0, next - 1)]
  const t = (y - lower[1]) / Math.max(0.001, upper[1] - lower[1])
  const radius = lower[0] + (upper[0] - lower[0]) * t
  return Math.sqrt(Math.max(0, radius ** 2 - x ** 2)) * 0.68
}

function panelLift(key: string): number {
  if (key.startsWith('tie')) return 0.011
  return key.startsWith('collar') ? 0.007 : 0.003
}
