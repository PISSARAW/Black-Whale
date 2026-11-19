import { constrainCombatJoint } from './fightAnatomy'
import { Quaternion, Vector3, type Object3D } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { fightRigOf, type FightRig } from './fightRig'
import { reachFightFoot } from './fightFootReach'
import { keepHumanJoint } from './fightJointLimits'
import { preserveSupportDepth } from './fightSupportDepth'
import { supportCycle } from './fightSupportCycle'
import { clearFootTarget } from './fightLimbClearance'
import { shuffleSupport } from './fightShuffleStep'
import { FOOT_CLEARANCE, levelFightFoot, lowestFootHeight } from './fightFootContact'
import type { ArcadeFighter } from './types'
import { FIGHT_WORLD_X } from './fightCoordinates'

interface Foot {
  anchor: Vector3
  from?: Vector3
  destination?: Vector3
  age: number
  ground: number
  bend?: number
  swing?: { from: Vector3; to: Vector3; started: number }
}
interface Support {
  feet: Foot[]
  frame: number
  scale: number
  facing: number
  direction: number
  walk?: { x: number; free: number }
}

type Timing = { frame: number; frozen: boolean; rival?: Object3D }
interface Prepared {
  figure: Object3D
  frame: number
  rig: FightRig
  targets: Vector3[]
  cycle: ReturnType<typeof supportCycle>
  walking: boolean
  dt: number
  resting: boolean
  floor: number
}

/** Prepare pelvis depth before core separation, then pin the soles after both bodies have been placed. */
export function createSeparationSupport() {
  let support: Support | undefined
  let prepared: Prepared | undefined
  const prepare = (figure: Object3D, fighter: ArcadeFighter, timing: Timing) => {
    const human = humanAnimationRig(figure)
    if (!human || !groundedSupport(fighter)) {
      support = undefined
      prepared = undefined
      return
    }
    const rig = fightRigOf(human)
    if (rig.planted === false) {
      support = undefined
      prepared = undefined
      return
    }
    const walking = walkingBody(fighter)
    const nominal = walking ? shuffleSupport(fighter) : undefined
    const direction = nominal?.direction ?? 0
    const reset = needsSupportReset(support, rig, { fighter, frame: timing.frame, direction })
    const { walk, gait, cycle } = walkingCycle(support, rig, { fighter, nominal, reset })
    const { floor, soles, grounds } = groundRig(rig, cycle)
    if (reset)
      support = {
        feet: soles.map((sole, i) => ({
          anchor: new Vector3(sole.x, grounds[i], sole.z),
          age: 0,
          ground: grounds[i],
        })),
        frame: timing.frame,
        scale: human.figure.scale.y,
        facing: fighter.facing,
        direction,
        walk,
      }
    if (!support) return
    const dt = timing.frozen ? 0 : Math.max(0, timing.frame - support.frame)
    support.frame = timing.frame
    const targets = support.feet.map((foot, index) => {
      foot.ground = grounds[index]
      if (gait)
        return walkTarget(foot, soles[index], {
          gait,
          index,
          hipX: human.legs[index].getWorldPosition(new Vector3()).x,
        })
      if (cycle.free === index) {
        releaseFoot(foot, soles[index], foot.ground)
        return soles[index]
      }
      const target = supportTarget(foot, soles[index], {
        dt,
        ground: foot.ground,
        planted: cycle.support === index,
        relaxed: !fighter.attack && fighter.hitStun === 0,
        scale: human.figure.scale.y,
      })
      return timing.rival ? clearFootTarget(target, timing.rival, fighter.facing) : target
    })
    prepared = {
      figure,
      frame: timing.frame,
      rig,
      targets,
      cycle,
      walking,
      dt,
      floor,
      resting: restingBody(fighter),
    }
    preserveSupportDepth(rig, targets, { kicking: cycle.free, allowExtension: !walking })
  }
  const sync = (figure: Object3D, fighter: ArcadeFighter, timing: Timing) => {
    if (!prepared || prepared.figure !== figure || prepared.frame !== timing.frame)
      prepare(figure, fighter, timing)
    if (!prepared || !support) return
    syncFeet(prepared, support)
  }
  return Object.assign(sync, { prepare })
}

function restingBody(fighter: ArcadeFighter): boolean {
  return fighter.pose !== 'walk' && !fighter.attack && fighter.hitStun === 0 && !fighter.crouching
}

