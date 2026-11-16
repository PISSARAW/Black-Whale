import type { BufferGeometry, Mesh } from 'three'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

function nobunaga(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  for (let i = 0; i < 2; i++) {
    const wraps = new THREE.Mesh(
      geometry(THREE, 'manga:nobunaga-shin-wraps', () => {
        const parts: BufferGeometry[] = [
          new THREE.CylinderGeometry(0.049, 0.046, 0.31, 20).translate(0, -0.17, 0),
        ]
        for (let band = 0; band < 8; band++)
          parts.push(
            new THREE.TorusGeometry(0.049, 0.0025, 5, 20)
              .rotateX(Math.PI / 2)
              .translate(0, -0.032 - band * 0.038, 0),
          )
        return mergeHumanDetails(parts)
      }),
      glow(profile.accent, 1),
    )
    wraps.name = 'nobunaga-shin-wraps'
    limbs.knees[i].add(wraps)
    const foot = limbs.knees[i].children[1]
    const shape = geometry(THREE, 'manga:nobunaga-bare-foot', () =>
      new THREE.SphereGeometry(1, 16, 10).scale(0.046, 0.027, 0.111).translate(0, 0.004, 0.01),
    )
    foot.children.slice(0, 2).forEach((child) => {
      ;(child as Mesh).geometry = shape
    })
    ;(foot.children[1] as Mesh).material = glow(profile.skin, 1)
    const sandal = new THREE.Mesh(
      geometry(THREE, 'manga:nobunaga-sandals', () =>
        mergeHumanDetails([
          new THREE.BoxGeometry(0.099, 0.013, 0.25).translate(0, -0.039, 0.01),
          new THREE.BoxGeometry(0.009, 0.012, 0.13).rotateY(0.3).translate(-0.016, 0.03, 0.034),
          new THREE.BoxGeometry(0.009, 0.012, 0.13).rotateY(-0.3).translate(0.016, 0.03, 0.034),
        ]),
      ),
      glow(0x776e4e, 1),
    )
    sandal.name = 'nobunaga-sandal-straps'
    foot.add(sandal)
  }
}

function bonolenov(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  for (let i = 0; i < 2; i++) {
    const shorts = new THREE.Mesh(
      geometry(THREE, 'manga:bonolenov-boxing-shorts', () =>
        new THREE.CylinderGeometry(0.082, 0.09, 0.25, 24).translate(0, -0.075, 0),
      ),
      glow(profile.trousers, 1),
    )
    shorts.name = 'bonolenov-boxing-shorts'
    limbs.legs[i].add(shorts)
    const glove = new THREE.Mesh(
      geometry(THREE, 'manga:bonolenov-boxing-gloves', () =>
        mergeHumanDetails([
          new THREE.SphereGeometry(1, 16, 12).scale(0.075, 0.085, 0.06),
          new THREE.SphereGeometry(1, 12, 8)
            .scale(0.029, 0.046, 0.03)
            .translate(0.061, 0.014, 0.006),
          new THREE.CylinderGeometry(0.044, 0.044, 0.055, 16).translate(0, 0.071, 0),
        ]),
      ),
      glow(profile.accent, 1),
    )
    glove.name = 'bonolenov-boxing-glove'
    limbs.elbows[i].getObjectByName(i ? 'hand-right' : 'hand-left')!.add(glove)
    const boot = new THREE.Mesh(
      geometry(
        THREE,
        'manga:bonolenov-boxing-boot',
        () => new THREE.CylinderGeometry(0.061, 0.066, 0.31, 24),
      ),
      glow(profile.accent, 1),
    )
    boot.name = 'bonolenov-boxing-boot'
    boot.position.y = -0.305
    limbs.knees[i].add(boot)
    const laces = new THREE.Mesh(
      geometry(THREE, 'manga:bonolenov-boot-laces', () => {
        const parts = [new THREE.PlaneGeometry(0.037, 0.28)]
        for (let band = 0; band < 8; band++) {
          parts.push(
            new THREE.PlaneGeometry(0.052, 0.004)
              .rotateZ(0.55)
              .translate(0, 0.12 - band * 0.034, 0.001),
          )
          parts.push(
            new THREE.PlaneGeometry(0.052, 0.004)
              .rotateZ(-0.55)
              .translate(0, 0.12 - band * 0.034, 0.001),
          )
        }
        return mergeHumanDetails(parts)
      }),
      glow(0xe7e5dd, 1),
    )
    laces.position.set(0, -0.305, 0.066)
    laces.name = 'bonolenov-boot-laces'
    limbs.knees[i].add(laces)
    ;(limbs.knees[i].children[1].children[1] as Mesh).material = glow(profile.accent, 1)
  }
}

