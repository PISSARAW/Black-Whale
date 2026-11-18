import { Quaternion, Vector3, type Object3D } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { fightRigOf, type FightRig } from './fightRig'
import { fightStrikeLimb } from './fightStrikeLimb'
import { rosterMoveShape } from './rosterStrikeMotion'
import { physicalRosterPair } from './fightPhysicalRoster'
import { attackData } from './frameData'
import { createFightBodySeparation, bodySurfaceBox, projectionBody } from './fightBodySeparation'
import type { ArcadeFighter, FightNenZone, FightSide, FightState } from './types'

/** Bounded anatomical correction after both actors have been posed, before aura and impacts. */
export function createFightContactAlignment(figureOf: (side: FightSide) => Object3D) {
  const separateBodies = createFightBodySeparation(figureOf)
  return (state: FightState) => {
    separateBodies(state)
    if (!physicalRosterPair(state.player.id, state.opponent.id)) return
    for (const side of ['player', 'opponent'] as const) {
      const fighter = state[side],
        other = side === 'player' ? 'opponent' : 'player'
      const weight = contactWeight(fighter, state[other])
      if (weight <= 0) continue
      const own = humanAnimationRig(figureOf(side)),
        rival = humanAnimationRig(figureOf(other))
      if (!own || !rival) continue
      const target = fightContactTarget(
        fightRigOf(rival),
        attackData(fighter.attack!.kind, fighter).targetZone,
        fighter.facing,
      )
      alignStrike(fightRigOf(own), fighter, { target, weight })
    }
  }
}

function contactWeight(fighter: ArcadeFighter, rival: ArcadeFighter): number {
  const attack = fighter.attack
  if (!attack || !['light', 'heavy'].includes(attack.kind) || attack.variant === 'throw') return 0
  if (!materialStrike(fighter, rival)) return 0
  const data = attackData(attack.kind, fighter)
  if (Math.abs(fighter.x - rival.x) > data.box.right + 2) return 0
  const approach = Math.max(0, Math.min(1, (attack.frame - data.startup + 3) / 3))
  const release = Math.max(0, 1 - Math.max(0, attack.frame - data.startup - data.active) / 4)
  return approach * release
}

export function fightContactTarget(rig: FightRig, zone: FightNenZone, facing: 1 | -1): Vector3 {
  const part = contactPart(rig, zone)
  const target = part.getWorldPosition(new Vector3())
  const skin = bodySurfaceBox(part)
  target.x = facing === 1 ? skin.min.x - 0.015 : skin.max.x + 0.015
  return target
}

function contactPart(rig: FightRig, zone: FightNenZone): Object3D {
  if (zone === 'feet') return rig.ankles[0]
  return zone === 'head' ? rig.human.head.children[0] : rig.human.torso
}

function alignStrike(
  rig: FightRig,
  fighter: ArcadeFighter,
  options: { target: Vector3; weight: number },
) {
  const shape = rosterMoveShape(fighter.attack!.moveId)
  const feet = ['kick', 'lowKick', 'sweep', 'dive'].includes(shape ?? '')
  const limb = fightStrikeLimb(fighter, feet ? 'feet' : 'hands')
  const indices = limb === 'both' ? [0, 1] : [limb === 'left' ? 0 : 1]
  for (const index of indices) {
    const { root, hinge, end } = strikeParts(rig, { fighter, feet, index })
    for (let pass = 0; pass < 4; pass++) {
      aimHinge(hinge, end, options)
      aimRoot(root, end, options)
    }
  }
}

function strikeParts(
  rig: FightRig,
  options: { fighter: ArcadeFighter; feet: boolean; index: number },
) {
  const { fighter, feet, index } = options
  const tool = fighter.id === 'shizuku' ? rig.human.figure.getObjectByName('shizuku-blinky') : null
  return {
    root: feet ? rig.human.legs[index] : rig.human.arms[index],
    hinge: feet ? rig.human.knees[index] : rig.elbows[index],
    end: tool ?? (feet ? rig.ankles[index] : rig.wrists[index]),
  }
}

function aimHinge(joint: Object3D, end: Object3D, options: { target: Vector3; weight: number }) {
  const from = joint.worldToLocal(end.getWorldPosition(new Vector3()))
  const to = joint.worldToLocal(options.target.clone())
  const angle = Math.atan2(from.y * to.z - from.z * to.y, from.y * to.y + from.z * to.z)
  joint.rotateX(clamp(angle, 0.12 * options.weight))
}

function aimRoot(joint: Object3D, end: Object3D, options: { target: Vector3; weight: number }) {
  const from = joint.worldToLocal(end.getWorldPosition(new Vector3())).normalize()
  const to = joint.worldToLocal(options.target.clone()).normalize()
  const rotation = new Quaternion().setFromUnitVectors(from, to)
  const angle = rotation.angleTo(new Quaternion())
  rotation.slerp(
    new Quaternion(),
    1 - Math.min(1, (0.12 * options.weight) / Math.max(0.001, angle)),
  )
  joint.quaternion.multiply(rotation)
}

function clamp(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value))
}

function materialStrike(fighter: ArcadeFighter, rival: ArcadeFighter): boolean {
  return (
    !projectionBody(fighter) &&
    !projectionBody(rival) &&
    Boolean(rosterMoveShape(fighter.attack?.moveId))
  )
}
