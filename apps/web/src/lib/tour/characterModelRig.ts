import type { Bone, Object3D, Quaternion, Vector3 } from 'three'
import type { AnimatedHuman } from './humanAnimation'
import type { CharacterModelBones } from './characterModels'
import { CANON } from './humanProportions'

type Three = typeof import('three')

/**
 * The skeleton adapter: the procedural body stays the authority, the GLB copies it.
 *
 * Every pose the combat and the walk know — attacks, hit reactions, throws,
 * dodges, the stride synchronised to ground speed — is written on the
 * procedural joints by `humanAnimation` and its motion layers. This module
 * reads those joints after they have moved and lays the model's bones on them:
 *
 * - the hips, the chest and the head copy the procedural joint's *rotation
 *   since rest*, so an upright GLB stays upright where the body is upright;
 * - each limb segment is *aimed* along the procedural segment, which needs no
 *   agreement between the two rest poses (Meshy rigs in T-pose, the house body
 *   rests with its arms down).
 *
 * Sides are paired by where they stand, not by name: the house calls the joint
 * at negative X `left`, a Meshy rig facing +Z puts `LeftArm` at positive X.
 */
export interface CharacterRig {
  /** Re-lay the bones on the procedural joints as they are now. */
  follow: () => void
}

interface Point {
  node: Object3D
  local: Vector3
}

interface Aim {
  bone: Object3D
  tip: Object3D
  from: Point
  to: Point
}

interface Copy {
  bone: Object3D
  driver: Object3D
  driverRest: Quaternion
  boneRest: Quaternion
}

interface Scratch {
  a: Vector3
  b: Vector3
  c: Vector3
  q: Quaternion
  r: Quaternion
  t: Quaternion
  figure: Quaternion
}

interface Rest {
  bone: Object3D
  position: Vector3
  quaternion: Quaternion
}

export interface CharacterRigBuild {
  THREE: Three
  rig: AnimatedHuman
  instance: Object3D
  bones: CharacterModelBones
}

/** Build the adapter. Both bodies must stand at rest, world matrices fresh. */
export function createCharacterRig(build: CharacterRigBuild): CharacterRig | undefined {
  const { THREE, rig, instance, bones } = build
  const find = (name: string) => instance.getObjectByName(name)
  const hips = find(bones.hips)
  if (!hips) return undefined
  const scratch: Scratch = {
    a: new THREE.Vector3(),
    b: new THREE.Vector3(),
    c: new THREE.Vector3(),
    q: new THREE.Quaternion(),
    r: new THREE.Quaternion(),
    t: new THREE.Quaternion(),
    figure: new THREE.Quaternion(),
  }
  const rest = restPose(instance)
  const copies = [
    copyOf(THREE, rig, { bone: hips, driver: rig.pelvis }),
    copyOf(THREE, rig, { bone: find(bones.torso), driver: rig.torso }),
    copyOf(THREE, rig, { bone: find(bones.head), driver: rig.head }),
  ].filter((copy): copy is Copy => Boolean(copy))
  const aims = limbAims(THREE, { rig, find, bones })
  const pelvisRest = rig.figure.worldToLocal(rig.pelvis.getWorldPosition(new THREE.Vector3()))
  const hipsRest = rig.figure.worldToLocal(hips.getWorldPosition(new THREE.Vector3()))
  const follow = () => {
    for (const held of rest) {
      held.bone.position.copy(held.position)
      held.bone.quaternion.copy(held.quaternion)
    }
    instance.updateWorldMatrix(true, true)
    rig.figure.getWorldQuaternion(scratch.figure)
    for (const copy of copies) applyCopy(copy, scratch)
    placeHips({ rig, hips, rest: { pelvis: pelvisRest, hips: hipsRest } }, scratch)
    for (const aim of aims) applyAim(aim, scratch)
  }
  return { follow }
}

function restPose(instance: Object3D): Rest[] {
  const held: Rest[] = []
  instance.traverse((node) => {
    if (!(node as Bone).isBone) return
    held.push({ bone: node, position: node.position.clone(), quaternion: node.quaternion.clone() })
  })
  return held
}

/** A joint's orientation in the figure's own frame, so turning the body is not a pose. */
function figureRelative(node: Object3D, figure: Quaternion, out: Quaternion): Quaternion {
  return node.getWorldQuaternion(out).premultiply(figure.clone().invert())
}

function copyOf(
  THREE: Three,
  rig: AnimatedHuman,
  pair: { bone: Object3D | undefined; driver: Object3D },
): Copy | undefined {
  if (!pair.bone) return undefined
  const figure = rig.figure.getWorldQuaternion(new THREE.Quaternion())
  return {
    bone: pair.bone,
    driver: pair.driver,
    driverRest: figureRelative(pair.driver, figure, new THREE.Quaternion()),
    boneRest: figureRelative(pair.bone, figure, new THREE.Quaternion()),
  }
}

