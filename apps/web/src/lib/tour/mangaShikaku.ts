import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaBodyShape, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'
import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'

export function mangaShikakuBrush(kit: MangaHairKit): void {
  kit.parts.push(mangaScalpGeometry(kit))
  kit.parts.push(
    new kit.THREE.CylinderGeometry(0.176, 0.184, 0.06, 4)
      .rotateY(Math.PI / 4)
      .scale(1, 1, 0.88)
      .translate(0, 0.17, -0.005),
  )
  for (let i = -8; i <= 8; i++) {
    const x = i * 0.019
    kit.lock({
      width: 0.018,
      depth: 0.011,
      points: [
        [x, 0.12, 0.145],
        [x * 1.02, 0.16, 0.13],
        [x * 1.03, 0.2 + (Math.abs(i) % 2) * 0.006, 0.055],
        [x * 1.04, 0.22 + (Math.abs(i) % 3) * 0.005, -0.02],
      ],
    })
  }
  kit.lock({
    width: 0.027,
    depth: 0.012,
    points: [
      [0.02, 0.215, 0.045],
      [0.038, 0.175, 0.132],
      [0.026, 0.115, 0.17],
      [0.005, 0.045, 0.176],
    ],
  })
}

export function addShikakuEarpiece(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials } = build
  const earpiece = new THREE.Group()
  earpiece.name = 'shikaku-left-earpiece'
  earpiece.position.set(0.204, -0.026, 0.018)
  const receiver = new THREE.Mesh(
    geometry(
      THREE,
      'manga:shikaku-earpiece-receiver',
      () => new THREE.CapsuleGeometry(0.01, 0.034, 5, 10),
    ),
    materials.ink,
  )
  receiver.rotation.z = -0.12
  const hook = new THREE.Mesh(
    geometry(
      THREE,
      'manga:shikaku-earpiece-hook',
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
  const nose = new THREE.Mesh(
    geometry(THREE, 'manga:shikaku-long-angular-nose', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.004, 0.077).rotateZ(-0.12).translate(-0.014, 0.003, 0),
        new THREE.PlaneGeometry(0.004, 0.077).rotateZ(0.12).translate(0.014, 0.003, 0),
        new THREE.PlaneGeometry(0.03, 0.004).translate(0, -0.036, 0),
      ]),
    ),
    materials.ink,
  )
  nose.name = 'shikaku-long-angular-nose'
  nose.position.set(0, -0.03, 0.181)
  head.add(nose)
  const mouth = new THREE.Mesh(
    geometry(THREE, 'manga:shikaku-severe-mouth', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.057, 0.004).rotateZ(-0.11).translate(-0.028, 0, 0),
        new THREE.PlaneGeometry(0.057, 0.004).rotateZ(0.11).translate(0.028, 0, 0),
      ]),
    ),
    materials.ink,
  )
  mouth.name = 'shikaku-severe-mouth'
  mouth.position.set(0, -0.128, 0.176)
  head.add(mouth)
}

export function addShikakuUniform(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials, profile } = build
  const { chest } = mangaBodyShape(profile)
  mangaPanel(build, {
    name: 'shikaku-uniform-zipper',
    points: [
      [-0.005, 1.49],
      [-0.005, 0.82],
      [0.005, 0.82],
      [0.005, 1.49],
    ],
    material: materials.dark,
    lift: 0.012,
  })
  const collar = new THREE.Mesh(
    geometry(
      THREE,
      'manga:shikaku-standing-collar',
      () => new THREE.CylinderGeometry(chest * 0.35, chest * 0.46, 0.13, 28, 1, true),
    ),
    materials.cloth,
  )
  collar.name = 'shikaku-standing-collar'
  collar.position.y = 1.48
  figure.add(collar)
  mangaPanel(build, {
    name: 'shikaku-uniform-waist-seam',
    points: [
      [-chest * 0.72, 0.92],
      [-chest * 0.72, 0.906],
      [chest * 0.72, 0.906],
      [chest * 0.72, 0.92],
    ],
    material: materials.dark,
    lift: 0.009,
  })
}

export function addShikakuCombatBoots(build: HumanLimbsBuild, limbs: HumanLimbs): void {
  const { THREE, geometry, glow } = build
  const boot = geometry(THREE, 'manga:shikaku-combat-boot', () =>
    new THREE.CapsuleGeometry(0.046, 0.12, 6, 16)
      .rotateX(Math.PI / 2)
      .scale(1.3, 1, 1)
      .translate(0, 0, 0.024),
  )
  for (const knee of limbs.knees) {
    const shoe = knee.children[1]
    shoe.children.slice(0, 2).forEach((part) => {
      ;(part as Mesh).geometry = boot
      ;(part as Mesh).material = glow(0x242629, 1)
    })
    const shaft = new THREE.Mesh(
      geometry(THREE, 'manga:shikaku-combat-boot-shaft', () =>
        new THREE.CylinderGeometry(0.057, 0.052, 0.18, 20).translate(0, -0.39, 0.004),
      ),
      glow(0x242629, 1),
    )
    shaft.name = 'shikaku-combat-boot-shaft'
    knee.add(shaft)
  }
}
