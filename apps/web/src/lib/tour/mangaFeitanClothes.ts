import type { Mesh } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaBodyShape, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addFeitanCoat(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  const { waist } = mangaBodyShape(profile)
  const coat = new THREE.Mesh(
    geometry(THREE, 'manga:feitan-long-coat', () =>
      new THREE.LatheGeometry(
        [
          // Stopped under the knee and flared in an A, as the reference model
          // wears it: the grey trousers and the laced boots show below.
          new THREE.Vector2(waist * 2.25, 0.25),
          new THREE.Vector2(waist * 2.15, 0.33),
          new THREE.Vector2(waist * 1.62, 0.58),
          new THREE.Vector2(waist * 1.06, 0.91),
        ],
        40,
      ).scale(1, 1, 0.82),
    ),
    materials.cloth,
  )
  coat.position.y = 0.01
  coat.name = 'manga-long-coat'
  figure.add(coat)
  const folds = new THREE.Mesh(
    geometry(THREE, 'manga:feitan-coat-folds', () => {
      const parts = [-1, 1].map((side) => {
        const shape = new THREE.Shape()
        shape.moveTo(side * 0.08, 0.88)
        shape.lineTo(side * 0.14, 0.55)
        shape.lineTo(side * 0.16, 0.265)
        shape.lineTo(side * 0.128, 0.42)
        shape.lineTo(side * 0.112, 0.6)
        shape.closePath()
        return new THREE.ShapeGeometry(shape).translate(0, 0, 0.151)
      })
      return mergeHumanDetails(parts)
    }),
    materials.dark.clone(),
  )
  ;(folds.material as import('three').MeshBasicMaterial).color.setHex(0x394654)
  folds.name = 'feitan-coat-folds'
  figure.add(folds)
  for (const side of [-1, 1])
    mangaPanel(build, {
      name: `feitan-folded-shoulder-${side}`,
      points: [
        [side * 0.12, 1.39],
        [side * 0.184, 1.36],
        [side * 0.15, 1.31],
        [side * 0.134, 1.36],
      ],
      material: materials.dark,
    })
}

/** Laced combat boots to mid-calf, black, on a heavy sole: the reference model's. */
const BOOT = 0x202124
const LACE = 0x8d9096

export function addFeitanBoots(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness !== 'feitan-portor') return
  const { THREE, geometry, glow } = build
  const shape = geometry(THREE, 'manga:feitan-combat-boot', () =>
    new THREE.CapsuleGeometry(0.042, 0.11, 6, 16)
      .rotateX(Math.PI / 2)
      .scale(1.22, 1, 1)
      .translate(0, 0, 0.022),
  )
  for (const knee of limbs.knees) {
    const shoe = knee.children[1]
    shoe.children.slice(0, 2).forEach((part) => {
      ;(part as Mesh).geometry = shape
    })
    ;(shoe.children[1] as Mesh).material = glow(BOOT, 1)
    addBootShaft(build, knee)
  }
}

function addBootShaft(build: HumanLimbsBuild, knee: import('three').Group) {
  const { THREE, geometry, glow } = build
  const shaft = new THREE.Mesh(
    geometry(THREE, 'manga:feitan-boot-shaft', () =>
      new THREE.CylinderGeometry(0.054, 0.05, 0.21, 20).translate(0, -0.405, 0.004),
    ),
    glow(BOOT, 1),
  )
  shaft.name = 'feitan-boot-shaft'
  knee.add(shaft)
  // The old soft-boot folds become the padded collar at the top of the shaft.
  const collar = new THREE.Mesh(
    geometry(THREE, 'manga:feitan-boot-wrinkles', () =>
      mergeHumanDetails(
        [0, 1].map((i) =>
          new THREE.TorusGeometry(0.056, 0.007, 6, 24)
            .rotateX(Math.PI / 2)
            .translate(0, -0.306 - i * 0.014, 0.004),
        ),
      ),
    ),
    glow(BOOT, 1),
  )
  collar.name = 'feitan-boot-wrinkles'
  knee.add(collar)
  const laces = new THREE.Mesh(
    geometry(THREE, 'manga:feitan-boot-laces', () =>
      mergeHumanDetails(
        [0, 1, 2, 3, 4, 5].flatMap((i) =>
          [-1, 1].map((side) =>
            new THREE.PlaneGeometry(0.004, 0.04)
              .rotateZ(side * 1.05)
              .translate(0, -0.475 + i * 0.03, 0.058),
          ),
        ),
      ),
    ),
    glow(LACE, 1),
  )
  laces.name = 'feitan-boot-laces'
  knee.add(laces)
}
