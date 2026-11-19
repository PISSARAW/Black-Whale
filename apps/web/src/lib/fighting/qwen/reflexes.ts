import { wantsObservedGuard, incomingLow } from '../combatPressure'
import { focusFlags } from '../nenFocusCommand'
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
import { attackData, attackPhase } from '../frameData'
import { hasRecoveryCancel } from '../recoveryPunish'
import { focusInput } from '../nenCombat/aiReads'

export function reflexInput(state: FightState, side: FightSide, plan: TacticalPlan): FightInput {
  const self = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  const input = { ...EMPTY_INPUT }
  if (!seesCombatBody(self)) return { ...input, gyo: plan.nen === 'gyo', en: plan.nen === 'en' }
  const gap = Math.abs(target.x - self.x)
  const desired = tacticalRange(state, side, plan)
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
  input.down = incomingLow(target)
  input.aura = state[side].aura > 35 && plan.nen === 'ken'
  input.left = false
  input.right = false
  if (plan.nen === 'ryu' && target.attack)
    Object.assign(
      input,
      CLEARED_FOCUS,
      focusInput(attackData(target.attack.kind, target).targetZone),
    )
}

const CLEARED_FOCUS = { focusHead: false, focusTorso: false, focusHands: false, focusFeet: false }

function visibleThreat(state: FightState, side: FightSide): boolean {
  const self = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  if (self.pressureRead) return wantsObservedGuard(self, target)
  const attack = target.attack
  if (attackPhase(target) === 'recovery' && !hasRecoveryCancel(target)) return false
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
  const direct = { gyo: 'gyo', in: 'conceal', shu: 'shu', en: 'en' } as const
  const flag = direct[plan.nen as keyof typeof direct]
  if (flag && self.aura > 25) input[flag] = true
  if (plan.nen === 'ryu' && self.aura > 8)
    Object.assign(
      input,
      focusFlags(self.attack ? attackData(self.attack.kind, self).auraZone : 'hands'),
    )
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
  applyKoRelease(input, { self, plan, gap })
  if (plan.nen === 'on' && opponentWantsOn(self)) {
    input.aura = true
    input.hatsu = true
  }
}

/** Ko is committed by releasing Aura during the charged startup, not by holding it. */
function applyKoRelease(
  input: FightInput,
  context: { self: FightState['player']; plan: TacticalPlan; gap: number },
) {
  const { self, plan, gap } = context
  if (plan.nen === 'ko' && gap < 12 && self.aura > 65) input.aura = !self.attack?.auraCharged
}

function tacticalRange(state: FightState, side: FightSide, plan: TacticalPlan): number {
  const range = state[side].nenTactics?.range
  return range ? (range[0] + range[1]) / 2 : desiredRange(state, side, plan)
}
