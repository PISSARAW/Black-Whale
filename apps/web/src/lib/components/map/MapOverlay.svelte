<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'
  import CharacterMarker from './CharacterMarker.svelte'
  import CharacterMarkerGroup from './CharacterMarkerGroup.svelte'
  import ObjectMarker from './ObjectMarker.svelte'
  import { page } from '$app/stores'
  import { activeHatsu, parallelFutureVisible } from '$lib/nen/hatsuState.js'
  import { resolveRegionLocationSlug } from '$lib/map/mapAssetRegistry'
  import {
    belongsToLocation,
    packMarkersForZoom,
    projectFutureMarker,
    projectPresenceMarker,
    type MapEvent,
    type MapMarker,
    type MapNextChapterState,
    type MapWorldState,
    calculatePresencePosition,
    resolveTierSlug,
    tierOverviewY,
  } from './markerProjection'
  import type { PerspectiveState, Location } from '@black-whale/domain'
  import { locale } from '$lib/i18n'
  import type { TrackedObjectSnapshot } from '$lib/importantObjects'
  import { groupMarkersForZoom } from './markerGroups'
  import EventDeltaOverlay from './EventDeltaOverlay.svelte'
  import type { ShipEventDelta } from '../../../routes/ship/shipDelta'
  import { tick } from 'svelte'

  type Box = { x: number; y: number; width: number; height: number }

  const groupOffsets = [
    [0, 28],
    [38, 16],
    [-38, 16],
    [48, 0],
    [-48, 0],
    [38, -16],
    [-38, -16],
    [0, -28],
    [64, 24],
    [-64, 24],
    [64, -24],
    [-64, -24],
    [82, 0],
    [-82, 0],
  ] as const
  const objectOffsets = [
    [-32, 0],
    [32, 0],
    [-40, -20],
    [40, -20],
    [-40, 20],
    [40, 20],
    [0, -32],
    [0, 32],
    [-64, 0],
    [64, 0],
  ] as const

  function movedBox(box: Box, x: number, y: number): Box {
    return { ...box, x: box.x + x, y: box.y + y }
  }

  function protectedCenter(box: DOMRect): Box {
    const width = Math.min(36, box.width)
    const height = Math.min(36, box.height)
    return {
      x: box.x + (box.width - width) / 2,
      y: box.y + (box.height - height) / 2,
      width,
      height,
    }
  }

  function overlaps(left: Box, right: Box, padding = 2) {
    return !(
      left.x + left.width + padding <= right.x ||
      right.x + right.width + padding <= left.x ||
      left.y + left.height + padding <= right.y ||
      right.y + right.height + padding <= left.y
    )
  }

  function inside(box: Box, bounds: DOMRect) {
    return (
      box.x >= bounds.x + 2 &&
      box.y >= bounds.y + 2 &&
      box.x + box.width <= bounds.right - 2 &&
      box.y + box.height <= bounds.bottom - 2
    )
  }

  /**
   * `$page.data` is untyped across routes, so the shapes are asserted once here
   * rather than re-asserted at every read. Everything downstream is typed: the
   * projection takes a `MapWorldState` and a `PerspectiveState`.
   */
  let world = $derived.by(() => {
    const state = ($page.data.worldState || {
      characters: [],
      bodies: [],
      consciousnesses: [],
      presences: [],
      occupancies: [],
      appearances: [],
      locations: [],
    }) as MapWorldState
    return { ...state, locations: ($page.data.locations || state.locations || []) as Location[] }
  })
  let perspective = $derived(($page.data.perspective || null) as PerspectiveState | null)
  let events = $derived(($page.data.events || []) as (MapEvent & { sequence?: number })[])
  let currentEvent = $derived(
    events.find((event) => event.id === $page.data.selectedEventId) || null,
  )
  let currentSequence = $derived(currentEvent?.sequence || 0)
  let nextChapterState = $derived(
    ($page.data.nextChapterState || null) as MapNextChapterState | null,
  )
  let futureMode = $derived($activeHatsu?.id === 'parallel-future' && $parallelFutureVisible)
  let importantObjects = $derived(($page.data.importantObjects || []) as TrackedObjectSnapshot[])
  let nextEventDelta = $derived(($page.data.nextEventDelta || []) as ShipEventDelta[])

  let dynamicCharacters = $derived(
    world.presences
      .map((presence) =>
        projectPresenceMarker(presence, {
          world,
          perspective,
          nextChapterState,
          followMode: mapState.followMode,
          perspectiveIsReader: mapState.selectedPerspectiveKind === 'reader',
          currentEvent,
          currentSequence,
          locale: $locale,
        }),
      )
      .filter((marker): marker is MapMarker => marker !== null),
  )

  let futureCharacters = $derived.by(() => {
    if (!futureMode || !nextChapterState) return []
    const next = nextChapterState
    const locationsById = new Map<string, Location>(
      (next.locations.length ? next.locations : world.locations).map((location) => [
        location.id,
        location,
      ]),
    )

    const projected = next.presences
      .map((presence) =>
        projectFutureMarker(presence, next, {
          fallbackLocations: world.locations,
          locale: $locale,
        }),
      )
      .filter((marker): marker is MapMarker => marker !== null)
      .filter((marker) => withinMapScope(marker, locationsById) && matchesLineage(marker))

    return packMarkersForZoom(projected, mapState.currentZoomLevel, $locale)
  })

  /** Tier and room filters, shared by the present and the parallel-future overlay. */
  function withinMapScope(marker: MapMarker, locationsById: Map<string, Location>) {
    if (mapState.currentZoomLevel === 'OVERVIEW') return true
    if (mapState.selectedTier && marker.tierId !== mapState.selectedTier) return false
    if (mapState.currentZoomLevel === 'LOCAL' && mapState.selectedLocationId) {
      const targetSlug = resolveRegionLocationSlug(mapState.selectedLocationId)
      return targetSlug ? belongsToLocation(marker.location, targetSlug, locationsById) : false
    }
    return true
  }

  /**
   * The lineage axis, applied to the present and the parallel future alike: a
   * reader asking where Beyond's children are should not have half of them
   * reappear unfiltered when the next-chapter overlay comes up.
   */
  function matchesLineage(marker: MapMarker) {
    const filter = mapState.filters.beyondLineage
    if (filter === 'all') return true
    if (filter === 'any') return Boolean(marker.beyondLineage)
    return marker.beyondLineage === filter
  }

  let visibleCharacters = $derived.by(() => {
    if (mapState.filters.entityType === 'objects') return []
    const locationsById = new Map<string, Location>(
      world.locations.map((location) => [location.id, location]),
    )
    const visibleBodyIds =
      mapState.selectedPerspectiveKind !== 'reader' && Array.isArray(perspective?.visibleBodies)
        ? new Set<string>(perspective.visibleBodies)
        : null
    const selectedFactions = mapState.filters.factions

    const filtered = dynamicCharacters.filter((marker) => {
      if (visibleBodyIds && !visibleBodyIds.has(marker.id)) return false
      if (!withinMapScope(marker, locationsById)) return false
      if (!matchesLineage(marker)) return false
      return (
        selectedFactions.length === 0 ||
        selectedFactions.some((faction) => marker.factionTags?.includes(faction))
      )
    })

    return packMarkersForZoom(filtered, mapState.currentZoomLevel, $locale)
  })
  let visibleCharacterGroups = $derived(
    groupMarkersForZoom(visibleCharacters, mapState.currentZoomLevel),
  )

  function trackedObjectIsInScope(
    object: TrackedObjectSnapshot,
    tierId: string,
    locationsById: Map<string, Location>,
  ) {
    if (mapState.currentZoomLevel === 'OVERVIEW') return true
    if (mapState.selectedTier !== tierId) return false
    if (mapState.currentZoomLevel !== 'LOCAL') return true
    if (!mapState.selectedLocationId) return true

    const selectedLocation =
      resolveRegionLocationSlug(mapState.selectedLocationId) || mapState.selectedLocationId
    return belongsToLocation(object.location, selectedLocation, locationsById)
  }

  function displayedObjectPosition(
    position: { x: number; y: number; tierId: string },
    object: TrackedObjectSnapshot,
    locationsById: Map<string, Location>,
  ) {
    if (mapState.currentZoomLevel !== 'OVERVIEW') {
      const x = position.x / 10
      const y = position.y / 6
      return { x, y }
    }
    const drawnTier = resolveTierSlug(object.location, locationsById) || position.tierId
    return { x: 50, y: tierOverviewY[drawnTier] ?? 46 }
  }

  function presenceForObject(object: TrackedObjectSnapshot) {
    if (!object.sighting) return null
    if (!object.location) return null
    return {
      id: `object-presence:${object.id}`,
      entityType: 'OBJECT' as const,
      entityId: `object:${object.id}`,
      locationId: object.location.id,
      fromEventId: `chapter:${object.sighting.fromChapter}`,
      precision: object.sighting.precision,
      certainty: object.sighting.certainty,
    }
  }

  let objectPresences = $derived(
    importantObjects.map(presenceForObject).filter((presence) => presence !== null),
  )

  function projectObjectMarker(object: TrackedObjectSnapshot) {
    const presence = presenceForObject(object)
    if (!presence) return null
    const { x, y, tierId } = calculatePresencePosition(
      presence,
      [...world.presences, ...objectPresences],
      world.locations,
    )
    if (!tierId) return null

    const locationsById = new Map(world.locations.map((location) => [location.id, location]))
    if (!trackedObjectIsInScope(object, tierId, locationsById)) return null
    const displayed = displayedObjectPosition({ x, y, tierId }, object, locationsById)

    return {
      object,
      follow: mapState.trackedTargetKind === 'object' && mapState.trackedTargetId === object.id,
      ...displayed,
    }
  }

  let visibleObjects = $derived.by(() => {
    if (mapState.filters.entityType === 'characters') return []
    return importantObjects.map(projectObjectMarker).filter((marker) => marker !== null)
  })

  let presenceLayer: HTMLDivElement | undefined = $state()
  let layerStyle = $state('inset: 0;')

  function placeTierMarkers() {
    if (mapState.currentZoomLevel !== 'TIER' || !presenceLayer) return
    const parent = presenceLayer.parentElement
    const svg = parent?.querySelector(':scope > svg')
    if (!parent || !svg) return

    const obstacles = [...svg.querySelectorAll<SVGGraphicsElement>('[role="button"]')].map(
      (element) => protectedCenter(element.getBoundingClientRect()),
    )
    const markers = [
      ...presenceLayer.querySelectorAll<HTMLElement>(
        '.marker-group.offset-below-label, .object-marker.tier-marker',
      ),
    ]
    for (const marker of markers) {
      marker.style.removeProperty('--marker-nudge-x')
      marker.style.removeProperty('--marker-nudge-y')
    }

    const bounds = presenceLayer.getBoundingClientRect()
    const placed: Box[] = []
    for (const marker of markers) {
      const base = marker.getBoundingClientRect()
      const offsets = marker.classList.contains('object-marker') ? objectOffsets : groupOffsets
      const chosen =
        offsets.find(([x, y]) => {
          const candidate = movedBox(base, x, y)
          return (
            inside(candidate, bounds) &&
            !obstacles.some((obstacle) => overlaps(candidate, obstacle)) &&
            !placed.some((other) => overlaps(candidate, other))
          )
        }) ?? offsets[offsets.length - 1]
      marker.style.setProperty('--marker-nudge-x', `${chosen[0]}px`)
      marker.style.setProperty('--marker-nudge-y', `${chosen[1]}px`)
      placed.push(movedBox(base, chosen[0], chosen[1]))
    }
  }

  function scheduleTierMarkerLayout() {
    requestAnimationFrame(placeTierMarkers)
  }

  $effect(() => {
    // Bare reads: this is how a rune effect registers its dependencies.
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    ;(mapState.currentZoomLevel, mapState.selectedTier, mapState.selectedLocationId)

    const layer = presenceLayer
    const parent = layer?.parentElement
    if (!layer || !parent) return

    const alignWithSvg = () => {
      const svg = parent.querySelector(':scope > svg') as SVGSVGElement | null
      if (!svg?.viewBox?.baseVal?.width || !svg.viewBox.baseVal.height) {
        layerStyle = 'inset: 0; --map-scale: 1;'
        return
      }

      const width = parent.clientWidth
      const height = parent.clientHeight
      const viewBox = svg.viewBox.baseVal
      const scale = Math.min(width / viewBox.width, height / viewBox.height)
      const renderedWidth = viewBox.width * scale
      const renderedHeight = viewBox.height * scale
      const left = (width - renderedWidth) / 2
      const top = (height - renderedHeight) / 2
      // A marker's position is a percentage of this layer, so it follows the
      // drawing down to a phone on its own. Its *size* is not: at 950 px a dot
      // sits inside the room it marks, and at 359 px the same dot is three
      // rooms wide, so the overview's 184 of them close over the hull and the
      // ship is gone. Hand the scale down and let the markers read it.
      layerStyle = `left:${left}px;top:${top}px;width:${renderedWidth}px;height:${renderedHeight}px;--map-scale:${scale.toFixed(3)};`
      scheduleTierMarkerLayout()
    }

    alignWithSvg()
    const observer = new ResizeObserver(alignWithSvg)
    observer.observe(parent)
    return () => observer.disconnect()
  })

  $effect(() => {
    const layoutKey = `${visibleCharacterGroups.length}:${visibleObjects.length}:${mapState.currentZoomLevel}:${layerStyle}`
    void layoutKey
    void tick().then(placeTierMarkers)
  })
