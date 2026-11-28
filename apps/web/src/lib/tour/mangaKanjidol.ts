import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addKanjidolRoundFace(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const oldEye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')
    const oldBrow = head.getObjectByName(side < 0 ? 'face-brow-left' : 'face-brow-right')
    if (oldEye) oldEye.visible = false
    if (oldBrow) oldBrow.visible = false

    const eye = new THREE.Group()
    eye.name = 'kanjidol-small-eye'
    eye.position.set(side * 0.07, 0.014, 0.184)
    const white = new THREE.Mesh(
      geometry(THREE, 'manga:kanjidol-small-eye-white', () =>
        new THREE.CircleGeometry(0.018, 18).scale(1.35, 0.72, 1),
      ),
      glow(0xfffcf5, 1),
    )
    const outline = new THREE.Mesh(
      geometry(THREE, 'manga:kanjidol-small-eye-outline', () =>
        new THREE.TorusGeometry(0.018, 0.0023, 6, 20).scale(1.35, 0.72, 1),
      ),
      materials.ink,
    )
    outline.position.z = 0.001
    const pupil = new THREE.Mesh(
      geometry(THREE, 'manga:kanjidol-small-eye-pupil', () => new THREE.CircleGeometry(0.006, 14)),
      materials.ink,
    )
    pupil.position.z = 0.002
    eye.add(white, outline, pupil)
    head.add(eye)

    const brow = new THREE.Mesh(
      geometry(THREE, 'manga:kanjidol-round-brow', () =>
        new THREE.SphereGeometry(1, 14, 8).scale(0.028, 0.014, 0.005),
      ),
      materials.hairInk,
    )
    brow.name = 'kanjidol-round-dark-brow'
    brow.position.set(side * 0.078, 0.087, 0.167)
    brow.rotation.z = side * -0.35
    head.add(brow)
  }

  const facialHair = new THREE.Mesh(
    geometry(THREE, 'manga:kanjidol-moustache-and-beard', () => {
      const parts: BufferGeometry[] = [
        new THREE.ConeGeometry(0.012, 0.052, 8).rotateZ(-1.34).translate(-0.027, -0.078, 0),
        new THREE.ConeGeometry(0.012, 0.052, 8).rotateZ(1.34).translate(0.027, -0.078, 0),
      ]
      for (let strand = -3; strand <= 3; strand++)
        parts.push(
          new THREE.ConeGeometry(0.006, 0.038 - Math.abs(strand) * 0.003, 7)
            .rotateZ(strand * -0.055)
            .translate(strand * 0.009, -0.157 - Math.abs(strand) * 0.002, 0),
        )
      return mergeHumanDetails(parts)
    }),
    materials.hairInk,
  )
  facialHair.name = 'kanjidol-dark-moustache-and-chin-beard'
  facialHair.position.z = 0.182
  head.add(facialHair)

  const cheeks = new THREE.Mesh(
    geometry(THREE, 'manga:kanjidol-round-cheek-contours', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1])
        parts.push(
          new THREE.TorusGeometry(0.052, 0.0024, 6, 18, Math.PI * 0.58)
            .rotateZ(side < 0 ? -0.9 : Math.PI + 0.9)
            .translate(side * 0.125, -0.064, 0.172),
        )
      return mergeHumanDetails(parts)
    }),
    glow(0x73564c, 0.68),
  )
  cheeks.name = 'kanjidol-round-cheek-contours'
  head.add(cheeks)
}

export function addKanjidolCombatBoots(build: HumanLimbsBuild, limbs: HumanLimbs): void {
  const { THREE, geometry, glow } = build
  const boot = geometry(THREE, 'manga:kanjidol-combat-boot', () =>
    new THREE.CapsuleGeometry(0.052, 0.13, 6, 16)
      .rotateX(Math.PI / 2)
      .scale(1.4, 1, 1)
      .translate(0, 0, 0.024),
  )
  for (const knee of limbs.knees) {
    const shoe = knee.children[1]
    shoe.children.slice(0, 2).forEach((part) => {
      ;(part as Mesh).geometry = boot
      ;(part as Mesh).material = glow(0x1b1e24, 1)
    })
    const shaft = new THREE.Mesh(
      geometry(THREE, 'manga:kanjidol-combat-boot-shaft', () =>
        new THREE.CylinderGeometry(0.064, 0.057, 0.2, 20).translate(0, -0.39, 0.004),
      ),
      glow(0x1b1e24, 1),
    )
    shaft.name = 'kanjidol-combat-boot-shaft'
    knee.add(shaft)
  }
}