/** rotation-since-rest of the driver, applied to the bone's own rest. */
function applyCopy(copy: Copy, scratch: Scratch): void {
  const { q, r, figure } = scratch
  const inverseFigure = r.copy(figure).invert()
  copy.driver.getWorldQuaternion(q).premultiply(inverseFigure)
  q.multiply(r.copy(copy.driverRest).invert())
  q.multiply(copy.boneRest).premultiply(figure)
  setWorldQuaternion(copy.bone, q, scratch)
}

function placeHips(
  placed: { rig: AnimatedHuman; hips: Object3D; rest: { pelvis: Vector3; hips: Vector3 } },
  scratch: Scratch,
): void {
  const { rig, hips, rest } = placed
  const figure = rig.figure
  const offset = figure.worldToLocal(rig.pelvis.getWorldPosition(scratch.a)).sub(rest.pelvis)
  const target = figure.localToWorld(scratch.b.copy(rest.hips).add(offset))
  if (!hips.parent) return
  hips.position.copy(hips.parent.worldToLocal(target))
  hips.updateWorldMatrix(false, true)
}

function setWorldQuaternion(bone: Object3D, world: Quaternion, scratch: Scratch): void {
  const parent = bone.parent
  if (!parent) return
  parent.getWorldQuaternion(scratch.r)
  bone.quaternion.copy(scratch.r.invert().multiply(world))
  bone.updateWorldMatrix(false, true)
}

/** Turn the bone so that bone→tip points where the procedural segment points. */
function applyAim(aim: Aim, scratch: Scratch): void {
  const { a, b, c, q, t } = scratch
  const current = aim.tip.getWorldPosition(b).sub(aim.bone.getWorldPosition(a)).normalize()
  const from = aim.from.node.localToWorld(c.copy(aim.from.local))
  const wanted = aim.to.node.localToWorld(a.copy(aim.to.local)).sub(from).normalize()
  if (current.lengthSq() === 0 || wanted.lengthSq() === 0) return
  q.setFromUnitVectors(current, wanted)
  setWorldQuaternion(aim.bone, aim.bone.getWorldQuaternion(t).premultiply(q), scratch)
}

interface LimbSource {
  rig: AnimatedHuman
  find: (name: string) => Object3D | undefined
  bones: CharacterModelBones
}

/** The procedural landmarks of one side, as points on its joints. */
function sideLandmarks(THREE: Three, rig: AnimatedHuman, index: number) {
  const arm = rig.arms[index]
  const elbow = arm.children[1]
  const hand = elbow.children.find((child) => child.name.startsWith('hand-')) ?? elbow
  const knee = rig.knees[index]
  const at = (node: Object3D, [x, y, z] = [0, 0, 0]) => ({
    node,
    local: new THREE.Vector3(x, y, z),
  })
  return {
    shoulder: at(arm),
    elbow: at(elbow),
    hand: at(hand),
    fingers: at(hand, [0, -0.09, 0]),
    hip: at(rig.legs[index]),
    knee: at(knee),
    ankle: at(knee, [0, -CANON.shin, 0]),
    toe: at(knee, [0, -CANON.shin, 0.14]),
  }
}

/** The procedural side whose shoulder stands on the same side of X as this bone. */
function sameSide(THREE: Three, rig: AnimatedHuman, bone: Object3D): number {
  const x = (node: Object3D) =>
    rig.figure.worldToLocal(node.getWorldPosition(new THREE.Vector3())).x
  const boneX = x(bone)
  const firstX = x(rig.arms[0])
  return Math.sign(boneX) === Math.sign(firstX) ? 0 : 1
}

function limbAims(THREE: Three, source: LimbSource): Aim[] {
  const { rig, find, bones } = source
  const sides = [
    [
      bones.leftUpperArm,
      bones.leftForearm,
      bones.leftHand,
      bones.leftThigh,
      bones.leftShin,
      bones.leftFoot,
    ],
    [
      bones.rightUpperArm,
      bones.rightForearm,
      bones.rightHand,
      bones.rightThigh,
      bones.rightShin,
      bones.rightFoot,
    ],
  ] as const
  const aims: Aim[] = []
  for (const names of sides) {
    const upper = find(names[0])
    if (!upper) continue
    const p = sideLandmarks(THREE, rig, sameSide(THREE, rig, upper))
    const chain: ReadonlyArray<readonly [string, Point, Point]> = [
      [names[0], p.shoulder, p.elbow],
      [names[1], p.elbow, p.hand],
      [names[2], p.hand, p.fingers],
      [names[3], p.hip, p.knee],
      [names[4], p.knee, p.ankle],
      [names[5], p.ankle, p.toe],
    ]
    for (const [name, from, to] of chain) {
      const bone = find(name)
      const tip = bone?.children.find((child) => (child as Bone).isBone)
      if (bone && tip) aims.push({ bone, tip, from, to })
    }
  }
  return aims
}
