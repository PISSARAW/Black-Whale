import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addDogmanMask(build: HumanHeadBuild, head: Group): void {
  if (build.profile.likeness !== 'dogman') return
  const { THREE, geometry, outlined, glow, materials } = build
  for (const name of [
    'manga-face',
    'face-eye-left',
    'face-eye-right',
    'face-brow-left',
    'face-brow-right',
    'face-mouth',
    'face-relief',
  ]) {
    const hidden = head.getObjectByName(name)
    if (hidden) hidden.visible = false
  }

  const mask = new THREE.Group()
  mask.name = 'dogman-dog-mask'
  const plate = outlined({
    THREE,
    geometry: geometry(THREE, 'manga:dogman-mask-plate', () =>
      new THREE.SphereGeometry(1, 32, 20).scale(0.188, 0.238, 0.07),
    ),
    material: glow(0xf1ede2, 1),
    ink: materials.ink,
    scale: 1.035,
  })
  plate.name = 'dogman-mask-plate'
  plate.position.set(0, 0.005, 0.155)
  mask.add(plate)

  for (const side of [-1, 1]) {
    const ear = outlined({
      THREE,
      geometry: geometry(
        THREE,
        'manga:dogman-mask-ear',
        () => new THREE.ConeGeometry(0.068, 0.145, 3),
      ),
      material: glow(0xf1ede2, 1),
      ink: materials.ink,
      scale: 1.06,
    })
    ear.name = 'dogman-mask-ear'
    ear.position.set(side * 0.177, 0.125, 0.165)
    ear.rotation.z = side * -0.34
    mask.add(ear)

    const eyeRing = new THREE.Mesh(
      geometry(THREE, 'manga:dogman-mask-eye-ring', () => new THREE.CircleGeometry(0.055, 24)),
      materials.ink,
    )
    eyeRing.name = 'dogman-mask-eye-ring'
    eyeRing.position.set(side * 0.073, 0.045, 0.225)
    mask.add(eyeRing)
    const eye = new THREE.Mesh(
      geometry(THREE, 'manga:dogman-mask-eye', () => new THREE.CircleGeometry(0.049, 24)),
      glow(0xf8f4e9, 1),
    )
    eye.name = 'dogman-mask-eye'
    eye.position.set(side * 0.073, 0.045, 0.226)
    const pupil = new THREE.Mesh(
      geometry(THREE, 'manga:dogman-mask-pupil', () => new THREE.CircleGeometry(0.017, 18)),
      materials.ink,
    )
    pupil.name = 'dogman-mask-pupil'
    pupil.position.z = 0.002
    eye.add(pupil)
    mask.add(eye)

    const muzzle = outlined({
      THREE,
      geometry: geometry(THREE, 'manga:dogman-mask-muzzle', () =>
        new THREE.SphereGeometry(1, 24, 14).scale(0.092, 0.057, 0.038),
      ),
      material: glow(0xf1ede2, 1),
      ink: materials.ink,
      scale: 1.045,
    })
    muzzle.name = 'dogman-mask-muzzle'
    muzzle.position.set(side * 0.074, -0.055, 0.229)
    mask.add(muzzle)
  }

  const nose = new THREE.Mesh(
    geometry(THREE, 'manga:dogman-mask-nose', () =>
      new THREE.SphereGeometry(1, 20, 14).scale(0.041, 0.035, 0.029),
    ),
    materials.ink,
  )
  nose.name = 'dogman-mask-nose'
  nose.position.set(0, -0.035, 0.272)
  mask.add(nose)

  const mouth = new THREE.Mesh(
    geometry(THREE, 'manga:dogman-mask-mouth', () =>
      new THREE.PlaneGeometry(0.132, 0.039).translate(0, -0.113, 0.246),
    ),
    materials.ink,
  )
  mouth.name = 'dogman-mask-mouth'
  mask.add(mouth)
  for (let i = 0; i < 6; i++) {
    const tooth = new THREE.Mesh(
      geometry(THREE, 'manga:dogman-mask-tooth', () => new THREE.ConeGeometry(0.012, 0.027, 3)),
      glow(0xf8f4e9, 1),
    )
    tooth.name = 'dogman-mask-tooth'
    tooth.position.set((i - 2.5) * 0.021, -0.108, 0.249)
    tooth.rotation.z = Math.PI
    mask.add(tooth)
  }

  const whiskers = new THREE.Mesh(
    geometry(THREE, 'manga:dogman-whisker-dots', () => {
      const dots = []
      for (const side of [-1, 1])
        for (let row = 0; row < 2; row++)
          for (let column = 0; column < 3; column++)
            dots.push(
              new THREE.CircleGeometry(0.003, 8).translate(
                side * (0.046 + column * 0.019),
                -0.052 - row * 0.018,
                0.269,
              ),
            )
      return mergeHumanDetails(dots)
    }),
    materials.ink,
  )
  whiskers.name = 'dogman-whisker-dots'
  mask.add(whiskers)

  const kanji = new THREE.Mesh(
    geometry(THREE, 'manga:dogman-kanji-dog', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.072, 0.006).translate(0, 0.13, 0.226),
        new THREE.PlaneGeometry(0.006, 0.085).translate(0, 0.105, 0.227),
        new THREE.PlaneGeometry(0.006, 0.071).rotateZ(-0.68).translate(-0.022, 0.075, 0.227),
        new THREE.PlaneGeometry(0.006, 0.071).rotateZ(0.68).translate(0.022, 0.075, 0.227),
        new THREE.PlaneGeometry(0.018, 0.006).rotateZ(-0.5).translate(0.043, 0.14, 0.227),
      ]),
    ),
    materials.ink,
  )
  kanji.name = 'dogman-kanji-dog'
  kanji.position.y = 0.035
  mask.add(kanji)
  head.add(mask)
}

