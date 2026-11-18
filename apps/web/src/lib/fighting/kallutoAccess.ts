import { voluntaryNenAvailable } from './nenAccess'
import { chrolloAbilityActive } from './chrolloAbilityActive'
import { chainAbilityGroup } from './chainAbilityGroup'
import type { PaperCommand } from './kallutoPaperTypes'
import { chainAbilitySealed } from './kurapika'
import { equippedDolphin, loanCarrier } from './dolphinBorrowing'
import { stolenAuraActor } from './dolphinSupply'
import type { ArcadeFighter } from './types'

export function paperAvailable(body: ArcadeFighter): boolean {
  if (body.weaponsConfiscated) return false
  return paperAbilityAvailable(body, 'plant') || paperAbilityAvailable(body, 'doll')
}

export function paperAbilityAvailable(body: ArcadeFighter, command: PaperCommand): boolean {
  const moveId = command === 'doll' ? 'kalluto:backSpecial' : 'kalluto:neutralSpecial'
  const held = equippedDolphin(body)
  const borrowed = Boolean(
    held?.used &&
    !held.returned &&
    held.source === 'kalluto' &&
    chainAbilityGroup(held.moveId) === chainAbilityGroup(moveId),
  )
  const actor = borrowed
    ? stolenAuraActor({ ...loanCarrier(body), stolenChainAbility: undefined })
    : body
  return (
    voluntaryNenAvailable(actor, { requireReserve: true, requireHatsu: !borrowed }) &&
    (borrowed || ownsPaper(actor, moveId)) &&
    !chainAbilitySealed(actor, moveId)
  )
}

function ownsPaper(actor: ArcadeFighter, moveId: string): boolean {
  return actor.id === 'kalluto' || (actor.id === 'chrollo' && chrolloAbilityActive(actor, moveId))
}