export function addMangaReferenceLimbs(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness === 'nobunaga-hazama') nobunaga(build, limbs)
  if (build.profile.likeness === 'bonolenov-ndongo') bonolenov(build, limbs)
  if (build.profile.likeness === 'phinks-magcub') phinks(build, limbs)
  if (build.profile.likeness === 'chrollo-lucilfer') chrollo(build, limbs)
  if (build.profile.likeness === 'franklin-bordeau') {
    for (const elbow of limbs.elbows)
      (elbow.getObjectByName('hand-left') ??
        elbow.getObjectByName('hand-right'))!.scale.multiplyScalar(1.3)
  }
}

function phinks(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  for (let i = 0; i < 2; i++) {
    const side = i ? 1 : -1
    ;((limbs.arms[i].children[2] as import('three').Group).children[1] as Mesh).material = glow(
      profile.shirt,
      1,
    )
    const cuff = new THREE.Mesh(
      geometry(
        THREE,
        'manga:phinks-cuff',
        () => new THREE.CylinderGeometry(0.039, 0.039, 0.032, 20),
      ),
      glow(profile.accent, 1),
    )
    cuff.position.y = -0.258
    limbs.elbows[i].add(cuff)
    const stripeGeometry = geometry(
      THREE,
      'manga:phinks-trouser-stripe',
      () => new THREE.BoxGeometry(0.005, 0.34, 0.006),
    )
    const upper = new THREE.Mesh(stripeGeometry, glow(profile.shirt, 1))
    upper.position.set(side * 0.082, -0.2, 0.008)
    limbs.legs[i].add(upper)
    const lower = new THREE.Mesh(stripeGeometry, glow(profile.shirt, 1))
    lower.position.set(side * 0.067, -0.22, 0.008)
    limbs.knees[i].add(lower)
    ;(limbs.knees[i].children[1].children[1] as Mesh).material = glow(0x58636c, 1)
  }
}

function chrollo(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  for (let i = 0; i < 2; i++) {
    const stripes = geometry(THREE, 'manga:chrollo-sleeve-crosses', () =>
      mergeHumanDetails([
        new THREE.PlaneGeometry(0.008, 0.24).rotateZ(0.4).translate(0, -0.15, 0.052),
        new THREE.PlaneGeometry(0.008, 0.24).rotateZ(-0.4).translate(0, -0.15, 0.052),
      ]),
    )
    limbs.arms[i].add(new THREE.Mesh(stripes, glow(profile.accent, 1)))
    limbs.elbows[i].add(new THREE.Mesh(stripes, glow(profile.accent, 1)))
    const mark = new THREE.Mesh(
      geometry(THREE, 'manga:chrollo-shoe-cross', () =>
        mergeHumanDetails([
          new THREE.BoxGeometry(0.006, 0.006, 0.032).translate(0, 0.045, 0.08),
          new THREE.BoxGeometry(0.026, 0.006, 0.006).translate(0, 0.045, 0.08),
        ]),
      ),
      glow(profile.accent, 1),
    )
    limbs.knees[i].children[1].add(mark)
  }
}
