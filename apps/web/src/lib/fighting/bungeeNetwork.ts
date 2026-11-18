import { gyoSight } from './nenPerception'
import {
  fallingGumObject,
  MAX_GUM_LINKS,
  type GumLink,
  type GumNetwork,
  type GumTarget,
} from './bungeeTypes'
import type { FightSide, FightState } from './types'

export function gumNetwork(state: FightState): GumNetwork {
  if (state.gumNetwork) return reconcileProjection(state)
  const legacy = state.bungeeGum
  const link: GumLink | undefined = legacy
    ? {
        id: 0,
        owner: legacy.owner,
        limb: 'hand-right',
        target: { kind: 'fighter', side: legacy.target },
        hidden: legacy.hidden,
        motion: legacy.retracting ? (legacy.rebounding ? 'rebound' : 'recall') : 'idle',
      }
    : undefined
  return {
    links: link ? [link] : [],
    nextId: 1,
    selected: link ? { [link.owner]: 0 } : {},
    limbs: {},
    pending: {},
  }
}
function reconcileProjection(state: FightState): GumNetwork {
  const network = state.gumNetwork!
  const legacy = state.bungeeGum
  const candidates = [selectedFrom(network, 'player'), selectedFrom(network, 'opponent')]
  const body = candidates.find(
    (link) => link?.target.kind === 'fighter' && (!legacy || link.owner === legacy.owner),
  )
  if (!body) return network
  if (!legacy) return { ...network, links: network.links.filter((link) => link.id !== body.id) }
  return {
    ...network,
    links: network.links.map((link) =>
      link.id === body.id
        ? {
            ...link,
            hidden: legacy.hidden,
            motion: legacy.retracting ? (legacy.rebounding ? 'rebound' : 'recall') : 'idle',
          }
        : link,
    ),
  }
}
export function ownedGumLinks(state: FightState, side: FightSide): GumLink[] {
  return gumNetwork(state).links.filter((link) => link.owner === side)
}
export function gumNetworkBusy(state: FightState, side: FightSide): boolean {
  return ownedGumLinks(state, side).length > 0 || Boolean(state.gumNetwork?.pending[side])
}
export function selectedGumLink(state: FightState, side: FightSide): GumLink | undefined {
  const network = gumNetwork(state)
  const owned = ownedGumLinks(state, side)
  return owned.find((link) => link.id === network.selected[side]) ?? owned[owned.length - 1]
}
export function gumLinkVisible(state: FightState, link: GumLink, viewer: FightSide): boolean {
  return link.owner === viewer || !link.hidden || gyoSight(state[viewer])
}
export function withGumNetwork(state: FightState, network: GumNetwork): FightState {
  const preferred = state.bungeeGum?.owner ?? 'player'
  const candidates = [
    selectedFrom(network, preferred),
    selectedFrom(network, preferred === 'player' ? 'opponent' : 'player'),
  ]
  const link = candidates.find((entry) => entry?.target.kind === 'fighter')
  const projection =
    link?.target.kind === 'fighter'
      ? {
          owner: link.owner,
          target: link.target.side,
          hidden: link.hidden,
          retracting: link.motion !== 'idle',
          ...(link.motion === 'idle' ? {} : { rebounding: link.motion === 'rebound' }),
        }
      : null
  return { ...state, gumNetwork: network, bungeeGum: projection }
}
function selectedFrom(network: GumNetwork, side: FightSide) {
  const links = network.links.filter((link) => link.owner === side)
  return links.find((link) => link.id === network.selected[side]) ?? links[links.length - 1]
}
export function addGumLink(
  state: FightState,
  options: { side: FightSide; target: GumTarget; hidden: boolean; limb?: GumLink['limb'] },
): FightState {
  const network = gumNetwork(state)
  if (ownedGumLinks(state, options.side).length >= MAX_GUM_LINKS) return state
  const limb = options.limb ?? network.limbs[options.side] ?? 'hand-right'
  const id = network.nextId
  const link: GumLink = {
    id,
    owner: options.side,
    target: options.target,
    hidden: options.hidden,
    limb,
    motion: 'idle',
  }
  return withGumNetwork(state, {
    ...network,
    links: [...network.links, link],
    nextId: id + 1,
    selected: { ...network.selected, [options.side]: id },
  })
}
export function selectGumLink(state: FightState, side: FightSide, id: number): FightState {
  const network = gumNetwork(state)
  if (!network.links.some((link) => link.owner === side && link.id === id)) return state
  return withGumNetwork(state, { ...network, selected: { ...network.selected, [side]: id } })
}
export function moveGumLink(
  state: FightState,
  side: FightSide,
  motion: GumLink['motion'],
): FightState {
  const selected = selectedGumLink(state, side)
  if (!selected) return state
  const network = gumNetwork(state)
  return withGumNetwork(state, {
    ...network,
    links: network.links.map((link) =>
      link.owner === side ? { ...link, motion: link.id === selected.id ? motion : 'idle' } : link,
    ),
  })
}
export function removeGumLinks(state: FightState, remove: (link: GumLink) => boolean): FightState {
  const network = state.gumNetwork ?? gumNetwork(state)
  const dropped = network.links.filter(remove)
  if (!dropped.length) return state
  const ids = new Set(
    dropped.flatMap((link) => (link.target.kind === 'projectile' ? [link.target.id] : [])),
  )
  return withGumNetwork(
    {
      ...state,
      projectiles: state.projectiles.map((shot) =>
        ids.has(shot.id) ? fallingGumObject(shot) : shot,
      ),
    },
    {
      ...network,
      links: network.links.filter((link) => !remove(link)),
    },
  )
}
export function clearOwnedGum(state: FightState, side: FightSide): FightState {
  const next = removeGumLinks(state, (link) => link.owner === side)
  if (!next.gumNetwork) return next
  return withGumNetwork(next, {
    ...next.gumNetwork,
    pending: { ...next.gumNetwork.pending, [side]: undefined },
  })
}
