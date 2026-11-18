import type { Euler, Group, Object3D, Vector3 } from 'three'
import type { AnimatedHuman } from '$lib/tour/humanAnimation'
import type { FightPose, Turn } from './fightPose'

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
  chest: Group
  waist: number
  elbows: readonly Object3D[]
  wrists: readonly Object3D[]
  ankles: readonly Object3D[]
  restWrists: readonly Euler[]
  restAnkles: readonly Euler[]
  probe: Vector3
}

export interface FootPlantAnchor {
  positions: readonly [Vector3, Vector3]
}

export interface PlantFeetOptions {
  anchor: FootPlantAnchor
  /** Authored root travel remains visible while joint-induced foot drift is removed. */
  root?: Turn
  facing: 1 | -1
  transfer?: boolean
  pursuitSupport?: { foot: 0 | 1; weight: number }
}

/** The upper body starts a little above the hip joints. */
const UPPER_BODY_ABOVE_HIP = 0.1
/** The chest pivots at the belt, not at the feet. */
const WAIST_ABOVE_HIP = 0.08
const MAX_ANKLE = 0.9

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
      children.forEach((child) => human.figure.add(child))
      rig.chest.removeFromParent()
    },
  }
}

function buildFightRig(human: AnimatedHuman): FightRig {
  const hip = human.legs[0].position.y
  const elbows = human.arms.map((arm) => arm.children[1])
  const wrists = elbows.map(handOf)
  // A knee holds its shin first and its foot second (`tour/humanLimbs.ts`).
  const ankles = human.knees.map((knee) => knee.children[1])
  return {
    human,
    chest: liftChest(human.figure, hip + UPPER_BODY_ABOVE_HIP),
    waist: hip + WAIST_ABOVE_HIP,
    elbows,
    wrists,
    ankles,
    restWrists: wrists.map((wrist) => wrist.rotation.clone()),
    restAnkles: ankles.map((ankle) => ankle.rotation.clone()),
    probe: human.figure.position.clone(),
  }
}

function handOf(elbow: Object3D): Object3D {
  return elbow.children.find((child) => child.name.startsWith('hand-')) ?? elbow
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

export function applyFightPose(rig: FightRig, pose: FightPose, facing: 1 | -1): void {
  const { human } = rig
  const sides = sidesFor(facing)
  const { mirror } = sides
  if (pose.root) {
    human.figure.position.x += pose.root[0] * mirror
    human.figure.position.y += pose.root[1]
    human.figure.position.z += pose.root[2]
  }
  turnBy(human.figure, pose.body, mirror)
  turnBy(human.head, pose.head, mirror)
  applyChest(rig, pose.chest, mirror)
  applyLimbs(rig, pose, sides)
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
  turnBy(human.legs[lead], pose.leadHip, mirror)
  turnBy(human.legs[rear], pose.rearHip, mirror)
  turnBy(human.knees[lead], pose.leadKnee, mirror)
  turnBy(human.knees[rear], pose.rearKnee, mirror)
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
  return { positions }
}

/**
 * Keep the soles flat and the lower foot where it was before the pose bent the
 * legs: a crouch then sinks the body instead of pushing the feet through the
 * floor, and a kick lifts one foot while the other stays planted.
 */
export function plantFeet(rig: FightRig, options: PlantFeetOptions): void {
  const { human } = rig
  rig.ankles.forEach((ankle, index) => {
    const pitch = human.legs[index].rotation.x + human.knees[index].rotation.x
    const level = -(pitch + human.figure.rotation.x)
    ankle.rotation.x += Math.min(MAX_ANKLE, Math.max(-MAX_ANKLE, level))
  })
  const after = captureFootPlant(rig)
  const support = after.positions[0].y <= after.positions[1].y ? 0 : 1
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
  human.figure.position.add(correction)
}

function biasPursuitSupport(
  correction: Vector3,
  options: PlantFeetOptions & { after: FootPlantAnchor },
): void {
  const { pursuitSupport, anchor, after } = options
  if (!pursuitSupport?.weight) return
  const planted = anchor.positions[pursuitSupport.foot]
  const drawn = after.positions[pursuitSupport.foot]
  correction.x += (planted.x - drawn.x - correction.x) * pursuitSupport.weight
  correction.z += (planted.z - drawn.z - correction.z) * pursuitSupport.weight
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
