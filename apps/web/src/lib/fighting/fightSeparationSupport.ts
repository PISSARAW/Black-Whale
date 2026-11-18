import { constrainCombatJoint } from './fightAnatomy'
import { Quaternion, Vector3, type Object3D } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { fightRigOf, type FightRig } from './fightRig'
import { reachLimb } from './fightLimbReach'
import { preserveSupportDepth } from './fightSupportDepth'
import { supportCycle } from './fightSupportCycle'
import { clearFootTarget } from './fightLimbClearance'
import type { ArcadeFighter } from './types'

interface Foot {
  anchor: Vector3
  from?: Vector3
  destination?: Vector3
  age: number
}
interface Support {
  feet: Foot[]
  frame: number
  ground: number
}

type Timing = { frame: number; frozen: boolean; rival?: Object3D }
interface Prepared {
  figure: Object3D
  frame: number
  rig: FightRig
  targets: Vector3[]
  cycle: ReturnType<typeof supportCycle>
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
    const soles = rig.ankles.map((ankle) => ankle.getWorldPosition(new Vector3()))
    if (!support || timing.frame < support.frame)
      support = {
        feet: soles.map((anchor) => ({ anchor: anchor.clone(), age: 0 })),
        frame: timing.frame,
        ground: Math.min(...soles.map((p) => p.y)),
      }
    const dt = timing.frozen ? 0 : Math.max(0, timing.frame - support.frame)
    support.frame = timing.frame
    const cycle = supportCycle(fighter)
    const targets = support.feet.map((foot, index) => {
      if (cycle.free === index) {
        releaseFoot(foot, soles[index], support!.ground)
        return soles[index]
      }
      const target = supportTarget(foot, soles[index], {
        dt,
        ground: support!.ground,
        planted: cycle.support === index,
      })
      return timing.rival ? clearFootTarget(target, timing.rival, fighter.facing) : target
    })
    prepared = { figure, frame: timing.frame, rig, targets, cycle }
    preserveSupportDepth(rig, targets, cycle.free)
  }
  const sync = (figure: Object3D, fighter: ArcadeFighter, timing: Timing) => {
    if (!prepared || prepared.figure !== figure || prepared.frame !== timing.frame)
      prepare(figure, fighter, timing)
    if (!prepared) return
    const { rig, targets, cycle } = prepared
    for (const [index, target] of targets.entries()) {
      if (cycle.free === index) continue
      pinFoot(rig, index, { target, pivot: cycle.support === index ? cycle.pivot : 0 })
    }
  }
  return Object.assign(sync, { prepare })
}

function releaseFoot(foot: Foot, sole: Vector3, ground: number) {
  foot.anchor.set(sole.x, ground, sole.z)
  foot.destination = undefined
}

function groundedSupport(fighter: ArcadeFighter): boolean {
  return (
    fighter.y <= 0 &&
    fighter.health > 0 &&
    !['down', 'ko', 'wakeup', 'walk'].includes(fighter.pose) &&
    !fighter.motion?.dash &&
    !fighter.hanzoProjection &&
    !fighter.luiniPassage
  )
}

function supportTarget(
  foot: Foot,
  sole: Vector3,
  timing: { dt: number; ground: number; planted: boolean },
): Vector3 {
  const drift = Math.hypot(sole.x - foot.anchor.x, sole.z - foot.anchor.z)
  const wantsStep = drift > (timing.planted ? 0.28 : 0.14)
  if (!foot.destination && wantsStep) {
    foot.from = foot.anchor.clone()
    foot.destination = new Vector3(sole.x, timing.ground, sole.z)
    foot.age = 0
  }
  if (!foot.destination) return foot.anchor.clone()
  foot.age += timing.dt
  const p = Math.min(1, foot.age / 9)
  const target = foot.from!.clone().lerp(foot.destination, p * p * (3 - 2 * p))
  target.y = timing.ground + Math.sin(Math.PI * p) * 0.065
  if (p === 1) {
    foot.anchor.copy(foot.destination)
    foot.destination = undefined
  }
  return target
}

function pinFoot(rig: FightRig, index: number, input: { target: Vector3; pivot: number }) {
  const ankle = rig.ankles[index]
  const flat = ankle.getWorldQuaternion(new Quaternion())
  reachLimb(
    { root: rig.human.legs[index], hinge: rig.human.knees[index], end: ankle },
    input.target,
  )
  const turn = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), input.pivot)
  flat.premultiply(turn)
  ankle.quaternion.copy(ankle.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(flat))
  constrainCombatJoint(ankle, 'ankle')
}
