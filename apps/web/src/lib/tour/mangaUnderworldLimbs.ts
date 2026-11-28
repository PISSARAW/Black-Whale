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

function sportTrousers(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  const fabric = glow(profile.shirt, 1)
  const stripe = geometry(THREE, 'manga:terebellum-trouser-trim', () =>
    mergeHumanDetails([
      new THREE.CylinderGeometry(0.078, 0.061, 0.215, 18, 1, true, 0.92, 0.56).translate(
        0,
        -0.19,
        0,
      ),
      new THREE.CylinderGeometry(0.062, 0.055, 0.037, 18).translate(0, -0.318, 0),
    ]),
  )
  const sleeveCuff = geometry(
    THREE,
    'manga:terebellum-sleeve-cuff',
    () => new THREE.CylinderGeometry(0.048, 0.046, 0.035, 24),
  )
  for (const knee of limbs.knees) {
    const trim = new THREE.Mesh(stripe, fabric)
    trim.rotation.y = knee === limbs.knees[0] ? Math.PI : 0
    trim.name = 'terebellum-trouser-trim'
    knee.add(trim)
  }
  for (const elbow of limbs.elbows) {
    const cuff = new THREE.Mesh(sleeveCuff, fabric)
    cuff.position.y = -0.267
    elbow.add(cuff)
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
  if (id === 'terebellum') sportTrousers(build, limbs)
  if (id === 'terebellum' || id === 'zakuro-custard') sleevePiping(build, limbs)
  if (id === 'zakuro-custard')
    for (const joint of [...limbs.legs, ...limbs.knees]) {
      joint.children[0].scale.x *= 1.26
      joint.children[0].scale.z *= 1.18
    }
}
