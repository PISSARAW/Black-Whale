import { fighterKeyedMove } from './fighterKeyedMove'
import { usesRightHandPose } from './fightHandConvention'
import { bodyguardFiring } from './bodyguardFirearms'
import { usesFranklinBarrage } from './franklinAttack'
import { moveById } from './movesets'
import type { FightJoint, FightPose } from './fightPose'
import type { ArcadeFighter, FightNenZone } from './types'

type Limb = 'left' | 'right' | 'both'
const ARMS: Record<'lead' | 'rear', FightJoint[]> = {
  lead: ['leadShoulder', 'leadElbow', 'leadWrist'],
  rear: ['rearShoulder', 'rearElbow', 'rearWrist'],
}
const LEGS: Record<'lead' | 'rear', FightJoint[]> = {
  lead: ['leadHip', 'leadKnee'],
  rear: ['rearHip', 'rearKnee'],
}

/** Read the contact actually authored for this equipment, rather than assuming every heavy is a fist. */
export function fightStrikeLimb(fighter: ArcadeFighter, zone: FightNenZone): Limb {
  if (uncommittedLimb(fighter, zone)) return 'both'
  if (zone === 'hands' && usesFranklinBarrage(fighter)) return 'both'
  if (zone === 'hands' && bodyguardFiring(fighter)) return 'right'
  const move = moveById(fighter.attack!.moveId)
  if (!move) return 'both'
  const { timeline } = fighterKeyedMove(fighter, move.slot)
  const contact = timeline.find((key) => key.phase === 'active' && key.at === 0)?.pose
  if (!contact) return 'both'
  return anatomicalLimb(fighter, { zone, contact })
}

function anatomicalLimb(
  fighter: ArcadeFighter,
  options: { zone: FightNenZone; contact: FightPose },
): Limb {
  const joints = options.zone === 'hands' ? ARMS : LEGS
  const lead = motionScore(options.contact, joints.lead)
  const rear = motionScore(options.contact, joints.rear)
  if (Math.max(lead, rear) < 0.1 || Math.max(lead, rear) < Math.min(lead, rear) * 1.3) return 'both'
  const rightHand =
    options.zone === 'hands' && usesRightHandPose(fighter, `attack:${fighter.attack!.moveId}`)
  const leadIsRight = rightHand || fighter.facing === 1
  const isLead = lead > rear
  return isLead === leadIsRight ? 'right' : 'left'
}

function uncommittedLimb(fighter: ArcadeFighter, zone: FightNenZone): boolean {
  return !fighter.attack || Boolean(fighter.defensiveKo) || !['hands', 'feet'].includes(zone)
}

function motionScore(pose: FightPose, joints: FightJoint[]): number {
  return joints.reduce((total, joint) => {
    const turn = pose[joint] ?? [0, 0, 0]
    return total + Math.abs(turn[0]) + Math.abs(turn[1]) * 0.5 + Math.abs(turn[2]) * 0.5
  }, 0)
}
