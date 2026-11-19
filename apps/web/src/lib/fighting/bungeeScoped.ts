import { gumNetwork, removeGumLinks, withGumNetwork, selectedGumLink } from './bungeeNetwork'
import {
  sameGumSource,
  gumSourceAvailable,
  gumSourceCommandAllowed,
  type GumSource,
} from './bungeeSource'
import type { FightSide, FightState } from './types'
export function commandGumLink(state: FightState, side: FightSide) {
  const link = selectedGumLink(state, side)
  return link && gumSourceAvailable(state, side, link) && gumSourceCommandAllowed(state[side], link)
    ? link
    : undefined
}

export function gumSourceBusy(state: FightState, side: FightSide, scope: GumSource): boolean {
  const network = gumNetwork(state)
  const pending = network.pending[side]
  return (
    network.links.some((link) => link.owner === side && sameGumSource(link, scope)) ||
    Boolean(pending && sameGumSource(pending, scope))
  )
}
export function clearGumSource(state: FightState, side: FightSide, scope: GumSource): FightState {
  const next = removeGumLinks(state, (link) => link.owner === side && sameGumSource(link, scope))
  const network = next.gumNetwork
  if (!network?.pending[side] || !sameGumSource(network.pending[side], scope)) return next
  return withGumNetwork(next, {
    ...network,
    pending: { ...network.pending, [side]: undefined },
  })
}
