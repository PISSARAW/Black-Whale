import { voluntaryNenAvailable } from './nenAccess'
import { chainAbilitySealed } from './kurapika'
import { chainAbilityGroup } from './chainAbilityGroup'
import { chrolloHasActivePage } from './chrolloBook'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function ownsBungeeGum(fighter: ArcadeFighter): boolean {
  if (!voluntaryNenAvailable(fighter) || chainAbilitySealed(fighter, 'hisoka:neutralSpecial'))
    return false
  if (fighter.id === 'hisoka') return true
  if (fighter.id === 'chrollo') return bookHasGum(fighter)
  const held = fighter.kurapika?.held
  return Boolean(
    held?.loaded &&
    fighter.kurapika?.emperorTime &&
    chainAbilityGroup(held.moveId) === 'bungee-gum',
  )
}
function bookHasGum(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.chrolloBook?.pages.some(
      (page) =>
        (page === 'hisoka' || chainAbilityGroup(page) === 'bungee-gum') &&
        chrolloHasActivePage(fighter, page),
    ),
  )
}
export function gumLoanUsed(fighter: ArcadeFighter): boolean {
  return fighter.id === 'kurapika' && Boolean(fighter.kurapika?.held?.used)
}
export function spendGumUse(state: FightState, side: FightSide, cost: number): FightState {
  const fighter = state[side],
    chain = fighter.kurapika
  return {
    ...state,
    [side]: {
      ...fighter,
      aura: fighter.aura - cost,
      kurapika:
        chain?.held?.source === 'hisoka'
          ? { ...chain, held: { ...chain.held, used: true, sustainedKeys: ['gum-support'] } }
          : chain,
    },
  }
}
