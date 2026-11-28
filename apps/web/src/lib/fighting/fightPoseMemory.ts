import type { FightPose, BodyPlan } from './fightPose'
import type { AttackFlowFrame } from './fightAttackFlow'
import { COMBO_LINK_SECONDS } from './fightAttackFlow'
import { duelBridge } from './duelAttackBridges'

const COMBO_LINK_POSTURES = new Set([
  'stance',
  'crouch',
  'battle-cantabile-dance',
  'bonolenov:prologue-ready',
  'bonolenov:unarmed-rhythm',
  'feitan:iconic-guard',
])

export interface PoseMemory {
  key: string
  from: FightPose
  since: number
  last: FightPose
  attack?: AttackFlowFrame
  chained?: boolean
  bridge?: FightPose
  shiftWeight?: boolean
  link?: { frame: AttackFlowFrame; key: string; until: number }
}

export function beginPoseTransition(memory: PoseMemory, plan: BodyPlan, seconds: number): void {
  const attack = plan.attackFlow
  const { previous, fromKey } = poseOrigin(memory, seconds)
  const chained = attack !== undefined && previous?.facing === attack.facing
  const bridge = chained
    ? duelBridge(fromKey.slice('attack:'.length), plan.key.slice('attack:'.length), attack.facing)
    : undefined
  Object.assign(memory, {
    key: plan.key,
    from: memory.last,
    since: seconds,
    chained,
    bridge,
    link: comboLink(memory, plan, seconds),
    shiftWeight: Boolean(chained && previous?.transfer),
  })
}

function poseOrigin(memory: PoseMemory, seconds: number) {
  const previous =
    memory.attack ?? (memory.link && seconds <= memory.link.until ? memory.link.frame : undefined)
  const fromKey = memory.attack ? memory.key : (memory.link?.key ?? memory.key)
  return { previous, fromKey }
}

function comboLink(memory: PoseMemory, plan: BodyPlan, seconds: number) {
  if (!memory.attack?.transfer || !COMBO_LINK_POSTURES.has(plan.key)) return undefined
  return { frame: memory.attack, key: memory.key, until: seconds + COMBO_LINK_SECONDS }
}
