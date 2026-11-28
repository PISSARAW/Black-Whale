import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mangaBodyShape, mangaPanel } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addKakinAnnouncerCatFace(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  for (const side of [-1, 1]) {
    const oldEye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')
    if (oldEye) oldEye.visible = false
    const eye = new THREE.Group()
    eye.name = 'kakin-announcer-cat-eye'
    eye.position.set(side * 0.068, 0.015, 0.184)
    const white = new THREE.Mesh(
      geometry(THREE, 'manga:kakin-announcer-cat-eye-white', () =>
        new THREE.CircleGeometry(0.027, 20).scale(0.72, 1.2, 1),
      ),
      glow(0xfffcf5, 1),
    )
    const outline = new THREE.Mesh(
      geometry(THREE, 'manga:kakin-announcer-cat-eye-outline', () =>
        new THREE.TorusGeometry(0.027, 0.0024, 6, 22).scale(0.72, 1.2, 1),
      ),
      materials.ink,
    )
    outline.position.z = 0.001
    const pupil = new THREE.Mesh(
      geometry(
        THREE,
        'manga:kakin-announcer-slit-pupil',
        () => new THREE.PlaneGeometry(0.004, 0.037),
      ),
      materials.ink,
    )
    pupil.position.z = 0.002
    eye.add(white, outline, pupil)
    head.add(eye)

    const ear = new THREE.Mesh(
      geometry(THREE, 'manga:kakin-announcer-cat-ear', () =>
        new THREE.ConeGeometry(0.052, 0.13, 3).rotateZ(side * -0.08),
      ),
      materials.hairInk,
    )
    ear.name = 'kakin-announcer-cat-ear'
    ear.position.set(side * 0.115, 0.235, 0.005)
    ear.rotation.z = side * -0.16
    head.add(ear)
  }
}

export function addKakinAnnouncerPatternedDress(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials, profile } = build
  const { chest, waist } = mangaBodyShape(profile)
  const skirt = new THREE.Mesh(
    geometry(THREE, 'manga:kakin-announcer-patterned-skirt', () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(waist * 1.65, 0.28),
          new THREE.Vector2(waist * 1.5, 0.56),
          new THREE.Vector2(waist * 1.22, 0.88),
          new THREE.Vector2(waist * 1.07, 1.03),
        ],
        36,
      ).scale(1, 1, 0.78),
    ),
    materials.dark,
  )
  skirt.name = 'kakin-announcer-long-patterned-dress'
  figure.add(skirt)

  mangaPanel(build, {
    name: 'kakin-announcer-fitted-bodice',
    points: [
      [-chest * 0.68, 1.42],
      [-waist * 1.03, 1.03],
      [waist * 1.03, 1.03],
      [chest * 0.68, 1.42],
    ],
    material: materials.dark,
    lift: 0.016,
  })

  const patterns = new THREE.Mesh(
    geometry(THREE, 'manga:kakin-announcer-dress-swirls', () => {
      const parts: BufferGeometry[] = []
      const positions: Array<readonly [number, number, number]> = [
        [-0.12, 0.4, 0.105],
        [0.09, 0.46, 0.12],
        [-0.07, 0.62, 0.145],
        [0.13, 0.7, 0.13],
        [-0.13, 0.8, 0.12],
        [0.05, 0.9, 0.16],
        [-0.07, 1.17, 0.17],
        [0.08, 1.3, 0.17],
      ]
      for (let i = 0; i < positions.length; i++) {
        const [x, y, z] = positions[i]!
        parts.push(
          new THREE.TorusGeometry(0.026 + (i % 3) * 0.006, 0.006, 6, 20, Math.PI * 1.6)
            .rotateZ(i * 0.47)
            .translate(x, y, z),
        )
      }
      return mergeHumanDetails(parts)
    }),
    materials.shirt,
  )
  patterns.name = 'kakin-announcer-dress-swirl-pattern'
  figure.add(patterns)
}

export function addKakinAnnouncerBraceletsAndShoes(
  build: HumanLimbsBuild,
  limbs: HumanLimbs,
): void {
  const { THREE, geometry, glow, profile } = build
  for (let i = 0; i < 2; i++) {
    const arm = limbs.arms[i]
    arm.children[0].visible = false
    const bareUpperArm = new THREE.Mesh(
      geometry(
        THREE,
        'manga:kakin-announcer-bare-upper-arm',
        () => new THREE.CylinderGeometry(0.042, 0.036, 0.3, 16),
      ),
      glow(profile.skin, 1),
    )
    bareUpperArm.name = 'kakin-announcer-bare-upper-arm'
    bareUpperArm.position.y = -0.19
    arm.add(bareUpperArm)
    ;((limbs.elbows[i].children[0] as Group).children[1] as Mesh).material = glow(profile.skin, 1)

    const bracelet = new THREE.Mesh(
      geometry(
        THREE,
        'manga:kakin-announcer-bracelet',
        () => new THREE.CylinderGeometry(0.045, 0.047, 0.025, 18),
      ),
      glow(profile.accent, 1),
    )
    bracelet.name = 'kakin-announcer-wrist-bracelet'
    bracelet.position.y = -0.255
    limbs.elbows[i].add(bracelet)

    const shoePattern = new THREE.Mesh(
      geometry(THREE, 'manga:kakin-announcer-shoe-pattern', () => {
        const parts: BufferGeometry[] = []
        for (let dot = -2; dot <= 2; dot++)
          parts.push(
            new THREE.TorusGeometry(0.009, 0.0026, 5, 12)
              .rotateX(Math.PI / 2)
              .translate(dot * 0.021, 0, 0),
          )
        return mergeHumanDetails(parts)
      }),
      glow(profile.shirt, 1),
    )
    shoePattern.name = 'kakin-announcer-patterned-shoe'
    shoePattern.position.set(0, -0.45, 0.095)
    limbs.knees[i].add(shoePattern)
  }
}
