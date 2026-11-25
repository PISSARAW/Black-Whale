import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaBodyShape, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addVincentShavenFaceAndEarpiece(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  const earpiece = new THREE.Group()
  earpiece.name = 'vincent-left-earpiece'
  earpiece.position.set(0.204, -0.026, 0.018)
  const receiver = new THREE.Mesh(
    geometry(
      THREE,
      'manga:vincent-earpiece-receiver',
      () => new THREE.CapsuleGeometry(0.01, 0.034, 5, 10),
    ),
    materials.ink,
  )
  receiver.rotation.z = -0.12
  const hook = new THREE.Mesh(
    geometry(
      THREE,
      'manga:vincent-earpiece-hook',
      () => new THREE.TorusGeometry(0.026, 0.0035, 6, 20, Math.PI * 1.35),
    ),
    materials.ink,
  )
  hook.position.set(-0.012, 0.013, -0.003)
  hook.rotation.z = 0.4
  earpiece.add(receiver, hook)
  head.add(earpiece)

  const oldNose = head.getObjectByName('face-relief')
  const oldMouth = head.getObjectByName('face-mouth')
  if (oldNose) oldNose.visible = false
  if (oldMouth) oldMouth.visible = false
  const features = new THREE.Mesh(
    geometry(THREE, 'manga:vincent-long-nose-and-grin', () => {
      const parts: BufferGeometry[] = [
        new THREE.PlaneGeometry(0.004, 0.105).rotateZ(-0.08).translate(-0.018, -0.006, 0),
        new THREE.PlaneGeometry(0.004, 0.105).rotateZ(0.08).translate(0.018, -0.006, 0),
        new THREE.PlaneGeometry(0.043, 0.004).translate(0, -0.059, 0),
        new THREE.PlaneGeometry(0.071, 0.004).rotateZ(-0.13).translate(-0.034, -0.126, 0),
        new THREE.PlaneGeometry(0.071, 0.004).rotateZ(0.13).translate(0.034, -0.126, 0),
      ]
      for (const side of [-1, 1])
        parts.push(
          new THREE.PlaneGeometry(0.003, 0.075)
            .rotateZ(side * 0.28)
            .translate(side * 0.112, -0.07, -0.004),
        )
      return mergeHumanDetails(parts)
    }),
    materials.ink,
  )
  features.name = 'vincent-long-nose-and-grin'
  features.position.set(0, -0.022, 0.184)
  head.add(features)

  const scalpShade = new THREE.Mesh(
    geometry(THREE, 'manga:vincent-shaven-scalp-shadow', () =>
      new THREE.SphereGeometry(0.176, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.42).scale(
        1,
        0.86,
        0.92,
      ),
    ),
    glow(0x8c776a, 0.24),
  )
  scalpShade.name = 'vincent-shaven-scalp-shadow'
  scalpShade.position.set(0, 0.125, -0.015)
  head.add(scalpShade)
}

export function addVincentKakinUniform(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials, profile } = build
  const { chest, waist, depth } = mangaBodyShape(profile)
  mangaPanel(build, {
    name: 'vincent-uniform-zipper',
    points: [
      [-0.005, 1.49],
      [-0.005, 0.81],
      [0.005, 0.81],
      [0.005, 1.49],
    ],
    material: materials.dark,
    lift: 0.012,
  })
  const seams = new THREE.Mesh(
    geometry(THREE, 'manga:vincent-padded-jacket-seams', () =>
      mergeHumanDetails([
        new THREE.TorusGeometry(waist * 1.08, 0.0035, 6, 44)
          .rotateX(Math.PI / 2)
          .scale(1, 1, depth / chest)
          .translate(0, 0.04, 0),
        new THREE.TorusGeometry(waist * 1.03, 0.0035, 6, 44)
          .rotateX(Math.PI / 2)
          .scale(1, 1, depth / chest)
          .translate(0, -0.16, 0),
      ]),
    ),
    materials.accent,
  )
  seams.name = 'vincent-padded-jacket-seams'
  seams.position.y = 1.12
  figure.add(seams)
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:vincent-standing-collar',
      () => new THREE.CylinderGeometry(chest * 0.36, chest * 0.48, 0.14, 28, 1, true),
    ),
    materials.cloth,
  )
  collar.name = 'vincent-standing-collar'
  collar.position.y = 1.475
  figure.add(collar)
}

export function addVincentCombatBoots(build: HumanLimbsBuild, limbs: HumanLimbs): void {
  const { THREE, geometry, glow } = build
  const boot = geometry(THREE, 'manga:vincent-combat-boot', () =>
    new THREE.CapsuleGeometry(0.05, 0.13, 6, 16)
      .rotateX(Math.PI / 2)
      .scale(1.35, 1, 1)
      .translate(0, 0, 0.024),
  )
  for (const knee of limbs.knees) {
    const shoe = knee.children[1]
    shoe.children.slice(0, 2).forEach((part) => {
      ;(part as Mesh).geometry = boot
      ;(part as Mesh).material = glow(0x202328, 1)
    })
    const shaft = new THREE.Mesh(
      geometry(THREE, 'manga:vincent-combat-boot-shaft', () =>
        new THREE.CylinderGeometry(0.061, 0.055, 0.19, 20).translate(0, -0.385, 0.004),
      ),
      glow(0x202328, 1),
    )
    shaft.name = 'vincent-combat-boot-shaft'
    knee.add(shaft)
  }
}
