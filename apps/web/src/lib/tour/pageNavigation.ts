import type { Crossing, Ship } from './blueprint'
import type { Link, Space } from './types'

export interface LinkWords {
  takeLink: (destination: string) => string
  takeBulkhead: (destination: string) => string
  retractable: (destination: string) => string
  enterInterior: (destination: string) => string
  leaveInterior: (destination: string) => string
}

type NameOf = (entity: { name: string; nameFr: string }) => string

export function linkPrompt(options: {
  available: { link: Link; to: string } | null
  ship: Ship
  nameOf: NameOf
  words: LinkWords
}): string | null {
  if (!options.available) return null
  const destination = options.ship.spaces.get(options.available.to)
  if (!destination) return null
  const tier = options.ship.tiers.find((candidate) => candidate.id === destination.tierId)
  const label = `${options.nameOf(destination)}${tier ? ` — ${options.nameOf(tier)}` : ''}`
  const described = options.available.link.retractable
    ? options.words.retractable(label)
    : label
  if (options.available.link.kind === 'door') {
    return tier?.kind === 'interior'
      ? options.words.enterInterior(options.nameOf(tier))
      : options.words.leaveInterior(options.nameOf(destination))
  }
  return options.available.link.kind === 'bulkhead'
    ? options.words.takeBulkhead(described)
    : options.words.takeLink(described)
}

export function crossingLabel(options: {
  crossing: Crossing
  ship: Ship
  nameOf: NameOf
  named: (space: Space) => Space
  up: (label: string) => string
  down: (label: string) => string
  across: (label: string) => string
  retractableLabel?: string
}): string {
  const destination = options.ship.spaces.get(options.crossing.to)
  const tier = destination
    ? options.ship.tiers.find((candidate) => candidate.id === destination.tierId)
    : null
  const label = destination
    ? `${options.nameOf(options.named(destination))}${tier ? ` — ${options.nameOf(tier)}` : ''}`
    : options.crossing.to
  const described = options.crossing.link.retractable
    ? `${label} · ${options.retractableLabel ?? 'retractable gangway'}`
    : label
  if (options.crossing.rise > 0.5) return options.up(described)
  if (options.crossing.rise < -0.5) return options.down(described)
  return options.across(described)
}

export function viewpointUrl(options: {
  current: URL
  spaceId: string | null
  tierId: string
}): URL {
  const url = new URL(options.current)
  url.searchParams.delete('deck')
  url.searchParams.delete('space')
  url.searchParams.set(options.spaceId ? 'space' : 'deck', options.spaceId ?? options.tierId)
  return url
}
