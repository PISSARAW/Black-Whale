import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { PAIN, painPart, painMerge, painCurve, type PainKit } from './painPackerParts'
import { buildPainPackerHood } from './painPackerHood'
import { buildPainPackerChest, buildPainPackerSkirt } from './painPackerCoat'

export const PAIN_PACKER_JOINTS = [
  'pain-packer-hood',
  'pain-packer-chest',
  'pain-packer-coat',
  'pain-packer-arm-left',
  'pain-packer-arm-right',
  'pain-packer-elbow-left',
  'pain-packer-elbow-right',
] as const

function buildSleeve(kit: PainKit, side: number) {
  const { THREE } = kit
  const name = side < 0 ? 'left' : 'right'
  const arm = new THREE.Group()
  arm.name = `pain-packer-arm-${name}`
  arm.position.set(side * 0.22, -0.36, 0)
  painPart(kit, arm, {
    name: 'pain-packer-upper-sleeve',
    colour: PAIN.red,
    make: () => new THREE.CylinderGeometry(0.067, 0.055, 0.31, 20).translate(0, -0.15, 0),
  })
  painPart(kit, arm, {
    name: 'pain-packer-rounded-shoulder',
    colour: PAIN.red,
    make: () =>
      new THREE.SphereGeometry(1, 20, 14).scale(0.075, 0.06, 0.068).translate(0, -0.012, 0),
  })
  const elbow = new THREE.Group()
  elbow.name = `pain-packer-elbow-${name}`
  elbow.position.y = -0.32
  arm.add(elbow)
  painPart(kit, elbow, {
    name: 'pain-packer-forearm-sleeve',
    colour: PAIN.red,
    make: () => new THREE.CylinderGeometry(0.058, 0.048, 0.26, 20).translate(0, -0.13, 0),
  })
  painPart(kit, elbow, {
    name: 'pain-packer-burgundy-glove',
    colour: PAIN.red,
    make: () =>
      painMerge([
        new THREE.SphereGeometry(1, 20, 14).scale(0.061, 0.073, 0.054).translate(0, -0.305, 0.005),
        new THREE.SphereGeometry(1, 16, 10)
          .scale(0.025, 0.044, 0.025)
          .rotateZ(-0.35)
          .translate(0.045, -0.285, 0.024),
      ]),
  })
  painPart(kit, arm, {
    name: 'pain-packer-upper-arm-bands',
    colour: PAIN.black,
    make: () =>
      painMerge(
        [0.17, 0.29].map((y) =>
          new THREE.CylinderGeometry(0.061, 0.061, 0.025, 20, 1, true).translate(0, -y, 0),
        ),
      ),
  })
  painPart(kit, elbow, {
    name: 'pain-packer-forearm-bands',
    colour: PAIN.black,
    make: () =>
      painMerge(
        [0.11, 0.23].map((y) =>
          new THREE.CylinderGeometry(0.057, 0.057, 0.023, 20, 1, true).translate(0, -y, 0),
        ),
      ),
  })
  painPart(kit, arm, {
    name: 'pain-packer-upper-arm-buckles',
    colour: PAIN.steel,
    make: () =>
      painMerge(
        [0.17, 0.29].map((y) =>
          new THREE.TorusGeometry(0.01, 0.002, 5, 16).translate(0, -y, 0.062),
        ),
      ),
  })
  painPart(kit, elbow, {
    name: 'pain-packer-forearm-buckles',
    colour: PAIN.steel,
    make: () =>
      painMerge(
        [0.11, 0.23].map((y) =>
          new THREE.TorusGeometry(0.01, 0.002, 5, 16).translate(0, -y, 0.058),
        ),
      ),
  })
  painPart(kit, elbow, {
    name: 'pain-packer-sleeve-creases',
    colour: 0x8b3f56,
    make: () =>
      painMerge(
        [0, 1, 2].map((i) =>
          painCurve(
            kit,
            [
              [-0.04, -0.03 - i * 0.08, 0.038],
              [0.02, -0.055 - i * 0.08, 0.054],
              [-0.025, -0.077 - i * 0.08, 0.045],
            ],
            0.002,
          ),
        ),
      ),
  })
  return arm
}

/** One reference outfit for the visit, Nendex and Fighting; the hood is the local origin. */
export function buildPainPackerModel(seen: Apparition, context: BasicApparitionContext) {
  const { THREE, root } = context
  const outfit = new THREE.Group()
  outfit.name = 'pain-packer-reference-outfit'
  outfit.scale.setScalar(seen.size)
  const hood = new THREE.Group(),
    chest = new THREE.Group(),
    skirt = new THREE.Group()
  hood.name = 'pain-packer-hood'
  chest.name = 'pain-packer-chest'
  skirt.name = 'pain-packer-coat'
  chest.position.y = -0.34
  skirt.position.y = -0.82
  buildPainPackerHood(context, hood)
  buildPainPackerChest(context, chest)
  buildPainPackerSkirt(context, skirt)
  outfit.add(hood, chest, skirt, buildSleeve(context, -1), buildSleeve(context, 1))
  root.add(outfit)
  return root
}