export function addDogmanShirt(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials } = build
  const neckline = new THREE.Mesh(
    geometry(THREE, 'manga:dogman-shirt-neckline', () =>
      new THREE.TorusGeometry(0.082, 0.005, 6, 28, Math.PI).rotateZ(Math.PI),
    ),
    materials.ink,
  )
  neckline.name = 'dogman-shirt-neckline'
  neckline.position.set(0, 1.43, 0.174)
  figure.add(neckline)
}

export function shapeDogmanLimbs(build: HumanLimbsBuild, limbs: HumanLimbs): void {
  const { THREE, geometry, glow, profile } = build
  for (let i = 0; i < 2; i++) {
    const arm = limbs.arms[i]
    arm.scale.x *= 1.28
    arm.scale.z *= 1.28
    limbs.elbows[i].scale.set(1.3, 1, 1.3)
    limbs.legs[i].scale.x *= 1.18
    limbs.legs[i].scale.z *= 1.18
    limbs.knees[i].scale.set(1.16, 1, 1.16)

    arm.children[0].scale.y *= 0.48
    arm.children[0].position.y = -0.08
    const bareUpperArm = new THREE.Mesh(
      geometry(THREE, 'manga:dogman-bare-upper-arm', () =>
        new THREE.SphereGeometry(1, 16, 12).scale(0.078, 0.145, 0.072),
      ),
      glow(profile.skin, 1),
    )
    bareUpperArm.name = 'dogman-bare-upper-arm'
    bareUpperArm.position.y = -0.245
    arm.add(bareUpperArm)
    ;((limbs.elbows[i].children[0] as Group).children[1] as Mesh).material = glow(profile.skin, 1)

    const wristband = new THREE.Mesh(
      geometry(
        THREE,
        'manga:dogman-wristband',
        () => new THREE.CylinderGeometry(0.043, 0.046, 0.075, 14),
      ),
      glow(0x191b20, 1),
    )
    wristband.name = 'dogman-black-wristband'
    wristband.position.y = -0.245
    limbs.elbows[i].add(wristband)

    const laces = new THREE.Mesh(
      geometry(THREE, 'manga:dogman-sneaker-laces', () => {
        const bars = []
        for (let lace = 0; lace < 4; lace++)
          bars.push(
            new THREE.BoxGeometry(0.075, 0.006, 0.008).translate(0, -0.03 + lace * 0.018, 0.09),
          )
        return mergeHumanDetails(bars)
      }),
      glow(0xe8e3d9, 1),
    )
    laces.name = 'dogman-sneaker-laces'
    laces.position.y = -0.455
    limbs.knees[i].add(laces)
  }
}
