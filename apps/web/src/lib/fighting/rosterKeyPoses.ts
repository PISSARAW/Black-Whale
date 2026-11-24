import {
  AIR_PUNCH,
  AIR_SLASH,
  BACK_WHIP,
  CHARGE,
  CROSS,
  DIVE_KICK,
  HIGH_KICK,
  HOOK,
  JAB,
  LOW_JAB,
  LOW_KICK,
  OVERHEAD,
  PALM_PUSH,
  SLASH,
  SPIN_KICK,
  SWEEP,
  THRUST,
  UPPERCUT,
  READY_ARMS,
  type Gesture,
} from './fightGestures'
import { addPoses, scalePose, UPPER_JOINTS, type FightPose } from './fightPose'
import { fightStance } from './fightStance'
import type { MoveTimeline } from './keyPoseTimeline'
import {
  ROSTER_CHOREOGRAPHY,
  type RosterFighterId,
  type RosterChoreography,
  type StrikeLibrary,
  type StrikeShape,
} from './rosterChoreography'
import { ROSTER_TECHNIQUES, type TechniqueDirection } from './rosterTechniqueDirection'
import { TECHNIQUE_GESTURES } from './rosterTechniqueGestures'
import {
  physicalStrikeDirection,
  physicalStrikeShape,
  authoredStrikeDirection,
} from './physicalStrikeDirections'
import { standingFootwork } from './standingFootwork'
import type { FighterId, MoveSlot } from './types'

const STRIKES: StrikeLibrary = {
  jab: JAB,
  cross: CROSS,
  hook: HOOK,
  uppercut: UPPERCUT,
  palm: PALM_PUSH,
  hammer: OVERHEAD,
  slash: SLASH,
  thrust: THRUST,
  kick: HIGH_KICK,
  spin: SPIN_KICK,
  lowJab: LOW_JAB,
  lowKick: LOW_KICK,
  sweep: SWEEP,
  airPunch: AIR_PUNCH,
  airSlash: AIR_SLASH,
  dive: DIVE_KICK,
  backhand: BACK_WHIP,
  charge: CHARGE,
}
const NORMALS: readonly MoveSlot[] = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
]
const SPECIALS: readonly MoveSlot[] = [
  'neutralSpecial',
  'forwardSpecial',
  'downSpecial',
  'backSpecial',
  'finisher',
]

export function rosterStrikeShape(id: FighterId, slot: MoveSlot): StrikeShape | undefined {
  return (
    physicalStrikeShape(authoredStrikeDirection(id, slot) ?? physicalStrikeDirection(id, slot)) ??
    standingFootwork(id, slot)?.[0] ??
    rosterBaseStrikeShape(id, slot)
  )
}

export function rosterBaseStrikeShape(id: FighterId, slot: MoveSlot): StrikeShape | undefined {
  return ROSTER_CHOREOGRAPHY[id as RosterFighterId]?.strikes[NORMALS.indexOf(slot)]
}

const CACHE = new Map<FighterId, Record<MoveSlot, MoveTimeline>>()

/** Reach the selected silhouette on frame one of contact, hold it, then recover the own guard. */
function directedTimeline(options: {
  id: RosterFighterId
  gesture: Gesture
  physical: boolean
}): MoveTimeline {
  const { id, gesture, physical } = options
  const direction = ROSTER_CHOREOGRAPHY[id]
  const shape = (pose: FightPose, accent: FightPose) => {
    const made = addPoses(scalePose(pose, physical ? direction.amplitude : 1), accent)
    if (physical) rebaseArms(made, id)
    return made
  }
  const contact = shape(gesture.contact, direction.drive)
  return [
    {
      phase: 'startup',
      at: direction.anticipation,
      ease: 'out',
      pose: shape(gesture.windup, direction.load),
    },
    { phase: 'active', at: 0, ease: 'snap', pose: contact },
    { phase: 'active', at: 1, pose: contact },
    {
      phase: 'recovery',
      at: direction.recovery,
      ease: 'out',
      pose: shape(gesture.follow ?? scalePose(gesture.contact, 0.35), direction.release),
    },
  ]
}

