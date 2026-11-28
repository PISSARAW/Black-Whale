import type { Group, Object3D } from 'three'
import { improveFightBodyReadability } from '../fighting/fightBodyReadability'
import { improveFightFace } from '../fighting/fightFaceReadability'
import type { HumanAppearance } from './humanAppearance'
import type { HumanFigure, HumanLook } from './humanFigure'
import { humanProfile, type HumanProfile } from './humanProfiles'
import type { Geometry, Three } from './silentMajorityParts'

export const WOBLE_ID = 'prince-woble'
export const PUBLIC_WOBLE_ID = 'oito-nephew-fake-woble'
export const WOBLE_HELD_SCALE = 0.34 / 0.42

export function wobleSwaddleProfile(
  profile: HumanProfile,
  pose: HumanAppearance['pose'],
  seen: HumanLook,
): HumanProfile | null {
  if (pose !== 'held') return null
  if (profile.likeness === WOBLE_ID) return profile
  if (profile.likeness !== PUBLIC_WOBLE_ID) return null
  // The held presentation reproduces the film. The case and cast keep the baby's own ID.
  return humanProfile({ ...seen, id: WOBLE_ID, human: undefined })
}

function createBlanket(THREE: Three, geometry: Geometry): Group {
  const group = new THREE.Group()
  group.name = 'woble-swaddle'
  const blanket = new THREE.Mesh(
    geometry(
      THREE,
      'woble:blanket',
      () =>
        new THREE.LatheGeometry(
          [
            [0, 0.1],
            [0.15, 0.14],
            [0.23, 0.34],
            [0.27, 0.7],
            [0.25, 1.06],
            [0.18, 1.31],
            [0, 1.34],
          ].map(([x, y]) => new THREE.Vector2(x, y)),
          24,
        ),
    ),
    new THREE.MeshLambertMaterial({ color: 0xe5d7bc }),
  )
  blanket.name = 'woble-blanket'
  blanket.scale.z = 0.73
  group.add(blanket)
  const seam = geometry(
    THREE,
    'woble:blanket-fold',
    () => new THREE.TorusGeometry(0.234, 0.014, 6, 27),
  )
  const foldMaterial = new THREE.MeshLambertMaterial({ color: 0xcdbaa0 })
  for (const angle of [0.31, -0.22]) {
    const fold = new THREE.Mesh(seam, foldMaterial)
    fold.name = 'woble-blanket-fold'
    fold.position.y = angle > 0 ? 0.83 : 0.65
    fold.scale.y = 0.74
    fold.rotation.set(Math.PI / 2, angle, 0)
    group.add(fold)
  }
  return group
}

export function addWobleSwaddle(options: {
  THREE: Three
  geometry: Geometry
  figure: Group
  far: Group
  head: Group
  limbs: readonly Object3D[]
}) {
  const { THREE, geometry, figure, far, head, limbs } = options
  const blanket = createBlanket(THREE, geometry)
  figure.add(blanket)
  const [farBody] = far.children
  const farBlanket = blanket.clone()
  far.add(farBlanket)
  function pose(held: boolean) {
    blanket.visible = farBlanket.visible = held
    farBody.visible = !held
    for (const limb of limbs) limb.visible = !held
    if (held) {
      figure.rotation.set(0.06, 0, 1.14)
      head.rotation.x = 0.06
    }
    far.position.copy(figure.position)
    far.rotation.copy(figure.rotation)
  }
  pose(true)
  return pose
}

export function finishSwaddledWoble(model: HumanFigure, profile: HumanProfile) {
  improveFightBodyReadability(model.root)
  improveFightFace(model, profile)
}
