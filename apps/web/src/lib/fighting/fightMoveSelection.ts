import { performKurapikaAction, toggleEmperorTime } from './kurapikaActions'
import { moveById } from './movesets'
import type { FighterMove } from './movesetTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightInput, FightSide, FightState, MoveAction } from './types'

interface MoveContext {
  state: FightState
  side: FightSide
  action: MoveAction
  input: FightInput
}
type PerformAttack = (options: AuraAttackOptions) => FightState

/** Explicit Chrollo page commands must not be substituted with a same-kind combo route. */
export function routedFightMove(
  fighter: ArcadeFighter,
  selected: FighterMove | null,
): FighterMove | null {
  if (fighter.id === 'chrollo') return selected
  const current = moveById(fighter.attack?.moveId)
  return (
    current?.cancelInto
      .map((id) => moveById(id))
      .find((candidate) => candidate?.kind === selected?.kind) ?? selected
  )
}

/** Preserve character command overrides before selecting a normal cancel destination. */
export function characterMoveOverride(
  options: MoveContext,
  selected: FighterMove | null,
  perform: PerformAttack,
): FightState | null {
  const { state, side, action, input } = options
  if (state[side].id === 'kurapika' && action === 'finisher' && input.aura)
    return toggleEmperorTime(state, side)
  const selectedChain = selectedChainOverride(options, selected, perform)
  return selectedChain ?? judgmentOverride(options, perform)
}

function selectedChainOverride(
  options: MoveContext,
  selected: FighterMove | null,
  perform: PerformAttack,
): FightState | null {
  const { state, side, input } = options
  if (state[side].id !== 'kurapika' || selected?.kind !== 'special') return null
  return performKurapikaAction(
    { state, side, kind: 'special', moveId: selected.id, auraCharged: input.aura },
    perform,
  )
}

function judgmentOverride(options: MoveContext, perform: PerformAttack): FightState | null {
  const { state, side, action, input } = options
  if (!state[side].judgmentChain) return null
  if (action !== 'special' && action !== 'finisher' && !input.aura) return null
  return performKurapikaAction({ state, side, kind: 'special', auraCharged: input.aura }, perform)
}
