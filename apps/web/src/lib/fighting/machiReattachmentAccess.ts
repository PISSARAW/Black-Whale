import { equippedDolphin, loanCarrier, dolphinLoanActive } from './dolphinBorrowing'
import { dolphinSupplyAvailable } from './dolphinSupply'
import { newGumSource, type GumSource } from './bungeeSource'
import { machiSourceActive } from './machiThread'
import { voluntaryNenAvailable } from './nenAccess'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function ownsMachiReattachment(actor: ArcadeFighter): boolean {
  if (machiSourceActive(actor)) return true
  const held = actor.kurapika?.held
  return Boolean(
    actor.id === 'kurapika' &&
    actor.kurapika?.emperorTime &&
    held?.loaded &&
    !held.returned &&
    held.source === 'machi' &&
    voluntaryNenAvailable(actor),
  )
}
export function machiReattachmentUsed(actor: ArcadeFighter): boolean {
  return newGumSource(actor).source === 'dolphin' && Boolean(equippedDolphin(actor)?.used)
}
export function spendMachiReattachment(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    chain = actor.kurapika
  const borrowed = newGumSource(actor).source === 'dolphin'
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - 20,
      kurapika:
        borrowed && chain?.held
          ? {
              ...chain,
              held: {
                ...chain.held,
                used: true,
                sustainedKeys: [...new Set([...chain.held.sustainedKeys, 'machi-reattachment'])],
              },
            }
          : chain,
    },
  }
}
export function machiReattachmentOriginLive(
  state: FightState,
  side: FightSide,
  origin?: GumSource,
): boolean {
  if (origin?.source !== 'dolphin') return machiSourceActive(state[side])
  const actor = state[side],
    held = equippedDolphin(actor)
  if (actor.dolphinLoan && !dolphinLoanActive(state, side)) return false
  return Boolean(
    held?.used &&
    !held.returned &&
    held.source === 'machi' &&
    held.theftId === origin.theftId &&
    dolphinSupplyAvailable(loanCarrier(actor)),
  )
}
export function borrowedMachiReattachmentBusy(state: FightState, side: FightSide): boolean {
  const work = state[side].machiReattachment
  return Boolean(
    work?.origin?.source === 'dolphin' &&
    work.origin.theftId === equippedDolphin(state[side])?.theftId,
  )
}
