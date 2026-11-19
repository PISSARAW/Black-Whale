import { addPoses, lerpPose, scalePose, type BodyPlan, type FightPose } from './fightPose'
import { beginPoseTransition, type PoseMemory } from './fightPoseMemory'
import { COMBO_LINK_SECONDS, type AttackFlowFrame } from './fightAttackFlow'
import { linkedStrikePose } from './fightComboTransfer'
import { contactPostureFrom, withContactPosture } from './fightContactPosture'

interface Momentum {
  pose: PoseMemory
  velocity: FightPose
  outgoing: FightPose
  seconds: number
  token: string
  posture?: FightPose
  settled?: FightPose
}

/** Scene-owned, rather than rig-owned: changing Nen geometry cannot erase the outgoing gesture. */
export function createFightPoseContinuity() {
  const state: Momentum = {
    pose: { key: '', from: {}, since: 0, last: {} },
    velocity: {},
    outgoing: {},
    seconds: 0,
    token: '',
  }
  const draw = (plan: BodyPlan, seconds: number): FightPose => {
    const token = flowToken(plan)
    if (token && token === state.token) return state.pose.last
    const memory = state.pose
    if (!memory.key) {
      memory.key = plan.key
      memory.last = plan.pose
      memory.since = -Infinity
    }
    const restarted =
      plan.attackFlow && memory.attack && plan.attackFlow.frame < memory.attack.frame
    if (plan.key !== memory.key || restarted) {
      if (state.settled) memory.last = state.settled
      state.settled = undefined
      state.outgoing = state.velocity
      beginPoseTransition(memory, plan, seconds)
      state.posture = contactPostureFrom(memory.from, plan)
    }
    memory.attack = plan.attackFlow
    const drawn = drawFlow(state, withContactPosture(plan, state.posture), seconds)
    const dt = Math.min(2, Math.max(0.25, (seconds - state.seconds) * 60))
    state.velocity = difference(drawn, memory.last, dt)
    memory.last = drawn
    state.seconds = seconds
    state.token = token
    return drawn
  }
  return Object.assign(draw, {
    observe: (pose: FightPose) => {
      // Floor/support offsets are constraints, not authored root travel. Feeding
      // them into the next plan applies the same pelvis correction a second time.
      state.settled = { ...state.pose.last, ...pose, root: state.pose.last.root }
    },
  })
}

function flowToken(plan: BodyPlan): string {
  const frame = plan.attackFlow?.frame ?? plan.reactionFrame
  return frame === undefined ? '' : `${plan.key}:${frame}`
}

function drawFlow(state: Momentum, plan: BodyPlan, seconds: number): FightPose {
  const memory = state.pose,
    attack = plan.attackFlow
  if (attack?.contact && attack.frame < attack.startup)
    return drawStartup(state, { ...attack, contact: attack.contact })
  if (attack) return plan.pose
  if (plan.reactionFrame !== undefined) {
    const enter = 0.72 + 0.28 * Math.min(1, plan.reactionFrame / 2)
    return lerpPose(memory.from, plan.pose, enter)
  }
  const blend = memory.link ? Math.max(COMBO_LINK_SECONDS, plan.blend) : plan.blend
  const duration = Math.max(1, blend * 60)
  const progress = Math.min(1, Math.max(0, ((seconds - memory.since) * 60) / duration))
  return hermite({ from: memory.from, to: plan.pose, velocity: state.outgoing, duration, progress })
}

function drawStartup(state: Momentum, attack: AttackFlowFrame & { contact: FightPose }): FightPose {
  const input = {
    from: state.pose.from,
    contact: attack.contact,
    velocity: state.outgoing,
    load: state.pose.bridge ?? {},
    transfer: attack.transfer,
    frames: attack.startup,
    progress: attack.frame / attack.startup,
    loadAt: attack.loadAt,
  }
  return state.pose.chained ? linkedStrikePose(input) : physicalComboCurve(input)
}

interface Curve {
  from: FightPose
  contact: FightPose
  velocity: FightPose
  load: FightPose
  frames: number
  progress: number
  loadAt?: number
}

/** Preserve the outgoing tangent and the exact contact; anticipation has zero endpoint derivative. */
export function physicalComboCurve(curve: Curve): FightPose {
  const p = Math.min(1, Math.max(0, curve.progress))
  if (curve.frames > 4) return loadedStrike(curve, p)
  const body = hermite({
    from: curve.from,
    to: curve.contact,
    velocity: curve.velocity,
    duration: curve.frames,
    progress: p,
  })
  const anticipation = 16 * p * p * (1 - p) ** 2 * Math.min(0.65, curve.frames / 16)
  return addPoses(body, scalePose(curve.load, anticipation))
}

function loadedStrike(curve: Curve, progress: number): FightPose {
  const load = addPoses(lerpPose(curve.from, curve.contact, 0.18), scalePose(curve.load, 0.85))
  const loadAt = curve.loadAt ?? 0.55
  if (progress < loadAt)
    return hermite({
      from: curve.from,
      to: load,
      velocity: curve.velocity,
      duration: curve.frames * loadAt,
      progress: progress / loadAt,
    })
  return hermite({
    from: load,
    to: curve.contact,
    velocity: {},
    duration: curve.frames * (1 - loadAt),
    progress: (progress - loadAt) / (1 - loadAt),
  })
}

function hermite(input: {
  from: FightPose
  to: FightPose
  velocity: FightPose
  duration: number
  progress: number
  loadAt?: number
}): FightPose {
  const { from, to, velocity, duration, progress: p } = input
  if (p >= 1) return to
  const result = lerpPose(from, to, p * p * (3 - 2 * p))
  const tangent = p * (1 - p) ** 2 * Math.min(6, duration)
  return addPoses(result, scalePose(velocity, tangent))
}

function difference(next: FightPose, prior: FightPose, dt: number): FightPose {
  const result: FightPose = {}
  for (const joint of Object.keys(next) as Array<keyof FightPose>) {
    const a = next[joint]!,
      b = prior[joint] ?? [0, 0, 0]
    const cap = joint === 'root' ? 0.025 : 0.3
    result[joint] = a.map((value, axis) =>
      Math.max(-cap, Math.min(cap, (value - b[axis]) / dt)),
    ) as [number, number, number]
  }
  return result
}
