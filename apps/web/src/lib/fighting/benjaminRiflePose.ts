import type { Object3D, Quaternion, Vector3 } from 'three'
import { benjaminBurstFlash, benjaminGunHeld, benjaminRifleFor } from './benjaminRifle'
import type { FightRig } from './fightRig'
import type { ArcadeFighter } from './types'

const SCRATCH = new WeakMap<FightRig, ReturnType<typeof makeScratch>>()
function makeScratch(rig: FightRig) {
  const v = () => rig.probe.clone()
  const q = () => rig.human.figure.quaternion.clone()
  return {
    target: v(),
    pivot: v(),
    end: v(),
    toward: v(),
    down: v().set(0, -1, 0),
    direction: v(),
    bend: v(),
    elbow: v(),
    local: v(),
    world: q(),
    parent: q(),
    delta: q(),
    aim: q(),
    yaw: q().setFromAxisAngle(v().set(0, 1, 0), -0.35),
  }
}
type Scratch = ReturnType<typeof makeScratch>

/** Resolve both actual arm chains after the attack pose, preserving their bone lengths. */
export function animateBenjaminRifle(rig: FightRig, fighter: ArcadeFighter): void {
  const rifle = benjaminRifleFor(rig.human.figure)
  if (!rifle) return
  rifle.held.visible = benjaminGunHeld(fighter)
  rifle.muzzle.visible = benjaminBurstFlash(fighter)
  if (!rifle.held.visible) return
  let scratch = SCRATCH.get(rig)
  if (!scratch) {
    scratch = makeScratch(rig)
    SCRATCH.set(rig, scratch)
  }
  const right = rig.human.arms.findIndex((arm) => arm.name === 'shoulder-right')
  const left = 1 - right
  scratch.target.set(0.03, rig.human.arms[right].position.y - 0.32, 0.12)
  if (rifle.muzzle.visible) scratch.target.z -= 0.025
  poseArm({ rig, index: right, target: scratch.target, scratch })
  rig.chest.getWorldQuaternion(scratch.aim).multiply(scratch.yaw)
  orientWrist(rig.wrists[right], scratch.aim, scratch)
  rifle.support.getWorldPosition(scratch.target)
  rig.chest.worldToLocal(scratch.target)
  poseArm({ rig, index: left, target: scratch.target, scratch })
  orientWrist(rig.wrists[left], scratch.aim, scratch)
}

function orientWrist(hand: Object3D, aim: Quaternion, s: Scratch) {
  hand.parent!.getWorldQuaternion(s.parent).invert()
  hand.quaternion.copy(s.parent).multiply(aim)
}

function poseArm(options: { rig: FightRig; index: number; target: Vector3; scratch: Scratch }) {
  const { rig, index, target, scratch: s } = options
  const arm = rig.human.arms[index],
    elbow = rig.elbows[index],
    hand = rig.wrists[index]
  const upper = Math.abs(elbow.position.y * arm.scale.y)
  const lower = Math.abs(hand.position.y * arm.scale.y)
  s.direction.copy(target).sub(arm.position)
  const distance = Math.max(
    Math.abs(upper - lower) + 0.001,
    Math.min(upper + lower - 0.001, s.direction.length()),
  )
  s.direction.normalize()
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
  const bend = Math.sqrt(Math.max(0, upper * upper - along * along))
  s.bend.set(index === 0 ? -0.4 : 0.4, -1, 0)
  s.bend.addScaledVector(s.direction, -s.bend.dot(s.direction)).normalize()
  s.elbow.copy(arm.position).addScaledVector(s.direction, along).addScaledVector(s.bend, bend)
  arm.quaternion.setFromUnitVectors(s.down, s.local.copy(s.elbow).sub(arm.position).normalize())
  rig.chest.localToWorld(s.local.copy(target))
  arm.worldToLocal(s.local).sub(elbow.position).normalize()
  elbow.quaternion.setFromUnitVectors(s.down, s.local)
  rig.chest.localToWorld(s.target.copy(target))
  // A few corrections account for the profile's non-uniform limb scale.
  for (let pass = 0; pass < 8; pass++) {
    if (hand.getWorldPosition(s.end).distanceToSquared(s.target) < 0.000004) break
    for (const joint of [elbow, arm]) aimJoint({ joint, hand, scratch: s })
  }
}

function aimJoint(options: { joint: Object3D; hand: Object3D; scratch: Scratch }) {
  const { joint, hand, scratch: s } = options
  joint.getWorldPosition(s.pivot)
  s.end.copy(hand.getWorldPosition(s.end)).sub(s.pivot).normalize()
  s.toward.copy(s.target).sub(s.pivot).normalize()
  s.delta.setFromUnitVectors(s.end, s.toward)
  joint.getWorldQuaternion(s.world).premultiply(s.delta)
  joint.parent!.getWorldQuaternion(s.parent).invert()
  joint.quaternion.copy(s.parent).multiply(s.world)
}
