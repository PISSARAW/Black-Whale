import { chainChest } from './kurapikaChainAnchors'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { ChainMotion } from './kurapikaChainMotion'
import type { FightSide, FightState } from './types'

/** The generic lead-hand poses are not always the anatomical right hand. */
export function poseKurapikaChainHand(
  options: EffectSceneOptions,
  pose: {
    state: FightState
    side: FightSide
    motions: ChainMotion[]
    reaches: number[]
  },
): void {
  const figure = options.figureOf?.(pose.side)
  const motion =
    pose.motions.find((entry) => entry.mode === 'healing') ?? pose.motions[pose.motions.length - 1]
  if (!figure || !motion) return
  if (martialPoseOwnsArm(pose.state, pose.side)) return
  const target = pose.side === 'player' ? 'opponent' : 'player'
  const selfTarget = ['healing', 'dowsing'].includes(motion.mode)
  const goal = chainChest(options, {
    state: pose.state,
    side: selfTarget ? pose.side : target,
  })
  if (selfTarget) goal.y -= 0.12
  else goal.x -= pose.state[pose.side].facing * (pose.reaches[motion.stage] + 0.28)
  aimRightArm({ THREE: options.THREE, figure, goal, blend: motion.extension })
}

/** A maintained tether follows the live hand without replacing a punch or pistol pose. */
function martialPoseOwnsArm(state: FightState, side: FightSide): boolean {
  const attack = state[side].attack
  return Boolean(attack && attack.kind !== 'special')
}

function aimRightArm(options: {
  THREE: typeof import('three')
  figure: import('three').Object3D
  goal: import('three').Vector3
  blend: number
}): void {
  const { THREE, figure, goal, blend } = options
  const shoulder = figure.getObjectByName('shoulder-right')
  const elbow = figure.getObjectByName('elbow-right')
  const hand = figure.getObjectByName('hand-right')
  if (!shoulder?.parent || !elbow?.parent || !hand) return
  const parent = shoulder.parent
  const direction = parent.worldToLocal(goal.clone()).sub(shoulder.position)
  const upper = elbow.position.length()
  const lower = hand.position.length()
  const distance = Math.max(
    Math.abs(upper - lower) + 0.01,
    Math.min(upper + lower - 0.005, direction.length()),
  )
  direction.normalize()
  const actualGoal = parent.localToWorld(
    shoulder.position.clone().addScaledVector(direction, distance),
  )
  const parentRotation = parent.getWorldQuaternion(new THREE.Quaternion()).invert()
  const bend = new THREE.Vector3(0, -1, 0).applyQuaternion(parentRotation)
  bend.addScaledVector(direction, -bend.dot(direction))
  if (bend.lengthSq() < 0.001) bend.set(0, 0, 1).addScaledVector(direction, -direction.z)
  bend.normalize()
  const cosine = Math.max(
    -1,
    Math.min(1, (upper * upper + distance * distance - lower * lower) / (2 * upper * distance)),
  )
  const upperAim = direction
    .clone()
    .multiplyScalar(cosine)
    .addScaledVector(bend, Math.sqrt(1 - cosine * cosine))
  const down = new THREE.Vector3(0, -1, 0)
  shoulder.quaternion.slerp(
    new THREE.Quaternion().setFromUnitVectors(down, upperAim.normalize()),
    blend,
  )
  shoulder.updateWorldMatrix(true, true)
  const lowerAim = elbow.parent.worldToLocal(actualGoal.clone()).sub(elbow.position).normalize()
  elbow.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(down, lowerAim), blend)
  hand.quaternion.slerp(new THREE.Quaternion(), blend)
  shoulder.updateWorldMatrix(true, true)
}