function walkingBody(fighter: ArcadeFighter): boolean {
  return fighter.pose === 'walk' && !fighter.attack
}

/** Start over the forward support, then alternate by distance since movement began. */
function walkingCycle(
  support: Support | undefined,
  rig: FightRig,
  input: {
    fighter: ArcadeFighter
    nominal: ReturnType<typeof shuffleSupport> | undefined
    reset: boolean
  },
) {
  const { fighter, nominal } = input
  if (!nominal) return { walk: undefined, gait: undefined, cycle: supportCycle(fighter) }
  const soles = rig.ankles.map((ankle) => ankle.getWorldPosition(new Vector3()).x)
  const leading = nominal.direction * (soles[1] - soles[0]) >= 0 ? 1 : 0
  const walk = !input.reset && support?.walk ? support.walk : { x: fighter.x, free: 1 - leading }
  const phase = Math.max(
    0,
    ((fighter.x - walk.x) * nominal.direction * FIGHT_WORLD_X) / nominal.step,
  )
  const free = Math.floor(phase) % 2 === 0 ? walk.free : 1 - walk.free
  const gait = { ...nominal, free, support: 1 - free, progress: phase % 1 }
  return { walk, gait, cycle: gait }
}

function groundRig(rig: FightRig, cycle: Prepared['cycle']) {
  const { human } = rig
  const floor = (human.figure.parent?.getWorldPosition(new Vector3()).y ?? 0) + FOOT_CLEARANCE
  const bottom = Math.min(
    ...rig.ankles
      .filter((_, i) => cycle.free === undefined || i === cycle.support)
      .map(lowestFootHeight),
  )
  if (Number.isFinite(bottom) && human.figure.parent) {
    const position = human.figure.getWorldPosition(new Vector3())
    position.y += floor - bottom
    human.figure.position.copy(human.figure.parent.worldToLocal(position))
  }
  const soles = rig.ankles.map((ankle) => ankle.getWorldPosition(new Vector3()))
  const grounds = rig.ankles.map((ankle, i) => soles[i].y - lowestFootHeight(ankle) + floor)
  return { floor, soles, grounds }
}

/** Contact IK and joint limits run after support IK. Project the final soles,
 * rather than an intermediate ankle origin, onto the physical floor. */
export function settleFightSupport(rig: FightRig, fighter: ArcadeFighter): void {
  if (rig.planted === false || !groundedSupport(fighter)) return
  const cycle = supportCycle(fighter)
  if (cycle.free !== undefined && !walkingBody(fighter)) groundRig(rig, cycle)
  const floor = (rig.human.figure.parent?.getWorldPosition(new Vector3()).y ?? 0) + FOOT_CLEARANCE
  if (!walkingBody(fighter)) clearFloorFeet(rig, floor)
  // Anatomical limits can leave a small residual, especially during a cancel.
  // Resolve it in the root without stretching a bone or lifting both soles.
  groundRig(rig, { support: cycle.support, pivot: 0 })
}

function clearFloorFeet(rig: FightRig, floor: number): void {
  for (const [index, ankle] of rig.ankles.entries()) {
    for (let pass = 0; pass < 3; pass++) {
      const bottom = lowestFootHeight(ankle)
      if (bottom >= floor - 0.0005) break
      const target = ankle.getWorldPosition(new Vector3())
      target.y += floor - bottom
      pinFoot(rig, index, { target, pivot: 0, kneeTravel: Infinity })
    }
  }
}

function needsSupportReset(
  support: Support | undefined,
  rig: FightRig,
  input: { fighter: ArcadeFighter; frame: number; direction: number },
): boolean {
  return (
    !support ||
    input.frame < support.frame ||
    support.scale !== rig.human.figure.scale.y ||
    support.facing !== input.fighter.facing ||
    support.direction !== input.direction
  )
}

