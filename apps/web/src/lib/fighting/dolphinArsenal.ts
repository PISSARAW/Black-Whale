import { withLoanCarrier } from './dolphinBorrowing'
import { stolenAuraActor } from './dolphinSupply'
import { withDolphinIdentity, recordDolphinEffects } from './kurapikaDolphin'
import { chainAbilityGroup } from './chainAbilityGroup'
import { canUseMovesetMove, movesetFor, moveById } from './movesets'
import type { ArsenalOption } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightSide, FightState } from './types'

export function performDolphinApplication(
  options: { state: FightState; side: FightSide; moveId: string },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, moveId } = options
  const fighter = state[side],
    held = fighter.kurapika?.held
  if (!held?.loaded) return state
  if (!dolphinApplicationOwned(fighter)) return state
  if (!validDolphinApplication(moveId, held.moveId)) return state
  if (held.used) return continuingDolphinApplication(options, perform)
  const prepared = {
    ...state,
    [side]: { ...fighter, kurapika: { ...fighter.kurapika!, held: { ...held, moveId } } },
  }
  const cast = perform({
    state: prepared,
    side,
    kind: 'special',
    moveId: 'kurapika:backSpecial',
    auraCharged: false,
  })
  return cast === prepared ? state : cast
}
export function dolphinArsenalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].dolphinLoan) return withLoanOptions(state, side)
  return equippedArsenalOptions(state, side)
}
function withLoanOptions(state: FightState, side: FightSide): ArsenalOption[] {
  let result: ArsenalOption[] = []
  withLoanCarrier(state, { side, kurapikaCommand: true }, (borrowed) => {
    result = equippedArsenalOptions(borrowed, side)
    return borrowed
  })
  return result
}
function equippedArsenalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const fighter = state[side],
    held = fighter.kurapika?.held
  if (fighter.id !== 'kurapika' || !held?.loaded || held.lentTo) return []
  const prepared = {
    ...state,
    [side]: stolenAuraActor({
      ...fighter,
      id: held.source,
      nenOwner: fighter.nenOwner ?? fighter.id,
      stolenChainAbility: undefined,
    }),
  }
  return (movesetFor(held.source)?.moves ?? [])
    .filter(
      (move) =>
        ['special', 'finisher'].includes(move.category) &&
        chainAbilityGroup(move.id) === chainAbilityGroup(held.moveId) &&
        (!held.used || dolphinCanContinue(state, side, move.id)),
    )
    .map((move) => ({
      command: { action: 'dolphin-move', target: move.id },
      labelFr: `Dolphin · ${move.nameFr}`,
      labelEn: `Dolphin · ${move.nameEn}`,
      ready: fighter.kurapika!.emperorTime && canUseMovesetMove(prepared, side, move),
      conditionFr:
        'Choisir une application du même Hatsu ; un seul usage, Emperor Time, aura prélevée et matériel réel requis.',
      conditionEn:
        'Choose an application of the same Hatsu; one use only, Emperor Time, stolen aura and real equipment required.',
    }))
}

export function dolphinCanContinue(state: FightState, side: FightSide, moveId: string): boolean {
  const held = state[side].kurapika?.held
  return (
    held?.source === 'hisoka' &&
    !held.returned &&
    state.bungeeGum?.owner === side &&
    ['hisoka:forwardSpecial', 'hisoka:backSpecial'].includes(moveId)
  )
}
function continuingDolphinApplication(
  options: { state: FightState; side: FightSide; moveId: string },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, moveId } = options
  if (!dolphinCanContinue(state, side, moveId)) return state
  const move = moveById(moveId)!
  const cast = withDolphinIdentity(
    state,
    (borrowed) =>
      perform({
        state: borrowed,
        side,
        kind: move.kind,
        moveId,
        variant: move.variant,
        auraCharged: false,
      }),
    'hisoka',
  )
  return recordDolphinEffects(state, cast, side)
}

function validDolphinApplication(moveId: string, heldMoveId: string): boolean {
  const move = moveById(moveId)
  return Boolean(
    move &&
    ['special', 'finisher'].includes(move.category) &&
    chainAbilityGroup(moveId) === chainAbilityGroup(heldMoveId),
  )
}

function dolphinApplicationOwned(fighter: FightState['player']): boolean {
  return fighter.id === 'kurapika' && !fighter.kurapika?.held?.lentTo
}