/** Physical templates are offsets from READY_ARMS; authored clips play from each personal stance. */
function rebaseArms(pose: FightPose, id: FighterId): void {
  const stance = fightStance(id)!.pose
  for (const joint of UPPER_JOINTS) {
    if (!joint.includes('Shoulder') && !joint.includes('Elbow') && !joint.includes('Wrist'))
      continue
    if (!pose[joint]) continue
    const ready = READY_ARMS[joint] ?? [0, 0, 0]
    const rest = stance[joint] ?? [0, 0, 0]
    const turn = pose[joint]!
    pose[joint] = [
      turn[0] + ready[0] - rest[0],
      turn[1] + ready[1] - rest[1],
      turn[2] + ready[2] - rest[2],
    ]
  }
}

function technique(id: RosterFighterId, direction: TechniqueDirection): MoveTimeline {
  const physical = direction in STRIKES
  const gesture = physical
    ? STRIKES[direction as keyof typeof STRIKES]
    : TECHNIQUE_GESTURES[direction as keyof typeof TECHNIQUE_GESTURES]
  return directedTimeline({ id, gesture, physical })
}

function throwTimeline(direction: RosterChoreography): MoveTimeline {
  const reach = addPoses(direction.drive, {
    body: [0.1, 0, 0],
    leadShoulder: [-0.6, 0, 0.1],
    rearShoulder: [-0.6, 0, -0.1],
    leadElbow: [0.8, 0, 0],
    rearElbow: [1.1, 0, 0],
  })
  return [
    { phase: 'startup', at: direction.anticipation, pose: direction.load, ease: 'out' },
    { phase: 'active', at: 0, pose: reach, ease: 'snap' },
    { phase: 'active', at: 1, pose: reach },
    {
      phase: 'recovery',
      at: 0.25,
      pose: addPoses(direction.drive, {
        chest: [0, 0.55, 0],
        rearShoulder: [-0.7, 0, -0.2],
        leadElbow: [0.4, 0, 0],
      }),
      ease: 'out',
    },
    { phase: 'recovery', at: 0.65, pose: direction.release, ease: 'out' },
  ]
}

export function rosterKeyPoses(fighterId: FighterId): Partial<Record<MoveSlot, MoveTimeline>> {
  if (!(fighterId in ROSTER_CHOREOGRAPHY)) return {}
  const id = fighterId as RosterFighterId
  const held = CACHE.get(id)
  if (held) return held
  const direction = ROSTER_CHOREOGRAPHY[id]
  const entries: Array<[MoveSlot, MoveTimeline]> = NORMALS.map((slot, index) => {
    const personal = physicalStrikeDirection(id, slot)
    const shape =
      physicalStrikeShape(personal) ?? standingFootwork(id, slot)?.[0] ?? direction.strikes[index]
    const gesture =
      typeof personal === 'object' ? (personal.gesture ?? STRIKES[shape]) : STRIKES[shape]
    return [slot, directedTimeline({ id, gesture, physical: true })]
  })
  SPECIALS.forEach((slot, index) => {
    const shape = physicalStrikeShape(physicalStrikeDirection(id, slot))
    entries.push([slot, technique(id, shape ?? ROSTER_TECHNIQUES[id][index])])
  })
  entries.push(['throw', throwTimeline(direction)])
  const made = Object.fromEntries(entries) as Record<MoveSlot, MoveTimeline>
  CACHE.set(id, made)
  return made
}

const PHYSICAL_TIMELINES = new Map<string, MoveTimeline>()

export function authoredStrikeTimeline(id: FighterId, slot: MoveSlot): MoveTimeline | undefined {
  const direction = authoredStrikeDirection(id, slot)
  if (typeof direction !== 'object' || !direction.gesture) return undefined
  const key = `${id}:${slot}`
  const cached = PHYSICAL_TIMELINES.get(key)
  if (cached) return cached

  const [load, contact, hold, release] = directedTimeline({
    id: id as RosterFighterId,
    gesture: direction.gesture,
    physical: true,
  })
  const settle = scalePose(release.pose, 0.23)
  if (slot === 'airLight' || slot === 'airHeavy')
    settle.root = [settle.root?.[0] ?? 0, -0.035, settle.root?.[2] ?? 0]
  const timeline: MoveTimeline = [
    { phase: 'startup', at: 0.18, pose: scalePose(load.pose, 0.43), ease: 'out' },
    load,
    contact,
    hold,
    {
      phase: 'recovery',
      at: 0.12,
      pose: addPoses(scalePose(contact.pose, 0.66), scalePose(release.pose, 0.34)),
      ease: 'out',
    },
    release,
    { phase: 'recovery', at: 0.86, pose: settle, ease: 'out' },
  ]
  PHYSICAL_TIMELINES.set(key, timeline)
  return timeline
}
