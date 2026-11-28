import { illumiBodyFree } from './illumiState'
import { maryHeld } from './bloodyMary'
import { biohazardBodyFree } from './biohazard'
import { crossGameBusy } from './crossGame'
import { applyOnContext, canSwearOn } from './onTechnique'
import { performChrolloBookAction, pickChrolloFlipSlot } from './chrolloBookAction'
import { CHROLLO_STEAL } from './chrolloBook'
import type { FightInput, FightSide, FightState, MoveAction } from './types'

export interface PerformMoveOptions {
  state: FightState
  side: FightSide
  action: MoveAction
  input?: FightInput
}

export function blocksMove(fighter: FightState['player']): boolean {
  return Boolean(
    fighter.arenaRecovery ||
    fighter.easterEgg ||
    !biohazardBodyFree(fighter) ||
    !illumiBodyFree(fighter) ||
    maryHeld(fighter) ||
    crossGameBusy(fighter),
  )
}

function forwardHeld(fighter: FightState['player'], input: FightInput): boolean {
  return fighter.facing === 1 ? input.right && !input.left : input.left && !input.right
}

export function performBookShortcut({
  state,
  side,
  action,
  input,
}: PerformMoveOptions): FightState | null {
  const fighter = state[side]
  if (fighter.chrolloBook?.isFlipping) {
    if (action === 'light') return pickChrolloFlipSlot(state, side, 0) ?? state
    if (action === 'heavy') return pickChrolloFlipSlot(state, side, 1) ?? state
  }
  if (!canRecycleStolenPage(fighter, action, input)) return null
  return performChrolloBookAction({ state, side, kind: 'special', moveId: CHROLLO_STEAL })
}

function canRecycleStolenPage(
  fighter: FightState['player'],
  action: MoveAction,
  input?: FightInput,
): boolean {
  return Boolean(
    action === 'special' &&
    fighter.id === 'chrollo' &&
    fighter.chrolloBook?.stolenPage &&
    !fighter.attack &&
    input &&
    forwardHeld(fighter, input) &&
    !input.down,
  )
}

export function performOnShortcut({
  state,
  side,
  action,
  input,
}: PerformMoveOptions): FightState | null {
  const fighter = state[side]
  if (action !== 'special' || !input?.aura || input.directControls || !canSwearOn(fighter))
    return null
  const sworn = applyOnContext(fighter, { ...input, hatsu: true })
  return sworn ? { ...state, [side]: sworn } : null
}
