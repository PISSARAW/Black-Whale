import { constrainCombatJoint, constrainFightRig } from './fightAnatomy'
import { applyProceduralClavicles } from './fightClavicle'
import type { Euler, Group, Object3D, Vector3 } from 'three'
import { humanJointSlots, type AnimatedHuman } from '$lib/tour/humanAnimation'
import { humanFootContactPoint } from '$lib/tour/humanFootContact'
import type { FightPose, Turn } from './fightPose'
import { humanChestTurn, keepHumanJoint, keepHumanJoints } from './fightJointLimits'

/**
 * The shared human figure, seen with the joints a duel needs.
 *
 * The visit's rig turns shoulders, hips, knees and the whole figure; a punch
 * built on that is a stiff arm swung from the shoulder. This adds, for the
 * fighting scene only:
 * - a chest that twists and leans about the waist, carrying head and arms;
 * - elbows, wrists and ankles;
 * - feet that stay on the floor whatever the knees do.
 *
 * Nothing in `tour/` changes. The chest is a group slipped between the figure
 * and its upper-body parts the first time a fighter is posed; at rest it is the
 * identity, so every transform the visit's animation resets keeps its meaning.
 */
export interface FightRig {
  human: AnimatedHuman
  /** The current authored plan owns whether the soles may be constrained. */
  planted?: boolean
  chest: Group
  waist: number
  elbows: readonly Object3D[]
  wrists: readonly Object3D[]
  ankles: readonly Object3D[]
  restShoulders: readonly Vector3[]
  restWrists: readonly Euler[]
  restAnkles: readonly Euler[]
  probe: Vector3
}

export interface FootPlantAnchor {
  positions: readonly [Vector3, Vector3]
  contacts?: readonly [Vector3, Vector3]
}

export interface PlantFeetOptions {
  anchor: FootPlantAnchor
  /** Authored root travel remains visible while joint-induced foot drift is removed. */
  root?: Turn
  facing: 1 | -1
  transfer?: boolean
  support?: number
  horizontal?: boolean
  pursuitSupport?: { foot: 0 | 1 | 'both'; weight: number }
  anchorLowest?: boolean
  pivot?: { index: number; angle: number }
}

/** The upper body starts a little above the hip joints. */
const UPPER_BODY_ABOVE_HIP = 0.1
/** The chest pivots at the belt, not at the feet. */
const WAIST_ABOVE_HIP = 0.08
const MAX_ANKLE = 0.9
const MAX_SOLE_LIFT = 0.075

const RIGS = new WeakMap<Object3D, FightRig>()

export function hasFightRig(figure: Object3D): boolean {
  return RIGS.has(figure)
}

export function fightRigOf(human: AnimatedHuman): FightRig {
  const held = RIGS.get(human.figure)
  if (held) return held
  const made = buildFightRig(human)
  RIGS.set(human.figure, made)
  return made
}

/** A presentation may borrow the production rig without changing the model hierarchy permanently. */
export function borrowFightRig(human: AnimatedHuman): { rig: FightRig; restore: () => void } {
  const held = RIGS.get(human.figure)
  if (held) return { rig: held, restore: () => {} }
  const children = [...human.figure.children]
  const rig = buildFightRig(human)
  return {
    rig,
    restore() {
      rig.human.arms.forEach((arm, index) => arm.position.copy(rig.restShoulders[index]))
      children.forEach((child) => human.figure.add(child))
      rig.chest.removeFromParent()
    },
  }
}

function buildFightRig(human: AnimatedHuman): FightRig {
  const hip = human.legs[0].position.y
  const joints = humanJointSlots(human)
  const elbows = joints.elbows
  const wrists = joints.hands
  const ankles = joints.feet
  return {
    human,
    chest: liftChest(human.figure, hip + UPPER_BODY_ABOVE_HIP),
    waist: hip + WAIST_ABOVE_HIP,
    elbows,
    wrists,
    ankles,
    restShoulders: human.arms.map((arm) => arm.position.clone()),
    restWrists: wrists.map((wrist) => wrist.rotation.clone()),
    restAnkles: ankles.map((ankle) => ankle.rotation.clone()),
    probe: human.figure.position.clone(),
  }
}

function liftChest(figure: Group, above: number): Group {
  // Built from the figure's own class: importing three here would pull the
  // whole renderer into the page's first chunk, which FightScene keeps lazy.
  const GroupClass = figure.constructor as new () => Group
  const chest = new GroupClass()
  chest.name = 'fight-chest'
  const upper = figure.children.filter((child) => child.position.y > above)
  figure.add(chest)
  upper.forEach((part) => chest.add(part))
  return chest
}

/** Undo last frame's extra joints; the visit's animation has reset the rest. */
export function resetFightRig(rig: FightRig): void {
  rig.chest.position.set(0, 0, 0)
  rig.chest.rotation.set(0, 0, 0)
  rig.human.arms.forEach((arm, index) => arm.position.copy(rig.restShoulders[index]))
  rig.wrists.forEach((wrist, index) => wrist.rotation.copy(rig.restWrists[index]))
  rig.ankles.forEach((ankle, index) => ankle.rotation.copy(rig.restAnkles[index]))
}

