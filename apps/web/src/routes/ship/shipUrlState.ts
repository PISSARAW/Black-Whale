import type { BeyondLineageFilter, MapEntityFilter } from '$lib/state/mapState.svelte'
import { resolveRegionLocationSlug } from '$lib/map/mapAssetRegistry'

export const SHIP_TIERS = [
  'tier-1',
  'tier-1-b',
  'tier-1-c',
  'tier-2',
  'tier-3',
  'tier-3-b',
  'tier-3-c',
  'tier-4',
  'tier-4-b',
  'tier-5',
  'tier-5-b',
] as const

const ENTITY_FILTERS = new Set<MapEntityFilter>(['all', 'characters', 'objects'])
const LINEAGE_FILTERS = new Set<BeyondLineageFilter>(['all', 'any', 'confirmed', 'suspected'])
const FACTIONS = new Set(['princes', 'guards', 'hunters', 'spider', 'mafia'])

export interface ShipUrlState {
  tier: string | null
  location: string | null
  showEntities: boolean
  entityType: MapEntityFilter
  factions: string[]
  beyondLineage: BeyondLineageFilter
  showUnknownPositions: boolean
}

interface UrlLocation {
  slug: string
  parentLocationId?: string | null
  id?: string
}

function levelTier(tier: string) {
  return tier.replace(/-[bc]$/, '')
}

function belongsToTier(location: UrlLocation, tier: string, locations: UrlLocation[]) {
  const expectedTier = levelTier(tier)
  const byId = new Map(
    locations.flatMap((candidate) => (candidate.id ? [[candidate.id, candidate] as const] : [])),
  )
  const visited = new Set<string>()
  let current: UrlLocation | undefined = location

  while (current) {
    if (current.slug === expectedTier) return true
    if (!current.parentLocationId || visited.has(current.parentLocationId)) return false
    visited.add(current.parentLocationId)
    current = byId.get(current.parentLocationId)
  }

  return false
}

function validatedLocation(url: URL, tier: string | null, locations: UrlLocation[]) {
  if (!tier) return null
  const requested = url.searchParams.get('location')
  const slug = resolveRegionLocationSlug(requested)
  if (!requested || !slug) return null
  const matched = locations.find((location) => location.slug === slug)
  return matched && belongsToTier(matched, tier, locations) ? requested : null
}

export function readShipUrlState(url: URL, locations: UrlLocation[]): ShipUrlState {
  const requestedTier = url.searchParams.get('tier')
  const tier = SHIP_TIERS.includes(requestedTier as (typeof SHIP_TIERS)[number])
    ? requestedTier
    : null
  const location = validatedLocation(url, tier, locations)
  const entity = url.searchParams.get('entity') as MapEntityFilter | null
  const lineage = url.searchParams.get('lineage') as BeyondLineageFilter | null

  return {
    tier,
    location,
    showEntities: url.searchParams.get('positions') !== '0',
    entityType: entity && ENTITY_FILTERS.has(entity) ? entity : 'all',
    factions: [...new Set(url.searchParams.getAll('faction').filter((item) => FACTIONS.has(item)))],
    beyondLineage: lineage && LINEAGE_FILTERS.has(lineage) ? lineage : 'all',
    showUnknownPositions: url.searchParams.get('unknown') === '1',
  }
}

export function writeShipUrlState(url: URL, state: ShipUrlState): URL {
  const next = new URL(url)
  for (const key of ['tier', 'location', 'positions', 'entity', 'faction', 'lineage', 'unknown']) {
    next.searchParams.delete(key)
  }
  if (state.tier) next.searchParams.set('tier', state.tier)
  if (state.tier && state.location) next.searchParams.set('location', state.location)
  if (!state.showEntities) next.searchParams.set('positions', '0')
  if (state.entityType !== 'all') next.searchParams.set('entity', state.entityType)
  for (const faction of state.factions.filter((item) => FACTIONS.has(item)).sort()) {
    next.searchParams.append('faction', faction)
  }
  if (state.beyondLineage !== 'all') next.searchParams.set('lineage', state.beyondLineage)
  if (state.showUnknownPositions) next.searchParams.set('unknown', '1')
  return next
}
