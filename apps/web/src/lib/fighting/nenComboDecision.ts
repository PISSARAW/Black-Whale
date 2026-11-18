import { comboChoices } from './comboChoices'
import { preparedNenDestinations, preparedBranchReady } from './nenPreparedBranches'
import { nenTransferFrames } from './nenTransfer'
import { attackData } from './frameData'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { voluntaryNenAvailable } from './nenAccess'
import type { FighterMove } from './movesetTypes'
import type { FightNenZone, FightSide, FightState } from './types'

export interface NenComboDecision {
  move?: FighterMove
  focus?: FightNenZone
}
/** Prefer an earned personal conversion and wait for a real redistribution when time permits. */
export function nenComboDecision(state: FightState, side: FightSide): NenComboDecision {
  const f = state[side]
  if (!f.attack?.confirmedHit) return {}
  const earned = preparedNenDestinations(f)
  const choices = comboChoices(state, side).filter(
    (c) => c.status === 'ready' || c.status === 'wait',
  )
  const personal = f.nenTactics?.slots ?? []
  choices.sort((a, b) => score(b.move, { earned, personal }) - score(a.move, { earned, personal }))
  for (const choice of choices) {
    const next = decisionForChoice(choice, { state, side, earned })
    if (next) return next
  }
  return {}
}
function decisionForChoice(
  choice: ReturnType<typeof comboChoices>[number],
  context: { state: FightState; side: FightSide; earned: string[] },
): NenComboDecision | null {
  const { state, side, earned } = context,
    f = state[side],
    move = choice.move
  const focused = earned.includes(move.id) && !preparedBranchReady(f, move.id)
  if (choice.status === 'ready' && !focused) return { move }
  const waiting = focused || choice.nenReadiness === 'distribution'
  return waiting && canTransfer(state, side, move) ? { focus: move.tuning.auraZone } : null
}

function score(
  move: FighterMove,
  options: { earned: string[]; personal: readonly string[] },
): number {
  return (
    Number(options.earned.includes(move.id)) * 8 +
    Number(options.personal.includes(move.slot)) * 4 +
    Number(move.category === 'special') * 2
  )
}
function canTransfer(state: FightState, side: FightSide, move: FighterMove): boolean {
  const f = state[side],
    target = state[side === 'player' ? 'opponent' : 'player']
  if (
    !f.attack ||
    f.nen.ko ||
    !voluntaryNenAvailable(f, { requireHatsu: false, requireReserve: true })
  )
    return false
  const remaining = attackData(f.attack.kind, f).cancelEnd - f.attack.frame
  const delay = f.nenTransfer ? f.nenTransfer.duration - f.nenTransfer.age : nenTransferFrames(f)
  return remaining >= delay && target.hitStun > move.tuning.startup + delay
}
/** Close-range styles can earn their first conversion before spending their personal setup. */
export function nenPhysicalOpener(state: FightState, side: FightSide): FighterMove | null {
  const f = state[side],
    target = state[side === 'player' ? 'opponent' : 'player']
  if (!openerAvailable(f)) return null
  const move = moveForSlot(f.id, 'standingLight')
  return move &&
    Math.abs(f.x - target.x) <= move.tuning.reach &&
    canUseMovesetMove(state, side, move)
    ? move
    : null
}

function openerAvailable(f: FightState['player']): boolean {
  return (
    !f.attack &&
    !f.nenConversionCount &&
    f.nenTactics?.goal === 'prepare' &&
    f.nenTactics.slots.length > 0 &&
    f.nenTactics.range[0] < 14 &&
    f.aura >= 28
  )
}
