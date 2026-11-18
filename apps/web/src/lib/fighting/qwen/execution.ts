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

export interface FastDecision {
  input: FightInput
  command?: Extract<ReplayCommand, { kind: 'move' }>
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
    plan = executablePlan(state, side, plan)
    if (round !== state.roundNumber) {
      round = state.roundNumber
      due = 12
      specialDue = 0
      lastMove = ''
    }
    const input = reflexInput(state, side, plan)
    if (state.phase !== 'fighting' || state.frame < due || !canAct(state[side])) return { input }
    if (holdsDefense(input)) return { input }
    const context = { state, side, input }
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
  if (plan.goal === 'recover' && state[side].aura >= 50) return { ...plan, goal: 'pressure' }
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
  if (plan.move === 'none') return null
  const move = moveForSlot(context.state[context.side].id, plan.move)
  if (!allowed(context, move)) return null
  if (move.category === 'normal') return inReach(context, move) ? move : null
  if (move.tuning.reach > 0 && !inReach(context, move)) return null
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
