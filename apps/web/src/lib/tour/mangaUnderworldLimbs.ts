import type { Mesh } from 'three'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

function hinrighSleeves(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow } = build
  const stripe = geometry(THREE, 'manga:hinrigh-sleeve-stripes', () =>
    mergeHumanDetails([
      new THREE.CylinderGeometry(0.069, 0.055, 0.29, 12, 1, true, -0.2, 0.35).translate(
        0,
        -0.17,
        0,
      ),
      new THREE.CylinderGeometry(0.069, 0.055, 0.29, 12, 1, true, 1.3, 0.35).translate(0, -0.17, 0),
      new THREE.CylinderGeometry(0.069, 0.055, 0.29, 12, 1, true, -1.6, 0.35).translate(
        0,
        -0.17,
        0,
      ),
    ]),
  )
  for (const joint of [...limbs.arms, ...limbs.elbows]) {
    const stripes = new THREE.Mesh(stripe, glow(0x202025, 1))
    stripes.name = 'hinrigh-striped-sleeve'
    joint.add(stripes)
  }
}

function sportShorts(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  for (let i = 0; i < 2; i++) {
    ;(limbs.legs[i].children[0].children[1] as Mesh).material = glow(profile.skin, 1)
    ;(limbs.knees[i].children[0].children[1] as Mesh).material = glow(profile.skin, 1)
    const shorts = new THREE.Mesh(
      geometry(
        THREE,
        'manga:terebellum-sport-shorts',
        () => new THREE.CylinderGeometry(0.095, 0.104, 0.22, 24),
      ),
      glow(profile.trousers, 1),
    )
    shorts.position.y = -0.08
    shorts.name = 'terebellum-sport-shorts'
    limbs.legs[i].add(shorts)
    const hem = new THREE.Mesh(
      geometry(
        THREE,
        'manga:terebellum-shorts-hem',
        () => new THREE.CylinderGeometry(0.104, 0.106, 0.024, 24),
      ),
      glow(profile.shirt, 1),
    )
    hem.position.y = -0.185
    limbs.legs[i].add(hem)
    const cuff = new THREE.Mesh(
      geometry(
        THREE,
        'manga:terebellum-sleeve-cuff',
        () => new THREE.CylinderGeometry(0.048, 0.046, 0.035, 24),
      ),
      glow(profile.shirt, 1),
    )
    cuff.position.y = -0.267
    limbs.elbows[i].add(cuff)
  }
}

function sleevePiping(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  const piping = geometry(THREE, `manga:sport-sleeve-piping:${profile.likeness}`, () =>
    mergeHumanDetails([
      new THREE.CylinderGeometry(0.064, 0.049, 0.27, 14, 1, true, 1.3, 0.22).translate(0, -0.15, 0),
      new THREE.CylinderGeometry(0.064, 0.049, 0.27, 14, 1, true, -1.52, 0.22).translate(
        0,
        -0.15,
        0,
      ),
    ]),
  )
  for (const joint of [...limbs.arms, ...limbs.elbows]) {
    const trim = new THREE.Mesh(piping, glow(profile.shirt, 1))
    trim.name = 'sport-sleeve-piping'
    joint.add(trim)
  }
}

export function addUnderworldLimbClothes(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const id = build.profile.likeness
  if (id === 'hinrigh-biganduffno') hinrighSleeves(build, limbs)
  if (id === 'terebellum') sportShorts(build, limbs)
  if (id === 'terebellum' || id === 'zakuro-custard') sleevePiping(build, limbs)
}
