import { recoveryCounter } from '../recoveryCounterAction'
import { personalApplicationReady } from '../nenApplicationRange'
import { nenComboDecision, nenPhysicalOpener } from '../nenComboDecision'
import { focusCommand } from '../nenFocusCommand'
import { aiMoveInRange } from '../movesetAi'
import { recoveryPunishOptions } from '../recoveryPunish'
import { personalTacticalPlan } from '../nenTacticalIntent'
import { comboChoices } from '../comboChoices'
import { canAct } from '../fightActorState'
import { canStartFighterAttack } from '../fighterAttacks'
import { canUseMovesetMove, moveForSlot } from '../movesets'
import { packReplayInput } from '../fightReplayInput'
import { seesCombatBody } from '../fightCounterplay'
import type { FighterMove } from '../movesetTypes'
import type { ReplayCommand } from '../fightReplayTypes'
import type { FightInput, FightSide, FightState, MoveAction, MoveSlot } from '../types'
import type { TacticalPlan } from './protocol'
import { reflexInput } from './reflexes'
import { plannedUtility } from './utilities'
import type { ArsenalCommand } from '../retrospectiveTypes'

export interface FastDecision {
  input: FightInput
  command?: Extract<ReplayCommand, { kind: 'move' }>
  utility?: { side: FightSide; command: ArsenalCommand }
}
export function createFastController(side: FightSide, seed = 17) {
  let due = 0
  let round = 0
  let sequence = seed >>> 0
  let lastMove = ''
  let specialDue = 0
  const random = () => {
    sequence = (Math.imul(sequence, 1664525) + 1013904223) >>> 0
    return sequence / 4294967296
  }
  return (state: FightState, plan: TacticalPlan): FastDecision => {
    plan = resolvedTacticalPlan(state, side, plan)
    if (round !== state.roundNumber) {
      round = state.roundNumber
      due = 12
      specialDue = 0
      lastMove = ''
    }
    const input = reflexInput(state, side, plan)
    const continuation = continuedDecision({ state, side, input }, plan)
    if (continuation) return continuation
    if (!commandWindow(state, due, plan)) return { input }
    const context = { state, side, input }
    const utility = readyUtility(context, plan, specialDue)
    if (utility) {
      due = state.frame + 100
      specialDue = state.frame + 100
      return { input, utility: { side, command: utility } }
    }
    if (plan.move.startsWith('utility:')) return { input }
    if (!canAct(state[side]) || holdsDefense(input)) return { input }
    const move = selectMove(context, plan, {
      lastMove,
      special: state.frame >= specialDue,
      roll: random(),
    })
    due = state.frame + (move ? 10 : 6)
    if (!move) return { input }
    lastMove = move.id
    if (move.category === 'special') specialDue = state.frame + 100
    return { input, command: moveCommand(context, move) }
  }
}
/** A recovery intention completes when reserve is restored; it is not endless retreat. */
function executablePlan(state: FightState, side: FightSide, plan: TacticalPlan): TacticalPlan {
  if (plan.goal === 'recover' && state[side].aura >= (state[side].nenTactics?.reserve || 65))
    return { ...plan, goal: 'pressure' }
  return plan
}
function holdsDefense(input: FightInput) {
  return input.guard || (input.aura && input.down)
}

interface Context {
  state: FightState
  side: FightSide
  input: FightInput
}
function readyUtility(context: Context, plan: TacticalPlan, readyAt: number) {
  const { state, side } = context
  if (state.frame < readyAt && !plan.move.startsWith('utility:')) return null
  return plannedUtility(state, side, plan)
}

function selectMove(
  context: Context,
  plan: TacticalPlan,
  memory: { lastMove: string; special: boolean; roll: number },
) {
  const combo = comboChoices(context.state, context.side).filter((row) => row.status === 'ready')
  const next =
    combo.find((row) => row.move.slot === plan.move) ??
    combo.find((row) => row.move.id !== memory.lastMove)
  if (next) return next.move
  const punish = recoveryPunishOptions(context.state, context.side).find(
    (option) => option.approachFrames === 0 && option.reaction === 0,
  )
  if (punish) return punish.move
  const opener = nenPhysicalOpener(context.state, context.side)
  if (opener) return opener
  const planned = memory.special ? plannedMove(context, plan) : null
  return planned ?? ordinaryMove(context, memory.roll)
}