interface PoseSides {
  lead: number
  rear: number
  /** -1 when the pose is mirrored for a fighter facing left. */
  mirror: 1 | -1
}

function sidesFor(facing: 1 | -1): PoseSides {
  // Facing right, arm 1 is upstage (away from the camera) and leads.
  return facing === 1 ? { lead: 1, rear: 0, mirror: 1 } : { lead: 0, rear: 1, mirror: -1 }
}

function turnBy(part: Object3D, turn: Turn | undefined, mirror: 1 | -1): void {
  if (!turn) return
  part.rotation.x += turn[0]
  part.rotation.y += turn[1] * mirror
  part.rotation.z += turn[2] * mirror
}

type PoseOrientation = 1 | -1 | { facing: 1 | -1; planted: boolean }

export function applyFightPose(rig: FightRig, pose: FightPose, orientation: PoseOrientation): void {
  const { human } = rig
  const facing = typeof orientation === 'number' ? orientation : orientation.facing
  const planted = typeof orientation !== 'number' && orientation.planted
  const sides = sidesFor(facing)
  const { mirror } = sides
  if (pose.root) {
    human.figure.position.x += pose.root[0] * mirror
    human.figure.position.y += pose.root[1]
    human.figure.position.z += pose.root[2]
  }
  const chest = applyBodyTurns(rig, pose, { mirror, planted })
  turnBy(human.head, pose.neck, mirror)
  turnBy(human.head, pose.head, mirror)
  applyChest(rig, chest && humanChestTurn(chest), mirror)
  applyLimbs(rig, pose, sides)
  keepHumanJoints(rig)
  constrainFightRig(rig)
  applyProceduralClavicles(rig.human.arms, rig.restShoulders)
  applyAuthoredClavicles(rig, pose, sides)
}

/** In a planted pose the feet support the hips; pitch and roll articulate at the waist. */
function applyBodyTurns(
  rig: FightRig,
  pose: FightPose,
  { mirror, planted }: { mirror: 1 | -1; planted: boolean },
): Turn | undefined {
  const figure = rig.human.figure
  if (!planted) {
    turnBy(figure, pose.pelvis, mirror)
    turnBy(figure, pose.body, mirror)
    return pose.chest
  }
  const [hipPitch, hipYaw, hipRoll] = pose.pelvis ?? [0, 0, 0]
  const [bodyPitch, bodyYaw, bodyRoll] = pose.body ?? [0, 0, 0]
  const [chestPitch, chestYaw, chestRoll] = pose.chest ?? [0, 0, 0]
  figure.rotation.x = 0
  figure.rotation.z = 0
  figure.rotation.y += (hipYaw + bodyYaw) * mirror
  return [
    chestPitch + (hipPitch + bodyPitch) * 0.5,
    chestYaw,
    chestRoll + (hipRoll + bodyRoll) * 0.5,
  ]
}

function applyChest(rig: FightRig, chest: Turn | undefined, mirror: 1 | -1): void {
  if (!chest) return
  turnBy(rig.chest, chest, mirror)
  // Turn about the waist: move the pivot back to where it was.
  rig.chest.position.set(0, rig.waist, 0).applyEuler(rig.chest.rotation).multiplyScalar(-1)
  rig.chest.position.y += rig.waist
  // The gaze stays on the opponent while the shoulders turn under it.
  rig.human.head.rotation.y -= chest[1] * mirror * 0.8
}

function applyLimbs(rig: FightRig, pose: FightPose, sides: PoseSides): void {
  const { human } = rig
  const { lead, rear, mirror } = sides
  turnBy(human.arms[lead], pose.leadShoulder, mirror)
  turnBy(human.arms[rear], pose.rearShoulder, mirror)
  turnBy(rig.elbows[lead], pose.leadElbow, mirror)
  turnBy(rig.elbows[rear], pose.rearElbow, mirror)
  turnBy(rig.wrists[lead], pose.leadWrist, mirror)
  turnBy(rig.wrists[rear], pose.rearWrist, mirror)
  turnBy(rig.wrists[lead], pose.leadPalm, mirror)
  turnBy(rig.wrists[rear], pose.rearPalm, mirror)
  turnBy(human.legs[lead], pose.leadHip, mirror)
  turnBy(human.legs[rear], pose.rearHip, mirror)
  turnBy(human.knees[lead], pose.leadKnee, mirror)
  turnBy(human.knees[rear], pose.rearKnee, mirror)
  turnBy(rig.ankles[lead], pose.leadFoot, mirror)
  turnBy(rig.ankles[rear], pose.rearFoot, mirror)
}

function applyAuthoredClavicles(rig: FightRig, pose: FightPose, sides: PoseSides): void {
  const { lead, rear, mirror } = sides
  shiftClavicle(rig.human.arms[lead], pose.leadClavicle, mirror)
  shiftClavicle(rig.human.arms[rear], pose.rearClavicle, mirror)
}

