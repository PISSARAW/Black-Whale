import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/config'

import type { MapMarker, ZoomLevel } from './types'
import { localRoomAnchors, spotAnchorFor, spotNoteFor } from './roomAnchors'
import { tierOverviewBand, tierOverviewSpan } from './overview'

// ──────────────────────────────────────────────
// Layout
// ──────────────────────────────────────────────

/**
 * Spreads markers so they stop overlapping at the current zoom. Overview packs
 * each tier into its own band of up to twelve columns; local view grids the
 * whole set around the centre; tier view keeps the computed coordinates.
 *
 * Both the present and the parallel-future overlays used to carry an identical
 * copy of this block.
 */
export function packMarkersForZoom<T extends MapMarker>(
  markers: T[],
  zoom: ZoomLevel,
  locale: Locale = DEFAULT_LOCALE,
): T[] {
  if (zoom === 'TIER') return markers

  if (zoom === 'LOCAL') {
    // A spot inside the room outranks the room itself, which outranks the
    // centred grid. Markers with either kind of anchor leave the grid, and the
    // rest must be counted among themselves, or a single anchored marker would
    // still shift everyone else off centre.
    const unanchored = markers.filter(
      (marker) => !spotAnchorFor(marker) && !localRoomAnchors[marker.locationId ?? ''],
    )
    const columns = Math.min(6, Math.ceil(Math.sqrt(unanchored.length)))
    const rows = Math.ceil(unanchored.length / columns)

    return markers.map((marker) => {
      const spot = spotAnchorFor(marker)
      // Every local marker states what its position in the room is worth, so a
      // fixture canon named and a point the map had to invent never read alike.
      const spotLabel = spotNoteFor(spot, locale)
      if (spot?.exact) {
        // Canon names this fixture for this passenger, so the marker sits on it
        // rather than being fanned out with the rest of the room.
        return { ...marker, x: spot.x, y: spot.y, spotLabel }
      }
      if (spot) {
        // Everyone the room catches by default shares one corner, so they do
        // have to fan out — the guard side of a cell holds a whole watch.
        const peers = markers
          .filter((peer) => !spotAnchorFor(peer)?.exact && peer.locationId === marker.locationId)
          .map((peer) => peer.id)
          .sort()
        const seat = Math.max(0, peers.indexOf(marker.id))
        return {
          ...marker,
          x: spot.x + (seat % 3) * 4,
          y: spot.y + Math.floor(seat / 3) * 5,
          spotLabel,
        }
      }

      const anchor = localRoomAnchors[marker.locationId ?? '']
      if (anchor) {
        // A room is 17% of the box wide and 25% tall, so occupants fan out in
        // steps small enough to stay inside their own walls.
        const roommates = markers
          .filter((peer) => peer.locationId === marker.locationId)
          .map((peer) => peer.id)
          .sort()
        const seat = Math.max(0, roommates.indexOf(marker.id))
        const roomColumns = Math.min(2, roommates.length)
        const roomRows = Math.ceil(roommates.length / roomColumns)
        // A room anchor answers which room, never where in it.
        return {
          ...marker,
          x: anchor.x + ((seat % roomColumns) - (roomColumns - 1) / 2) * 5,
          y: anchor.y + (Math.floor(seat / roomColumns) - (roomRows - 1) / 2) * 5,
          spotLabel,
        }
      }

      const index = Math.max(
        0,
        unanchored.findIndex((peer) => peer.id === marker.id),
      )
      return {
        ...marker,
        x: 50 + ((index % columns) - (columns - 1) / 2) * 3,
        y: 50 + (Math.floor(index / columns) - (rows - 1) / 2) * 3,
        spotLabel,
      }
    })
  }

  const tierGroups = new Map<string, T[]>()
  for (const marker of markers) {
    const key = marker.tierId || 'outside'
    const group = tierGroups.get(key) || []
    group.push(marker)
    tierGroups.set(key, group)
  }
  for (const group of tierGroups.values())
    group.sort((left, right) => left.id.localeCompare(right.id))

  return markers.map((marker) => {
    const group = tierGroups.get(marker.tierId || 'outside') || [marker]
    const index = Math.max(
      0,
      group.findIndex((candidate) => candidate.id === marker.id),
    )
    // Wide rather than tall: the section gives a deck the length and the height
    // it really has, so a crowd spreads along that deck and is packed tighter
    // down until it fits between its own floor and its own ceiling. Both bounds
    // are the deck's own — a fixed band put tier 5 in the water astern.
    const columns = Math.min(24, group.length)
    const rows = Math.ceil(group.length / columns)
    const [fore, aft] = tierOverviewSpan[marker.tierId ?? ''] ?? [16, 84]
    const inset = (aft - fore) * 0.06
    const band = tierOverviewBand[marker.tierId ?? ''] ?? 4
    const pitch = Math.min(1.8, band / Math.max(rows, 1))
    return {
      ...marker,
      x: fore + inset + ((index % columns) + 0.5) * ((aft - fore - 2 * inset) / columns),
      y: marker.overviewY + (Math.floor(index / columns) - (rows - 1) / 2) * pitch,
    }
  })
}
