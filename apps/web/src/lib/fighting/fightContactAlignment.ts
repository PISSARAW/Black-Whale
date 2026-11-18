import { settleObservedPose } from './fightSettledPose'
import { constrainFightRig } from './fightAnatomy'
import { Vector3, type Object3D } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { fightRigOf, type FightRig } from './fightRig'
import { fightStrikeLimb } from './fightStrikeLimb'
import { rosterMoveShape } from './rosterStrikeMotion'
import { physicalRosterPair } from './fightPhysicalRoster'
import { attackData } from './frameData'
import { reachLimb } from './fightLimbReach'
import { keepHumanJoints } from './fightJointLimits'
import { createFightContactLatch } from './fightContactLatch'
import { clearPassiveArms } from './fightLimbClearance'
import { anatomicalContactZone, rememberSurfaceContact } from './fightSurfaceContact'
import { createFightBodySeparation, bodySurfaceBox, projectionBody } from './fightBodySeparation'
import type { ArcadeFighter, FightNenZone, FightSide, FightState } from './types'

/** Bounded anatomical correction after both actors have been posed, before aura and impacts. */
export function createFightContactAlignment(figureOf: (side: FightSide) => Object3D) {
  const separateBodies = createFightBodySeparation(figureOf)
  const latches = { player: createFightContactLatch(), opponent: createFightContactLatch() }
  return (state: FightState) => {
    separateBodies(state)
    if (!physicalRosterPair(state.player.id, state.opponent.id)) return
    for (const side of ['player', 'opponent'] as const) {
      const fighter = state[side],
        other = side === 'player' ? 'opponent' : 'player'
      const own = humanAnimationRig(figureOf(side)),
        rival = humanAnimationRig(figureOf(other))
      if (!own || !rival) continue
      if (!projectionBody(fighter) && !projectionBody(state[other]))
        clearPassiveArms(fightRigOf(own), figureOf(other), fighter)
      constrainFightRig(fightRigOf(own))
      const weight = contactWeight(fighter, state[other])
      if (weight <= 0) continue
      const zone = anatomicalContactZone(
        fighter,
        state[other],
        attackData(fighter.attack!.kind, fighter).targetZone,
      )
      const ownRig = fightRigOf(own)
      const fresh = fightContactSurface(fightRigOf(rival), zone, {
        facing: fighter.facing,
        near: strikeRoot(ownRig, fighter).getWorldPosition(new Vector3()),
      })
      const data = attackData(fighter.attack!.kind, fighter)
      const target = latches[side](fighter, contactPart(fightRigOf(rival), zone), {
        position: fresh,
        active:
          fighter.attack!.frame >= data.startup &&
          fighter.attack!.frame < data.startup + data.active,
        identity: `${state.roundNumber}:${state.player.id}:${state.opponent.id}`,
      })
      alignStrike(ownRig, fighter, { target, weight })
      rememberImpactSurface(figureOf(side), { state, side, zone, position: target })
    }
    // This is the final pose boundary: support IK, contact IK, passive arms,
    // expressions and head tracking have all run by now.
    keepFinalJoints(figureOf)
    settleBothBodies(figureOf)
  }
}

function keepFinalJoints(figureOf: (side: FightSide) => Object3D): void {
  for (const side of ['player', 'opponent'] as const) {
    const human = humanAnimationRig(figureOf(side))
    if (human) keepHumanJoints(fightRigOf(human))
  }
}

function contactWeight(fighter: ArcadeFighter, rival: ArcadeFighter): number {
  const attack = fighter.attack
  if (!attack || !['light', 'heavy'].includes(attack.kind) || attack.variant === 'throw') return 0
  if (!materialStrike(fighter, rival)) return 0
  const data = attackData(attack.kind, fighter)
  if (Math.abs(fighter.x - rival.x) > data.box.right + 2) return 0
  const p = Math.max(0, Math.min(1, attack.frame / Math.max(1, data.startup)))
  const approach = p * p * (3 - 2 * p)
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

/** Choose the near anatomical surface, rather than the centre of a much taller rival's head. */
export function fightContactSurface(
  rig: FightRig,
  zone: FightNenZone,
  options: { facing: 1 | -1; near: Vector3 },
): Vector3 {
  const skin = bodySurfaceBox(contactPart(rig, zone))
  const point = skin.clampPoint(options.near, new Vector3())
  point.x = options.facing === 1 ? skin.min.x - 0.015 : skin.max.x + 0.015
  return point
}

function strikeRoot(rig: FightRig, fighter: ArcadeFighter): Object3D {
  const feet = strikingFeet(fighter)
  const limb = fightStrikeLimb(fighter, feet ? 'feet' : 'hands')
  const index = limb === 'left' ? 0 : 1
  return feet ? rig.human.legs[index] : rig.human.arms[index]
}

function strikingFeet(fighter: ArcadeFighter): boolean {
  return ['kick', 'lowKick', 'sweep', 'spin', 'dive'].includes(
    rosterMoveShape(fighter.attack!.moveId) ?? '',
  )
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
  const feet = strikingFeet(fighter)
  const limb = fightStrikeLimb(fighter, feet ? 'feet' : 'hands')
  const indices = limb === 'both' ? [0, 1] : [limb === 'left' ? 0 : 1]
  for (const index of indices) {
    const { root, hinge, end } = strikeParts(rig, { fighter, feet, index })
    const target = options.target.clone()
    target.x -= fighter.facing * (feet ? 0.08 : 0.045)
    reachLimb({ root, hinge, end }, target, options.weight)
  }
}

function strikeParts(
  rig: FightRig,
  options: { fighter: ArcadeFighter; feet: boolean; index: number },
) {
  const { fighter, feet, index } = options
  const tool =
    fighter.attack?.moveId === 'shizuku:standingHeavy'
      ? rig.human.figure.getObjectByName('shizuku-blinky')
      : null
  return {
    root: feet ? rig.human.legs[index] : rig.human.arms[index],
    hinge: feet ? rig.human.knees[index] : rig.elbows[index],
    end: tool ?? (feet ? rig.ankles[index] : rig.wrists[index]),
  }
}

function rememberImpactSurface(
  figure: Object3D,
  contact: {
    state: FightState
    side: FightSide
    zone: FightNenZone
    position: Vector3
  },
) {
  const { state, side, zone, position } = contact
  const impact = state.impact
  if (!impact || impact.attacker !== side || impact.projectileId !== null) return
  rememberSurfaceContact(figure, { frame: state.frame, sequence: impact.sequence, zone, position })
}

function materialStrike(fighter: ArcadeFighter, rival: ArcadeFighter): boolean {
  return (
    !projectionBody(fighter) &&
    !projectionBody(rival) &&
    Boolean(rosterMoveShape(fighter.attack?.moveId))
  )
}

function settleBothBodies(figureOf: (side: FightSide) => Object3D): void {
  for (const side of ['player', 'opponent'] as const) {
    const human = humanAnimationRig(figureOf(side))
    if (human) settleObservedPose(fightRigOf(human))
  }
}
