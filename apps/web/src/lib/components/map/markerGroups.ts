import type { MapMarker, ZoomLevel } from './markerProjection'

const CERTAINTY_RANK: Record<string, number> = {
  UNKNOWN: 0,
  LAST_KNOWN: 1,
  PROBABLE: 2,
  CONFIRMED: 3,
}

export interface MarkerGroup {
  id: string
  markers: MapMarker[]
  x: number
  y: number
  color: string
  certainty: string
}

export function markerInitials(identity: string) {
  if (!identity || /unknown|inconnu|suppos/i.test(identity)) return '?'
  const words = identity.trim().split(/\s+/u).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => [...word][0]?.toLocaleUpperCase() || '')
    .join('')
}

export function aggregateCertainty(markers: MapMarker[]) {
  return markers.reduce((least, marker) => {
    const certainty = marker.certainty || 'UNKNOWN'
    return (CERTAINTY_RANK[certainty] ?? 0) < (CERTAINTY_RANK[least] ?? 0) ? certainty : least
  }, markers[0]?.certainty || 'UNKNOWN')
}

function groupKey(marker: MapMarker, zoom: ZoomLevel) {
  if (zoom === 'OVERVIEW') return marker.tierId?.match(/^tier-\d/)?.[0] || 'outside'
  if (zoom === 'TIER') return marker.locationId || marker.id
  return marker.id
}

export function groupMarkersForZoom(markers: MapMarker[], zoom: ZoomLevel): MarkerGroup[] {
  const grouped = new Map<string, MapMarker[]>()
  for (const marker of markers) {
    const key = groupKey(marker, zoom)
    grouped.set(key, [...(grouped.get(key) || []), marker])
  }

  return [...grouped.entries()].map(([id, members]) => {
    const sorted = [...members].sort((left, right) => left.id.localeCompare(right.id))
    const certainty = aggregateCertainty(sorted)
    const x = sorted.reduce((sum, marker) => sum + marker.x, 0) / sorted.length
    const y = sorted.reduce((sum, marker) => sum + marker.y, 0) / sorted.length
    return {
      id,
      markers: sorted,
      x,
      y,
      color: sorted.find((marker) => marker.certainty === certainty)?.positionColor || '#8b9a98',
      certainty,
    }
  })
}
