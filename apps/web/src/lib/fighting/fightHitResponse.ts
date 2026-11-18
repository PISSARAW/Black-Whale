import { addPoses, scalePose, type FightPose } from './fightPose'
import { rosterContactMotion } from './rosterHitReaction'
import { physicalRosterPair } from './fightPhysicalRoster'
import { anatomicalContactZone } from './fightSurfaceContact'
import { directionalImpulse, impactTwist } from './fightDirectionalImpulse'
import { fightPhysicalProfile, type FightPhysicalProfile } from './fightPhysicalProfile'
import type { FighterId, FightNenZone, FightState } from './types'

export interface PhysicalHit {
  sequence: number
  duration: number
  victim: FighterId
  zone: FightNenZone
  force: number
  twist: number
  crush: boolean
  rising: boolean
  profile: FightPhysicalProfile
  carry?: FightPose
}

/** Capture only observed hits. Counter/Ko change the visible impulse, never the combat state. */
export function physicalHitAtContact(
  state: FightState,
  prior?: { hit: PhysicalHit; progress: number },
): PhysicalHit | undefined {
  const hit = state.impact!
  const attacker = state[hit.attacker]
  const victim = state[hit.attacker === 'player' ? 'opponent' : 'player']
  if (!physicalRosterPair(attacker.id, victim.id)) return undefined
  const motion = rosterContactMotion(state)
  if (!motion) return undefined
  const profile = fightPhysicalProfile(victim)
  const heavy = hit.kind === 'heavy' ? 1 : 0.64
  const power = hit.critical || hit.counterHit ? 1.25 : 1
  return {
    sequence: hit.sequence,
    duration: Math.max(1, victim.hitStun),
    victim: victim.id,
    zone: anatomicalContactZone(attacker, victim, hit.zone),
    force: heavy * power * profile.resistance * motion.weight,
    profile,
    twist: impactTwist(attacker, motion.shape),
    crush: motion.shape === 'hammer' || motion.shape === 'dive',
    rising: motion.shape === 'uppercut',
    carry: prior ? residualBalance(physicalHitPose(prior.hit, prior.progress)) : undefined,
  }
}

/** Local deformation leads the chest; the pelvis and catching step follow after hitstop. */
export function physicalHitPose(hit: PhysicalHit, progress: number): FightPose {
  const age = progress * hit.duration
  const settle = smooth((progress - 0.68) / 0.32)
  const impulse = hit.force * (1 - settle * 0.82)
  const local = 0.8 + 0.2 * smooth(age / 2)
  const chest = 0.3 + 0.7 * smooth(age / 4)
  const pelvis = 0.08 + 0.92 * smooth((age - 2) / 7)
  return addPoses(
    scalePose(hit.carry ?? {}, 1 - smooth(age / 8)),
    scalePose(localReaction(hit), impulse * local),
    scalePose(chestReaction(hit), impulse * chest),
    scalePose(catchingStep(hit, age), impulse * pelvis),
    scalePose(directionalImpulse(hit, age), 1 - settle * 0.82),
  )
}

function localReaction(hit: PhysicalHit): FightPose {
  const face = hit.zone === 'head' || hit.rising
  const low = hit.zone === 'feet'
  const belly = hit.zone === 'torso'
  return {
    head: [face ? -0.55 : 0.16, hit.twist * -0.2, face ? 0.2 : 0.03],
    leadShoulder: [belly ? 0.55 : 0.2, -0.1, low ? 0.65 : 0.3],
    rearShoulder: [belly ? 0.45 : 0.15, 0.1, low ? -0.6 : -0.25],
    leadElbow: [belly ? -1.1 : -0.65, 0, 0],
    rearElbow: [belly ? -1.2 : -0.8, 0, 0],
    leadWrist: [0.12, 0, 0],
    rearWrist: [-0.1, 0, 0],
  }
}

function chestReaction(hit: PhysicalHit): FightPose {
  const fold = hit.crush || hit.zone === 'torso'
  const low = hit.zone === 'feet'
  return {
    body: [fold ? 0.1 : -0.08, -0.1 * hit.twist, low ? 0.16 : 0.04 * hit.twist],
    chest: [fold ? 0.55 : -0.3, -0.48 * hit.twist * hit.profile.rotation, 0.12 * hit.twist],
  }
}

function catchingStep(hit: PhysicalHit, age: number): FightPose {
  const catchUp = smooth((age - 2) / 7) * hit.profile.step
  const low = hit.zone === 'feet'
  return {
    root: [0, -0.035 * catchUp, -0.055 * catchUp],
    leadHip: [low ? 0.38 : -0.12, 0, 0.05],
    leadKnee: [low ? 0.72 : 0.28, 0, 0],
    rearHip: [-0.24 * catchUp, 0, -0.08],
    rearKnee: [0.48 * catchUp, 0, 0],
  }
}

/** Bounded residual balance: consecutive blows cannot straighten the victim or accumulate indefinitely. */
function residualBalance(pose: FightPose): FightPose {
  const result = scalePose(pose, 0.32)
  for (const joint of Object.keys(result) as Array<keyof FightPose>) {
    const cap = joint === 'root' ? 0.025 : 0.28
    result[joint] = result[joint]!.map((value) => Math.max(-cap, Math.min(cap, value))) as [
      number,
      number,
      number,
    ]
  }
  return result
}

function smooth(value: number): number {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}