function shiftClavicle(part: Object3D, shift: Turn | undefined, mirror: 1 | -1): void {
  if (!shift) return
  part.position.x += clamp(shift[0], -0.055, 0.055) * mirror
  part.position.y += clamp(shift[1], -0.05, 0.05)
  part.position.z += clamp(shift[2], -0.055, 0.055)
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

/** Height of the lower foot, in the space the figure stands in. */
export function footHeight(rig: FightRig): number {
  return Math.min(...captureFootPlant(rig).positions.map((position) => position.y))
}

/** Positions of both soles in the fighter model's ground space. */
export function captureFootPlant(rig: FightRig): FootPlantAnchor {
  const { figure } = rig.human
  const ground = figure.parent ?? figure
  // getWorldPosition/worldToLocal update the ankle’s ancestor chain themselves.
  // Updating every decorative descendant here repeated the renderer’s traversal
  // twice per fighter and frame without changing either sole’s transform.
  const positions = rig.ankles.map((ankle) =>
    ground.worldToLocal(ankle.getWorldPosition(rig.probe)).clone(),
  ) as [Vector3, Vector3]
  const contacts = rig.ankles.map((ankle) => humanFootContactPoint(ankle, ground, rig.probe)) as [
    Vector3,
    Vector3,
  ]
  return { positions, contacts }
}

/**
 * Keep the soles flat and the lower foot where it was before the pose bent the
 * legs: a crouch then sinks the body instead of pushing the feet through the
 * floor, and a kick lifts one foot while the other stays planted.
 */
export function plantFeet(rig: FightRig, options: PlantFeetOptions): void {
  const { human } = rig
  if (options.pivot) {
    rig.ankles[options.pivot.index].rotation.y += options.pivot.angle * options.facing
    keepHumanJoint(rig.ankles[options.pivot.index], 'ankle')
    constrainCombatJoint(rig.ankles[options.pivot.index], 'ankle')
  }
  rig.ankles.forEach((ankle, index) => {
    const pitch = human.legs[index].rotation.x + human.knees[index].rotation.x
    const level = -(pitch + human.figure.rotation.x)
    ankle.rotation.x += Math.min(MAX_ANKLE, Math.max(-MAX_ANKLE, level))
    keepHumanJoint(ankle, 'ankle')
    constrainCombatJoint(ankle, 'ankle')
  })
  const after = captureFootPlant(rig)
  const support = options.support ?? (after.positions[0].y <= after.positions[1].y ? 0 : 1)
  const target = options.anchor.positions[support].clone()
  const root = options.root ?? [0, 0, 0]
  target.x += root[0] * options.facing
  if (options.transfer)
    target.y = Math.min(options.anchor.positions[0].y, options.anchor.positions[1].y)
  target.y += root[1]
  target.z += root[2]
  const correction = target.sub(after.positions[support])
  if (options.transfer) blendFootCorrections(correction, { ...options, after, support })
  biasPursuitSupport(correction, { ...options, after })
  if (options.anchorLowest) {
    correction.y =
      Math.min(options.anchor.positions[0].y, options.anchor.positions[1].y) +
      root[1] -
      Math.min(after.positions[0].y, after.positions[1].y)
  }
  if (options.horizontal === false) correction.x = correction.z = 0
  human.figure.position.add(correction)
  // Semantic contact correction follows the legacy ankle constraint.
  liftPenetratingSole(rig, options, support)
}

function liftPenetratingSole(rig: FightRig, options: PlantFeetOptions, support: number): void {
  const target = options.anchor.contacts?.[support]
  if (!target) return
  const ground = rig.human.figure.parent ?? rig.human.figure
  const current = humanFootContactPoint(rig.ankles[support], ground, rig.probe)
  const lift = target.y + (options.root?.[1] ?? 0) - current.y
  if (lift > 0.002) rig.human.figure.position.y += Math.min(MAX_SOLE_LIFT, lift)
}

function biasPursuitSupport(
  correction: Vector3,
  options: PlantFeetOptions & { after: FootPlantAnchor },
): void {
  const { pursuitSupport, anchor, after } = options
  if (!pursuitSupport?.weight) return
  const feet = pursuitSupport.foot === 'both' ? [0, 1] : [pursuitSupport.foot]
  const drift = feet.reduce(
    (total, foot) => total.add(anchor.positions[foot]).sub(after.positions[foot]),
    correction.clone().set(0, 0, 0),
  )
  drift.divideScalar(feet.length)
  correction.x += (drift.x - correction.x) * pursuitSupport.weight
  correction.z += (drift.z - correction.z) * pursuitSupport.weight
}

function blendFootCorrections(
  correction: Vector3,
  options: PlantFeetOptions & { after: FootPlantAnchor; support: number },
): void {
  const { after, support, anchor, root, facing } = options
  const other = 1 - support
  const gap = Math.abs(after.positions[other].y - after.positions[support].y)
  const t = Math.min(1, gap / 0.14)
  const weight = (1 - t * t * (3 - 2 * t)) * 0.5
  const x = anchor.positions[other].x - after.positions[other].x + (root?.[0] ?? 0) * facing
  const z = anchor.positions[other].z - after.positions[other].z + (root?.[2] ?? 0)
  correction.x += (x - correction.x) * weight
  correction.z += (z - correction.z) * weight
}
