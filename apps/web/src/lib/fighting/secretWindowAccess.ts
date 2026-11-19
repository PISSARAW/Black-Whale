import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { equippedDolphin, loanCarrier } from './dolphinBorrowing'
import { stolenAuraActor } from './dolphinSupply'
import type { ArcadeFighter } from './types'

/** Evaluate the actual device's aura, keeping physical Nen restraints and On seals. */
export function secretWindowNenActive(body: ArcadeFighter): boolean {
  const held = equippedDolphin(body)
  const borrowed = Boolean(held?.used && !held.returned && held.source === 'musse')
  const actor = borrowed
    ? stolenAuraActor({ ...loanCarrier(body), stolenChainAbility: undefined })
    : body
  return (
    voluntaryNenAvailable(actor, {
      requireReserve: true,
      requireHatsu: !borrowed,
    }) &&
    (borrowed || ownsSecretWindow(actor)) &&
    !chainAbilitySealed(actor, 'musse:neutralSpecial')
  )
}

function ownsSecretWindow(actor: ArcadeFighter): boolean {
  if (actor.id === 'musse') return true
  if (actor.id === 'chrollo') return chrolloHasActivePage(actor, 'musse')
  return (
    actor.id === 'benjamin' &&
    Boolean(actor.hatsuEffects.baton?.inherited.includes('secret-window'))
  )
}
