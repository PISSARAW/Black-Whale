import { equippedDolphin } from './dolphinBorrowing'
import { newGumSource } from './bungeeSource'
import { somePhysicalBody, mapPhysicalBodies } from './physicalBodyMap'
import { releasePreparedEntity } from './preparedCorpseBody'
import type { CorpseControl } from './illumiCorpseTypes'
import type { FightSide, FightState } from './types'

export function corpseLoanUsed(actor: FightState['player']): boolean {
  return newGumSource(actor).source === 'dolphin' && Boolean(equippedDolphin(actor)?.used)
}
export function spendCorpseUse(state: FightState, side: FightSide, cost: number): FightState {
  const actor = state[side],
    chain = actor.kurapika
  const borrowed = newGumSource(actor).source === 'dolphin'
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - cost,
      kurapika:
        borrowed && chain?.held
          ? {
              ...chain,
              held: {
                ...chain.held,
                used: true,
                sustainedKeys: [...new Set([...chain.held.sustainedKeys, 'corpse-control'])],
              },
            }
          : chain,
    },
  }
}
function matchingCorpseScope(
  state: FightState,
  side: FightSide,
  control?: Pick<CorpseControl, 'owner' | 'origin'>,
): boolean {
  const held = equippedDolphin(state[side])
  return Boolean(
    held?.used &&
    !held.returned &&
    matchingCorpseOwner(control, side, state.teamMatch?.seats[side].active ?? 0) &&
    control?.origin?.source === 'dolphin' &&
    control.origin.theftId === held.theftId,
  )
}
function matchingCorpseOwner(
  control: Pick<CorpseControl, 'owner'> | undefined,
  side: FightSide,
  member: number,
): boolean {
  return Boolean(control && control.owner.owner === side && control.owner.member === member)
}
export function borrowedCorpseBusy(state: FightState, side: FightSide): boolean {
  return (
    somePhysicalBody(state, (actor) => matchingCorpseScope(state, side, actor.corpsePreparation)) ||
    Boolean(
      state.battlefield?.entities.some((entry) =>
        matchingCorpseScope(state, side, entry.corpseControl),
      ),
    )
  )
}

/** Dismiss this one loan's control, retaining its physical pins and the original corpse. */
export function finishBorrowedCorpse(state: FightState, side: FightSide): FightState | null {
  if (!borrowedCorpseBusy(state, side)) return null
  const cleared = mapPhysicalBodies(state, (actor) =>
    matchingCorpseScope(state, side, actor.corpsePreparation)
      ? { ...actor, corpsePreparation: undefined }
      : actor,
  )
  const field = cleared.battlefield
  return field
    ? {
        ...cleared,
        battlefield: {
          ...field,
          entities: field.entities.map((entry) =>
            matchingCorpseScope(state, side, entry.corpseControl)
              ? { ...releasePreparedEntity(entry), corpseControl: undefined }
              : entry,
          ),
        },
      }
    : cleared
}
