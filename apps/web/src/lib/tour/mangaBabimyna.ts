import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaBodyShape, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addBabimynaFadeAndEarpiece(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  const curls = new THREE.Mesh(
    geometry(THREE, 'manga:babimyna-curly-fade-top', () => {
      const parts: BufferGeometry[] = []
      for (let row = 0; row < 3; row++)
        for (let column = -4; column <= 4; column++) {
          const x = column * 0.039 + (row % 2 ? 0.019 : 0)
          if (Math.abs(x) > 0.165) continue
          parts.push(
            new THREE.SphereGeometry(0.046, 9, 6)
              .scale(1.05, 0.66, 0.86)
              .translate(x, 0.205 + row * 0.035 - Math.abs(column) * 0.003, 0.025 - row * 0.028),
          )
        }
      return mergeHumanDetails(parts)
    }),
    materials.hairInk,
  )
  curls.name = 'babimyna-fair-curly-fade-top'
  head.add(curls)

  const fade = new THREE.Mesh(
    geometry(THREE, 'manga:babimyna-faded-sides', () =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          new THREE.PlaneGeometry(0.055, 0.135)
            .rotateY(side * -0.45)
            .translate(side * 0.17, 0.095, 0.015),
        ),
      ),
    ),
    glow(0x8e7b58, 0.58),
  )
  fade.name = 'babimyna-faded-hair-sides'
  head.add(fade)

  const earpiece = new THREE.Group()
  earpiece.name = 'babimyna-left-earpiece'
  earpiece.position.set(0.204, -0.026, 0.018)
  const receiver = new THREE.Mesh(
    geometry(
      THREE,
      'manga:babimyna-earpiece-receiver',
      () => new THREE.CapsuleGeometry(0.01, 0.034, 5, 10),
    ),
    materials.ink,
  )
  receiver.rotation.z = -0.12
  const hook = new THREE.Mesh(
    geometry(
      THREE,
      'manga:babimyna-earpiece-hook',
      () => new THREE.TorusGeometry(0.026, 0.0035, 6, 20, Math.PI * 1.35),
    ),
    materials.ink,
  )
  hook.position.set(-0.012, 0.013, -0.003)
  hook.rotation.z = 0.4
  earpiece.add(receiver, hook)
  head.add(earpiece)
}

export function addBabimynaKakinUniform(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials, profile } = build
  const { chest, waist, depth } = mangaBodyShape(profile)
  mangaPanel(build, {
    name: 'babimyna-uniform-zipper',
    points: [
      [-0.0045, 1.49],
      [-0.0045, 0.82],
      [0.0045, 0.82],
      [0.0045, 1.49],
    ],
    material: materials.dark,
    lift: 0.012,
  })
  const seams = new THREE.Mesh(
    geometry(THREE, 'manga:babimyna-padded-jacket-seams', () =>
      mergeHumanDetails([
        new THREE.TorusGeometry(waist * 1.05, 0.0035, 6, 40)
          .rotateX(Math.PI / 2)
          .scale(1, 1, depth / chest)
          .translate(0, -0.03, 0),
        new THREE.TorusGeometry(waist, 0.0035, 6, 40)
          .rotateX(Math.PI / 2)
          .scale(1, 1, depth / chest)
          .translate(0, -0.21, 0),
      ]),
    ),
    materials.accent,
  )
  seams.name = 'babimyna-padded-jacket-seams'
  seams.position.y = 1.15
  figure.add(seams)
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:babimyna-standing-collar',
      () => new THREE.CylinderGeometry(chest * 0.35, chest * 0.46, 0.13, 28, 1, true),
    ),
    materials.cloth,
  )
  collar.name = 'babimyna-standing-collar'
  collar.position.y = 1.48
  figure.add(collar)
}

export function addBabimynaCombatBoots(build: HumanLimbsBuild, limbs: HumanLimbs): void {
  const { THREE, geometry, glow } = build
  const boot = geometry(THREE, 'manga:babimyna-combat-boot', () =>
    new THREE.CapsuleGeometry(0.046, 0.12, 6, 16)
      .rotateX(Math.PI / 2)
      .scale(1.3, 1, 1)
      .translate(0, 0, 0.024),
  )
  for (const knee of limbs.knees) {
    const shoe = knee.children[1]
    shoe.children.slice(0, 2).forEach((part) => {
      ;(part as Mesh).geometry = boot
      ;(part as Mesh).material = glow(0x202328, 1)
    })
    const shaft = new THREE.Mesh(
      geometry(THREE, 'manga:babimyna-combat-boot-shaft', () =>
        new THREE.CylinderGeometry(0.057, 0.052, 0.18, 20).translate(0, -0.39, 0.004),
      ),
      glow(0x202328, 1),
    )
    shaft.name = 'babimyna-combat-boot-shaft'
    knee.add(shaft)
  }
}
