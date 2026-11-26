import type { Mesh } from 'three'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'

type LimbDetail = (build: HumanLimbsBuild, limbs: HumanLimbs) => void

function croppedSleeves(build: HumanLimbsBuild, limbs: HumanLimbs, length: number) {
  const { THREE, geometry, glow, profile } = build
  const bare = geometry(
    THREE,
    `manga:lower-deck-bare-upper-arm:${length}`,
    () => new THREE.CylinderGeometry(0.044, 0.037, 0.27 * (1 - length), 16),
  )
  for (const [index, arm] of limbs.arms.entries()) {
    const skin = glow(profile.skin, 1)
    arm.children[0].scale.y = length
    arm.children[0].position.y = -0.154 * length
    const exposed = new THREE.Mesh(bare, skin)
    exposed.name = `${profile.likeness}-exposed-arm`
    exposed.position.y = -0.28 + 0.135 * (1 - length)
    arm.add(exposed)
    ;(limbs.elbows[index].children[0].children[1] as Mesh).material = skin
  }
}

function workPants(limbs: HumanLimbs) {
  for (const leg of limbs.legs) {
    leg.children[0].scale.x *= 1.32
    leg.children[0].scale.z *= 1.18
  }
  for (const knee of limbs.knees) {
    knee.children[0].scale.x *= 1.24
    knee.children[0].scale.z *= 1.2
  }
}

function tassiKnickers(build: HumanLimbsBuild, limbs: HumanLimbs) {
  workPants(limbs)
  const { THREE, geometry, glow, profile } = build
  const cuff = geometry(
    THREE,
    'manga:tassi-ribbed-pant-cuff',
    () => new THREE.CylinderGeometry(0.075, 0.068, 0.07, 24),
  )
  for (const knee of limbs.knees) {
    const band = new THREE.Mesh(cuff, glow(profile.accent, 1))
    band.name = 'tassi-ribbed-pant-cuff'
    band.position.y = -0.335
    knee.add(band)
  }
}

const LOWER_DECK_LIMBS: Partial<Record<string, LimbDetail>> = {
  bille: (build, limbs) => croppedSleeves(build, limbs, 0.48),
  daemon: (build, limbs) => croppedSleeves(build, limbs, 0.45),
  'chiffon-toto': (build, limbs) => croppedSleeves(build, limbs, 0.49),
  souffle: (build, limbs) => croppedSleeves(build, limbs, 0.26),
  quorolle: (_build, limbs) => workPants(limbs),
  tassi: tassiKnickers,
}

export function addLowerDeckLimbs(build: HumanLimbsBuild, limbs: HumanLimbs) {
  LOWER_DECK_LIMBS[build.profile.likeness ?? '']?.(build, limbs)
}
