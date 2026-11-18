import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveSlot,
} from '../types'
import { seesCombatBody, readCounterplay } from '../fightCounterplay'
import { gyoSight } from '../nenPerception'
import { opponentWantsOn } from '../onTechnique'
import type { TacticalPlan } from './protocol'
import { moveForSlot } from '../movesets'

export function reflexInput(state: FightState, side: FightSide, plan: TacticalPlan): FightInput {
  const self = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  const input = { ...EMPTY_INPUT }
  if (!seesCombatBody(self)) return { ...input, gyo: plan.nen === 'gyo', en: plan.nen === 'en' }
  const gap = Math.abs(target.x - self.x)
  const desired = desiredRange(state, side, plan)
  const direction = Math.sign(target.x - self.x)
  if (gap > desired + 2) Object.assign(input, horizontal(direction))
  if (gap < desired - 3) Object.assign(input, horizontal(-direction))
  applyNen(input, { state, side, plan, gap })
  const cue = readCounterplay(state, side)
  if (cue?.kind === 'projectile' && gap > 12) input.jump = true
  if (visibleThreat(state, side)) defend(input, { state, side, plan })
  return input
}
function desiredRange(state: FightState, side: FightSide, plan: TacticalPlan) {
  if (plan.goal !== 'zone') return { pressure: 5, bait: 11, recover: 30 }[plan.goal]
  const move =
    plan.move === 'none' || plan.move.startsWith('utility:')
      ? null
      : moveForSlot(state[side].id, plan.move as MoveSlot)
  return Math.max(6, Math.min(18, (move?.tuning.reach ?? 12) - 2))
}

function horizontal(direction: number) {
  return direction >= 0 ? { right: true } : { left: true }
}

function defend(
  input: FightInput,
  context: { state: FightState; side: FightSide; plan: TacticalPlan },
) {
  const { state, side, plan } = context
  const target = state[side === 'player' ? 'opponent' : 'player']
  input.guard = true
  input.down = target.attack?.variant === 'low'
  input.aura = state[side].aura > 35 && plan.nen === 'ken'
  input.left = false
  input.right = false
  input.focusTorso = plan.nen === 'ryu'
}

function visibleThreat(state: FightState, side: FightSide): boolean {
  const self = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  const attack = target.attack
  if (!attack || attack.frame < 10 || Math.abs(target.x - self.x) > 22) return false
  return !attack.concealed || gyoSight(self)
}

function applyNen(
  input: FightInput,
  context: {
    state: FightState
    side: FightSide
    plan: TacticalPlan
    gap: number
  },
) {
  const { state, side, plan, gap } = context
  const self = state[side]
  if (self.aura < 18 && gap > 24) {
    input.aura = true
    input.down = true
    return
  }
  const direct = { gyo: 'gyo', in: 'conceal', shu: 'shu', ryu: 'focusHands', en: 'en' } as const
  const flag = direct[plan.nen as keyof typeof direct]
  if (flag && self.aura > 25) input[flag] = true
  applyHeldNen(input, context)
}
function applyHeldNen(
  input: FightInput,
  context: { state: FightState; side: FightSide; plan: TacticalPlan; gap: number },
) {
  const { state, side, plan, gap } = context
  const self = state[side]
  if (plan.nen === 'ren' && self.aura > 60) input.aura = true
  if (plan.nen === 'zetsu' && gap > 24) {
    input.aura = true
    input.down = true
  }
  if (plan.nen === 'ko' && gap < 12 && self.aura > 65) input.aura = true
  if (plan.nen === 'on' && opponentWantsOn(self)) {
    input.aura = true
    input.hatsu = true
  }
}
