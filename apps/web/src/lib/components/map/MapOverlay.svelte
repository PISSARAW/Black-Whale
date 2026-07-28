<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'
  import CharacterMarker from './CharacterMarker.svelte'
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
  } from './markerProjection'
  import type { PerspectiveState, Location } from '@black-whale/domain'

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
      .map((presence) => projectFutureMarker(presence, next, world.locations))
      .filter((marker): marker is MapMarker => marker !== null)
      .filter((marker) => withinMapScope(marker, locationsById))

    return packMarkersForZoom(projected, mapState.currentZoomLevel)
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

  let visibleCharacters = $derived.by(() => {
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
      return (
        selectedFactions.length === 0 ||
        selectedFactions.some((faction) => marker.factionTags?.includes(faction))
      )
    })

    return packMarkersForZoom(filtered, mapState.currentZoomLevel)
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
        layerStyle = 'inset: 0;'
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
      layerStyle = `left:${left}px;top:${top}px;width:${renderedWidth}px;height:${renderedHeight}px;`
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
  aria-label={`${visibleCharacters.length} visible characters`}
>
  {#each futureCharacters as char (char.id)}
    <CharacterMarker character={char} future={true} />
  {/each}
  {#each visibleCharacters as char (char.id)}
    <CharacterMarker character={char} {futureMode} />
  {/each}
</div>

<style>
  .presence-layer {
    z-index: 5;
  }
</style>
