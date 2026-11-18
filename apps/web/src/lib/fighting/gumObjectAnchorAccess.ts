import { equippedDolphin, loanCarrier } from './dolphinBorrowing'
import { stolenAuraActor } from './dolphinSupply'
import { chrolloHasActivePage } from './chrolloBook'
import { chainAbilityGroup } from './chainAbilityGroup'
import { chainAbilitySealed } from './kurapika'
import { voluntaryNenAvailable } from './nenAccess'
import type { GumObjectAnchor } from './gumObjectAnchors'
import type { ArcadeFighter } from './types'

type GumOrigin = Pick<GumObjectAnchor, 'source' | 'theftId'>

export function gumAnchorNenAvailable(actor: ArcadeFighter, anchor: GumOrigin): boolean {
  if (!anchor.source) return false
  if (anchor.source === 'dolphin') return borrowedAnchorAvailable(actor, anchor)
  const own = personalGumBody(actor)
  if (!voluntaryNenAvailable(own) || chainAbilitySealed(own, 'hisoka:neutralSpecial')) return false
  if (anchor.source === 'personal') return own.id === 'hisoka'
  return own.id === 'chrollo' && activeGumPage(own)
}
export function gumAnchorCommandScope(actor: ArcadeFighter, anchor: GumOrigin): boolean {
  if (actor.dolphinExecution)
    return anchor.source === 'dolphin' && anchor.theftId === equippedDolphin(actor)?.theftId
  return anchor.source === ((actor.nenOwner ?? actor.id) === 'chrollo' ? 'book' : 'personal')
}
function activeGumPage(actor: ArcadeFighter): boolean {
  return Boolean(
    actor.chrolloBook?.pages.some(
      (page) => chainAbilityGroup(page) === 'bungee-gum' && chrolloHasActivePage(actor, page),
    ),
  )
}
function personalGumBody(actor: ArcadeFighter): ArcadeFighter {
  const context = actor.dolphinExecution
  return {
    ...actor,
    id: actor.nenOwner ?? actor.id,
    aura: context ? context.ownAura : actor.aura,
    auraExhausted: context ? context.ownExhausted : actor.auraExhausted,
    nen: context ? context.ownNen : actor.nen,
  }
}
function borrowedAnchorAvailable(actor: ArcadeFighter, anchor: GumOrigin): boolean {
  const held = equippedDolphin(actor)
  if (
    !held?.used ||
    held.returned ||
    held.source !== 'hisoka' ||
    held.theftId !== anchor.theftId ||
    chainAbilityGroup(held.moveId) !== 'bungee-gum'
  )
    return false
  const carrier = actor.dolphinLoan ? loanCarrier(actor) : actor
  return Boolean(
    carrier.kurapika?.emperorTime &&
    voluntaryNenAvailable(
      stolenAuraActor({
        ...carrier,
        stolenChainAbility: undefined,
      }),
    ),
  )
}
