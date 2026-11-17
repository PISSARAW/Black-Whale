import { judgmentForbidsNen } from './judgmentRules'
import { performParallelFutureAction } from './parallelFutureAbility'
import { performCyclotronAction } from './phinksAction'
import { performKurapikaAction, toggleEmperorTime } from './kurapikaActions'
import { moveById } from './movesets'
import { hasDuelComboProfile } from './duelComboProfiles'
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
  // These fighters expose directional combo branches; preserve the player's exact choice.
  if (hasDuelComboProfile(fighter.id)) return selected
  if (['chrollo', 'illumi', 'tserriednich', 'phinks', 'bonolenov', 'padaille'].includes(fighter.id)) return selected
  if (['shizuku', 'kalluto'].includes(fighter.id)) return selected
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
  const utility = nativeUtilityOverride(options, selected)
  if (utility) return utility
  if (state[side].id === 'kurapika' && action === 'finisher' && input.aura)
    return toggleEmperorTime(state, side)
  const selectedChain = selectedChainOverride(options, selected, perform)
  return selectedChain ?? judgmentOverride({ ...options, selected }, perform)
}

function nativeUtilityOverride(
  options: MoveContext,
  selected: FighterMove | null,
): FightState | null {
  const { state, side, action } = options
  if (action !== 'special' && action !== 'finisher') return null
  const cast = { phinks: performCyclotronAction, tserriednich: performParallelFutureAction }
  const id = state[side].id
  if (!(id in cast)) return null
  return cast[id as keyof typeof cast]({
    state,
    side,
    kind: 'special',
    moveId: selected?.id,
    auraCharged: false,
  })
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

function judgmentOverride(options: MoveContext & { selected: FighterMove | null }, perform: PerformAttack): FightState | null {
  const { state, side, action, input } = options
  if (!judgmentForbidsNen(state[side])) return null
  if (action !== 'special' && action !== 'finisher' && !input.aura) return null
  return performKurapikaAction({ state, side, kind: options.selected?.kind ?? 'special', moveId: options.selected?.id, auraCharged: input.aura }, perform)
}
