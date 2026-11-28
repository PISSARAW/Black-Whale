import type { Object3D } from 'three'
import type { HumanFigure } from '$lib/tour/humanFigure'
import { humanHandRig, type HumanHandPose, type HumanHandRig } from '$lib/tour/humanHandRig'
import { moveById } from './movesets'
import type { ArcadeFighter } from './types'

export type FightGripProfile =
  'relaxed' | 'guard' | 'fist' | 'book' | 'pistol' | 'staff' | 'fan' | 'needle' | 'point'

interface GripModel {
  hands: readonly [Object3D, Object3D]
  rigs: readonly [HumanHandRig | undefined, HumanHandRig | undefined]
}

const MODELS = new WeakMap<Object3D, GripModel>()

export function addFightHandGripResponse(model: HumanFigure): void {
  const left = model.root.getObjectByName('hand-left')
  const right = model.root.getObjectByName('hand-right')
  if (!left || !right) return
  const rigs = [humanHandRig(left), humanHandRig(right)] as const
  if (!rigs.some(Boolean)) return
  MODELS.set(model.turns, { hands: [left, right], rigs })
}

/** Pose finger bones from replay state only; no accumulated simulation state is introduced. */
export function animateFightHandGripResponse(figure: Object3D, fighter: ArcadeFighter): void {
  const model = MODELS.get(figure)
  if (!model) return
  const profiles = fightGripProfiles(model.hands, fighter)
  const amount = gripAmount(fighter)
  model.rigs.forEach((rig, index) => rig?.pose(handPose(profiles[index]), amount))
}

export function fightGripProfiles(
  hands: readonly [Object3D, Object3D],
  fighter: ArcadeFighter,
): readonly [FightGripProfile, FightGripProfile] {
  const held = hands.map(heldProfile) as [FightGripProfile | null, FightGripProfile | null]
  if (!fighter.attack) return passiveProfiles(held)
  return attackProfiles(held, fighter)
}

function passiveProfiles(
  held: readonly [FightGripProfile | null, FightGripProfile | null],
): [FightGripProfile, FightGripProfile] {
  return [held[0] ?? 'relaxed', held[1] ?? 'relaxed']
}

function attackProfiles(
  held: readonly [FightGripProfile | null, FightGripProfile | null],
  fighter: ArcadeFighter,
): [FightGripProfile, FightGripProfile] {
  const lead = fighter.facing === 1 ? 1 : 0
  return fighter.attack?.kind === 'ranged'
    ? rangedProfiles(held, lead)
    : physicalProfiles(held, fighter, lead)
}

function rangedProfiles(
  held: readonly [FightGripProfile | null, FightGripProfile | null],
  lead: number,
): [FightGripProfile, FightGripProfile] {
  const profiles: [FightGripProfile, FightGripProfile] = ['guard', 'guard']
  const weapon = held[0] ? 0 : held[1] ? 1 : lead
  profiles[weapon] = held[weapon] ?? 'point'
  profiles[1 - weapon] = held[1 - weapon] ?? 'guard'
  return profiles
}

function physicalProfiles(
  held: readonly [FightGripProfile | null, FightGripProfile | null],
  fighter: ArcadeFighter,
  lead: number,
): [FightGripProfile, FightGripProfile] {
  const rear = 1 - lead
  const profiles: [FightGripProfile, FightGripProfile] = ['guard', 'guard']
  const legStrike =
    fighter.attack?.kind === 'heavy' && ['low', 'air'].includes(fighter.attack.variant ?? '')
  profiles[lead] = held[lead] ?? (legStrike ? 'guard' : 'fist')
  profiles[rear] = held[rear] ?? 'guard'
  return profiles
}

function heldProfile(hand: Object3D): FightGripProfile | null {
  let profile: FightGripProfile | null = null
  hand.traverse((part) => {
    if (profile || !part.visible) return
    if (/(pistol|handgun|rifle)/u.test(part.name)) profile = 'pistol'
    else if (/(book|flute)/u.test(part.name)) profile = 'book'
    else if (/(staff|blinky|umbrella)/u.test(part.name)) profile = 'staff'
    else if (/fan/u.test(part.name)) profile = 'fan'
    else if (/needle/u.test(part.name)) profile = 'needle'
  })
  return profile
}

function gripAmount(fighter: ArcadeFighter): number {
  const attack = fighter.attack
  const move = moveById(attack?.moveId)
  if (!attack || !move) return 1
  const { startup, active, recovery } = move.tuning
  if (attack.frame < startup) return clamp01((attack.frame + 1) / Math.max(1, startup))
  if (attack.frame < startup + active) return 1
  const progress = clamp01((attack.frame - startup - active) / Math.max(1, recovery))
  return 0.25 + (1 - progress) * 0.75
}

function handPose(profile: FightGripProfile): HumanHandPose {
  if (profile === 'staff' || profile === 'fan' || profile === 'needle') return 'book'
  return profile
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}
