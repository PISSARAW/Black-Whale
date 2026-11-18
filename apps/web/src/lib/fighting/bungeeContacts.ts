import { gumNetwork, gumLinkVisible, ownedGumLinks } from './bungeeNetwork'
import { gumLinkPoints } from './bungeeGeometry'
import { nearestPoint, pointPresence, type EnPresence } from './en/geometry'
import type { FightSide, FightState } from './types'

export function gumEnPresences(state: FightState, side: FightSide): EnPresence[] {
  return gumNetwork(state)
    .links.filter((link) => gumLinkVisible(state, link, side))
    .flatMap((link) => {
      const points = gumLinkPoints(state, link)
      return points
        ? [
            pointPresence(`tether:${link.id}`, {
              ...nearestPoint(state[side], ...points),
              auraReaction: true,
            }),
          ]
        : []
    })
}
export function hiddenGumAffects(state: FightState, side: FightSide): boolean {
  return ownedGumLinks(state, side === 'player' ? 'opponent' : 'player').some(
    (link) => link.hidden && link.target.kind === 'fighter' && link.target.side === side,
  )
}