function allowed(context: Context, move: FighterMove | null): move is FighterMove {
  if (!move) return false
  const { state, side } = context
  return (
    canUseMovesetMove(state, side, move) && canStartFighterAttack(state[side], move.kind, move.id)
  )
}
function plannedMove(context: Context, plan: TacticalPlan): FighterMove | null {
  if (plan.move === 'none' || plan.move.startsWith('utility:')) return null
  const move = moveForSlot(context.state[context.side].id, plan.move as MoveSlot)
  if (!allowed(context, move)) return null
  if (!personalApplicationReady(context.state, context.side, move)) return null
  if (move.category === 'normal') return inReach(context, move) ? move : null
  if (!inPersonalReach(context, move)) return null
  return move
}
function inReach(context: Context, move: FighterMove): boolean {
  const { state, side } = context
  if (!seesCombatBody(state[side])) return false
  const target = state[side === 'player' ? 'opponent' : 'player']
  return Math.abs(state[side].x - target.x) <= move.tuning.reach + move.tuning.lunge + 2
}
function ordinaryMove(context: Context, roll: number): FighterMove | null {
  const { state, side } = context
  if (state[side].attack || !seesCombatBody(state[side])) return null
  const air = state[side].y > 0
  const slots: MoveSlot[] = air
    ? ['airLight', 'airHeavy']
    : ['standingLight', 'forwardLight', 'lowLight', 'standingHeavy', 'forwardHeavy', 'backHeavy']
  const offset = Math.floor(roll * slots.length)
  const ordered = [...slots.slice(offset), ...slots.slice(0, offset)]
  return (
    ordered
      .map((slot) => moveForSlot(state[side].id, slot))
      .find((move) => allowed(context, move) && inReach(context, move)) ?? null
  )
}
function moveCommand(
  context: Context,
  move: FighterMove,
): Extract<ReplayCommand, { kind: 'move' }> {
  const { state, side } = context
  const input = { ...context.input, left: false, right: false, down: false }
  const slot = move.slot
  if (slot.startsWith('forward')) input[state[side].facing > 0 ? 'right' : 'left'] = true
  if (slot.startsWith('back')) input[state[side].facing > 0 ? 'left' : 'right'] = true
  if (slot.startsWith('low') || slot.startsWith('down')) input.down = true
  const action =
    move.category === 'finisher' || move.category === 'throw' ? move.category : move.kind
  return { kind: 'move', side, action: action as MoveAction, input: packReplayInput(input) }
}

function resolvedTacticalPlan(
  state: FightState,
  side: FightSide,
  plan: TacticalPlan,
): TacticalPlan {
  const personal = personalTacticalPlan(state, side, plan)
  return state[side].nenTactics?.goal === 'recover'
    ? personal
    : executablePlan(state, side, personal)
}

function inPersonalReach(context: Context, move: FighterMove): boolean {
  const { state, side } = context
  const target = state[side === 'player' ? 'opponent' : 'player']
  return seesCombatBody(state[side]) && aiMoveInRange(move, Math.abs(state[side].x - target.x))
}

function commandWindow(state: FightState, due: number, plan: TacticalPlan): boolean {
  return state.phase === 'fighting' && state.frame >= due && plan.goal !== 'recover'
}

function continuedDecision(context: Context, plan: TacticalPlan): FastDecision | null {
  if (context.state.phase !== 'fighting') return null
  const counter = recoveryCounter(context.state, context.side)
  if (counter) return { input: context.input, command: moveCommand(context, counter) }
  if (plan.goal === 'recover') return null
  const decision = nenComboDecision(context.state, context.side)
  if (decision.focus) return { input: focusCommand(decision.focus) }
  if (decision.move) return { input: context.input, command: moveCommand(context, decision.move) }
  return null
}
