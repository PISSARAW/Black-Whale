import type { Group, Object3D } from 'three'
import type { Apparition } from './apparitions'
import type { HumanAppearance } from './humanAppearance'
import { poseFluteArms } from './humanFlutePose'

interface RestingHuman {
  figure: Group
  head: Object3D
  arms: Group[]
  legs: Group[]
  elbows: Group[]
  knees: Group[]
}

function seated(rig: RestingHuman): void {
  const { figure, arms, elbows, legs, knees } = rig
  figure.position.y = -0.3
  arms.forEach((arm, index) => {
    const side = index === 0 ? -1 : 1
    arm.position.set(side * 0.27, 1.34, 0.02)
    arm.rotation.set(-0.72, 0, side * -0.12)
    elbows[index].rotation.x = -1.12
  })
  legs.forEach((leg, index) => {
    const side = index === 0 ? -1 : 1
    leg.position.x = side * 0.14
    leg.rotation.x = -Math.PI / 2
    knees[index].rotation.x = Math.PI / 2
  })
}

function armAt(rig: RestingHuman, index: number, point: readonly [number, number, number]): void {
  const arm = rig.arms[index]
  const shoulder = arm.position.clone()
  const target = shoulder.clone().set(...point)
  const direction = target.clone().sub(shoulder)
  const distance = direction.length()
  direction.normalize()
  const along = (0.27 ** 2 - 0.25 ** 2 + distance ** 2) / (2 * distance)
  const bend = Math.sqrt(Math.max(0, 0.27 ** 2 - along ** 2))
  const normal = direction.clone().set(-direction.y, direction.x, 0).normalize()
  const elbow = shoulder
    .clone()
    .addScaledVector(direction, along)
    .addScaledVector(normal, bend * (index === 0 ? -1 : 1))
  const down = shoulder.clone().set(0, -1, 0)
  arm.quaternion.setFromUnitVectors(down, elbow.clone().sub(shoulder).normalize())
  const forearm = target.sub(elbow).normalize().applyQuaternion(arm.quaternion.clone().invert())
  rig.elbows[index].quaternion.setFromUnitVectors(down, forearm)
}

/** Ch. 359: head on the pillow, one elbow raised and the other hand at the book. */
function reclined(rig: RestingHuman): void {
  rig.figure.rotation.x = -Math.PI / 2 + 0.1
  rig.figure.position.set(0, 0.2, 0.9)
  rig.head.rotation.set(0.3, 0.2, 0)
  armAt(rig, 0, [-0.18, 1.62, 0.3])
  armAt(rig, 1, [0.3, 1.02, 0.23])
  rig.knees[0].rotation.x = 0.12
  rig.knees[1].rotation.x = 0.2
}

/** Low floor cushions, rather than the chair-height pose used at dining tables. */
function crossLegged(rig: RestingHuman): void {
  rig.figure.position.y = -0.55
  rig.legs.forEach((leg, index) => {
    const side = index === 0 ? -1 : 1
    leg.rotation.set(-Math.PI / 2, side * 0.45, side * -0.7)
    rig.knees[index].rotation.set(1.85, side * -0.7, 0)
    rig.arms[index].rotation.set(-0.35, 0, side * -0.18)
    rig.elbows[index].rotation.x = -1.05
  })
}

export const HUMAN_REST_POSES: Partial<
  Record<HumanAppearance['pose'], (rig: RestingHuman) => void>
> = {
  flute: poseFluteArms,
  seated,
  reclined,
  'cross-legged': crossLegged,
}

export function legacyHumanPose(seen: Apparition): NonNullable<Apparition['human']>['pose'] {
  if (seen.human) return seen.human.pose
  const pose = Math.floor(seen.stage / 3)
  return pose === 1
    ? 'guard'
    : pose === 2
      ? 'held'
      : pose === 3
        ? 'fallen'
        : pose === 4
          ? 'attack'
          : 'idle'
}
