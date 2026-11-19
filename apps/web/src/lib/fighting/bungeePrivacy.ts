import { gumLinkVisible } from './bungeeNetwork'
import { gyoSight } from './nenPerception'
import type { GumNetwork } from './bungeeTypes'
import type { FightSide, FightState } from './types'
import type { FutureFrame } from './parallelFutureTypes'

export function privateGumNetwork(state: FightState, side?: FightSide): GumNetwork | undefined {
  const network = state.gumNetwork
  if (!network) return undefined
  const links = network.links.filter((link) =>
    side ? gumLinkVisible(state, link, side) : !link.hidden,
  )
  return {
    ...network,
    links: links.map((link) =>
      link.owner === side ? link : { ...link, source: undefined, theftId: undefined },
    ),
    nextId: Math.max(0, ...links.map((link) => link.id)) + 1,
    limbs: side ? { [side]: network.limbs[side] } : {},
    pending: side ? { [side]: network.pending[side] } : {},
    selected: side ? { [side]: network.selected[side] } : {},
  }
}

export function privateGumFuture(state: FightState, frame: FutureFrame, side: FightSide): void {
  if (!frame.scene) return
  const predicted = {
    ...state,
    player: frame.player,
    opponent: frame.opponent,
    projectiles: frame.projectiles,
    gumNetwork: frame.scene.gumNetwork,
  }
  frame.projectiles = privateGumProjectiles(predicted, side)
  frame.scene.gumNetwork = privateGumNetwork(predicted, side)
  const link = frame.scene.bungeeGum
  if (link?.hidden && link.owner !== side && !gyoSight(predicted[side]))
    frame.scene.bungeeGum = null
}
export function privateGumProjectiles(
  state: FightState,
  side?: FightSide,
): FightState['projectiles'] {
  const hidden = new Set(
    (state.gumNetwork?.links ?? [])
      .filter((link) => (side ? !gumLinkVisible(state, link, side) : link.hidden))
      .flatMap((link) => (link.target.kind === 'projectile' ? [link.target.id] : [])),
  )
  return state.projectiles.map((shot) =>
    hidden.has(shot.id) ? { ...shot, gumFlight: undefined } : shot,
  )
}