</script>

<div
  bind:this={presenceLayer}
  class="presence-layer absolute pointer-events-none"
  style={layerStyle}
  aria-label={`${visibleCharacters.length} visible characters, ${visibleObjects.length} visible objects`}
>
  {#if mapState.showEventChanges || mapState.playingTimeline}
    <EventDeltaOverlay delta={nextEventDelta} {world} />
  {/if}
  {#each futureCharacters as char (char.id)}
    <CharacterMarker character={char} future={true} />
  {/each}
  <div class:tier-group-rail={mapState.currentZoomLevel === 'TIER'}>
    {#each visibleCharacterGroups as group (group.id)}
      <CharacterMarkerGroup
        {group}
        compact={mapState.currentZoomLevel === 'OVERVIEW'}
        offsetBelowLabel={mapState.currentZoomLevel === 'TIER'}
      />
    {/each}
  </div>
  {#each visibleObjects as marker (marker.object.id)}
    <ObjectMarker {...marker} />
  {/each}
</div>

<style>
  .presence-layer {
    z-index: 5;
  }
  .tier-group-rail {
    display: contents;
  }
  @media (max-width: 600px) {
    .tier-group-rail {
      position: absolute;
      z-index: 20;
      right: 0.35rem;
      bottom: 0.35rem;
      left: 0.35rem;
      display: flex;
      gap: 0.35rem;
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0.35rem;
      background: color-mix(in srgb, var(--surface-panel) 88%, transparent);
      pointer-events: auto;
      scrollbar-width: none;
    }
    .tier-group-rail::-webkit-scrollbar {
      display: none;
    }
    .tier-group-rail :global(.marker-group.offset-below-label) {
      position: relative;
      top: auto !important;
      left: auto !important;
      flex: 0 0 auto;
      transform: none !important;
    }
  }
</style>
