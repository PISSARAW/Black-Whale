<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'
  import CharacterMarker from './CharacterMarker.svelte'
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

  /**
   * `$page.data` is untyped across routes, so the shapes are asserted once here
   * rather than re-asserted at every read. Everything downstream is typed: the
   * projection takes a `MapWorldState` and a `PerspectiveState`.
   */
  let world = $derived(
    ($page.data.worldState || {
      characters: [],
      bodies: [],
      consciousnesses: [],
      presences: [],
      occupancies: [],
      appearances: [],
      locations: [],
    }) as MapWorldState,
  )
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
      return { x: position.x / 10, y: position.y / 6 }
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
    }

    alignWithSvg()
    const observer = new ResizeObserver(alignWithSvg)
    observer.observe(parent)
    return () => observer.disconnect()
  })
</script>

<div
  bind:this={presenceLayer}
  class="presence-layer absolute pointer-events-none"
  style={layerStyle}
  aria-label={`${visibleCharacters.length} visible characters, ${visibleObjects.length} visible objects`}
>
  {#each futureCharacters as char (char.id)}
    <CharacterMarker character={char} future={true} />
  {/each}
  {#each visibleCharacters as char (char.id)}
    <CharacterMarker character={char} {futureMode} />
  {/each}
  {#each visibleObjects as marker (marker.object.id)}
    <ObjectMarker {...marker} />
  {/each}
</div>

<style>
  .presence-layer {
    z-index: 5;
  }
</style>