function syncFeet(prepared: Prepared, support: Support) {
  const { rig, targets, cycle, walking, dt, resting, floor } = prepared
  for (const [index, target] of targets.entries()) {
    if (!walking && cycle.free === index) continue
    const options = {
      target,
      pivot: cycle.support === index ? cycle.pivot : 0,
      bend: support.feet[index].bend,
      kneeTravel: resting ? (dt * 4) / 60 : Infinity,
    }
    const surface = floor + target.y - support.feet[index].ground
    for (let pass = 0; pass < 3; pass++) {
      pinFoot(rig, index, options)
      const correction = surface - lowestFootHeight(rig.ankles[index])
      if (Math.abs(correction) < 0.0005) break
      options.target = options.target.clone()
      options.target.y += correction
      options.pivot = 0
    }
    support.feet[index].bend = rig.human.knees[index].rotation.x
  }
}

function releaseFoot(foot: Foot, sole: Vector3, ground: number) {
  foot.anchor.set(sole.x, ground, sole.z)
  foot.destination = undefined
}

/** A planted sole stays put; the other travels through an explicit swing and lands ahead. */
function walkTarget(
  foot: Foot,
  sole: Vector3,
  input: { gait: ReturnType<typeof shuffleSupport>; index: number; hipX: number },
): Vector3 {
  const { gait, index, hipX } = input
  if (gait.free !== index) {
    if (foot.swing) foot.anchor.copy(foot.swing.to)
    foot.swing = undefined
    foot.anchor.y = foot.ground
    return foot.anchor.clone()
  }
  if (!foot.swing) {
    const to = sole.clone()
    // Land ahead of the pelvis so it travels over the support, rather than
    // dragging a foot that has already fallen behind the body.
    to.x = hipX + gait.direction * gait.step * (1 - gait.progress) * 1.5
    to.y = foot.ground
    foot.swing = { from: foot.anchor.clone(), to, started: gait.progress }
  }
  const swing = foot.swing
  const p = Math.max(
    0,
    Math.min(1, (gait.progress - swing.started) / Math.max(0.001, 1 - swing.started)),
  )
  const target = swing.from.clone().lerp(swing.to, p * p * (3 - 2 * p))
  target.y = foot.ground + Math.sin(Math.PI * p) * Math.min(0.07, gait.step * 0.24)
  return target
}

function groundedSupport(fighter: ArcadeFighter): boolean {
  return (
    fighter.y <= 0 &&
    fighter.health > 0 &&
    !['down', 'ko', 'wakeup'].includes(fighter.pose) &&
    !fighter.motion?.dash &&
    !fighter.hanzoProjection &&
    !fighter.luiniPassage
  )
}

function supportTarget(
  foot: Foot,
  sole: Vector3,
  timing: { dt: number; ground: number; planted: boolean; relaxed: boolean; scale: number },
): Vector3 {
  const drift = Math.hypot(sole.x - foot.anchor.x, sole.z - foot.anchor.z)
  const wantsStep = drift > (timing.relaxed ? 0.025 * timing.scale : timing.planted ? 0.28 : 0.14)
  if (!foot.destination && wantsStep) {
    foot.from = foot.anchor.clone()
    foot.destination = new Vector3(sole.x, timing.ground, sole.z)
    foot.age = 0
  }
  if (!foot.destination) {
    foot.anchor.y = timing.ground
    return foot.anchor.clone()
  }
  foot.age += timing.dt
  const p = Math.min(1, foot.age / 9)
  const target = foot.from!.clone().lerp(foot.destination, p * p * (3 - 2 * p))
  // A weight transfer may land on a foot whose previous step is still running.
  // Keep that sole down before allowing the other foot to swing.
  target.y = timing.ground + (timing.planted ? 0 : Math.sin(Math.PI * p) * 0.065)
  if (p === 1) {
    foot.anchor.copy(foot.destination)
    foot.destination = undefined
  }
  return target
}

function pinFoot(
  rig: FightRig,
  index: number,
  input: { target: Vector3; pivot: number; bend?: number; kneeTravel: number },
) {
  const ankle = rig.ankles[index]
  const flat = ankle.getWorldQuaternion(new Quaternion())
  reachFightFoot(
    { root: rig.human.legs[index], hinge: rig.human.knees[index], end: ankle },
    input.target,
    {
      preferredKnee: input.bend,
      kneeTravel: input.bend === undefined ? Infinity : input.kneeTravel,
    },
  )
  const turn = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), input.pivot)
  flat.premultiply(turn)
  ankle.quaternion.copy(ankle.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(flat))
  levelFightFoot(ankle)
  keepHumanJoint(ankle, 'ankle')
  constrainCombatJoint(ankle, 'ankle')
}
