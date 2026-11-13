<script lang="ts">
  import { page } from '$app/state'
  import { pushState, replaceState } from '$app/navigation'
  import { tick, untrack } from 'svelte'
  import type { PageData } from './$types'
  import { createShipController } from './shipController.svelte'
  import MapContainer from '$lib/components/map/MapContainer.svelte'
  import LocationDetails from '$lib/components/map/LocationDetails.svelte'
  import UnknownPositions from '$lib/components/map/UnknownPositions.svelte'
  import ShipNavigation from '$lib/components/ship/ShipNavigation.svelte'
  import ShipFilters from '$lib/components/ship/ShipFilters.svelte'
  import ShipTracking from '$lib/components/ship/ShipTracking.svelte'
  import ShipGuide from '$lib/components/ship/ShipGuide.svelte'
  import ShipTimeline from '$lib/components/ship/ShipTimeline.svelte'
  import WhyPanel from '$lib/components/perspective/WhyPanel.svelte'
  import CharacterDetails from '$lib/components/map/CharacterDetails.svelte'
  import ConsciousnessTransferTransition from '$lib/components/perspective/ConsciousnessTransferTransition.svelte'
  import Seo from '$lib/components/Seo.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { mapState } from '$lib/state/mapState.svelte'
  import { link, locale, t } from '$lib/i18n'
  import { PUBLIC_FEATURES } from '$lib/config/features'
  import { resolveRegionLocationSlug } from '$lib/map/mapAssetRegistry'
  import './ship.css'
  import { readShipUrlState, writeShipUrlState } from './shipUrlState'

  let { data }: { data: PageData } = $props()
  const ship = createShipController({
    data: () => data,
    copy: () => $t,
    locale: () => $locale,
    url: () => page.url,
  })
  type Panel = 'filters' | 'tracking' | 'guide'
  let panel: Panel | null = $state(null)
  let expanded = $state(false)
  let panelHeading: HTMLHeadingElement | undefined = $state()
  let panelTrigger: HTMLButtonElement | undefined
  let expandButton: HTMLButtonElement | undefined = $state()
  let urlStateReady = $state(false)
  let lastSpatialKey = $state('')
  let filterCount = $derived(
    Number(mapState.filters.entityType !== 'all') +
      mapState.filters.factions.length +
      Number(mapState.filters.beyondLineage !== 'all'),
  )
  let panelTitle = $derived(panel ? $t.ship.workspace[panel] : '')
  let profiles = $derived($t.ship.tiers as Record<string, { title: string }>)
  let locationName = $derived(
    (data.locations || data.worldState.locations || []).find(
      (location) => location.slug === resolveRegionLocationSlug(mapState.selectedLocationId),
    )?.name || ship.currentDeckLabel,
  )
  let mapTitle = $derived(
    mapState.currentZoomLevel === 'LOCAL'
      ? locationName
      : profiles[mapState.selectedTier || 'overview'].title,
  )
  let trackingLabel = $derived(
    ship.trackedObject?.canonicalName || ship.contextState.perspectiveName,
  )

  async function togglePanel(next: Panel, event: MouseEvent) {
    if (panel === next) {
      closePanel()
      return
    }
    panelTrigger = event.currentTarget as HTMLButtonElement
    panel = next
    await tick()
    panelHeading?.focus()
  }

  function closePanel() {
    panel = null
    panelTrigger?.focus()
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    if (panel) closePanel()
    else if (mapState.explainPanelOpen) mapState.closeExplainPanel()
    else if (mapState.filters.showUnknownPositions) mapState.filters.showUnknownPositions = false
    else if (mapState.selectedLocationId) mapState.selectLocation(null)
    else if (expanded) {
      expanded = false
      expandButton?.focus()
    }
  }

  $effect(() => {
    if (!expanded) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  })

  $effect(() => {
    const url = page.url
    const locations = (data.locations || data.worldState.locations || []) as { slug: string }[]
    const parsed = readShipUrlState(url, locations)
    mapState.selectedTier = parsed.tier
    mapState.selectedLocationId = parsed.location
    mapState.currentZoomLevel = parsed.location ? 'LOCAL' : parsed.tier ? 'TIER' : 'OVERVIEW'
    mapState.showEntities = parsed.showEntities
    mapState.filters.entityType = parsed.entityType
    mapState.filters.factions = parsed.factions
    mapState.filters.beyondLineage = parsed.beyondLineage
    mapState.filters.showUnknownPositions = parsed.showUnknownPositions
    lastSpatialKey = `${parsed.tier || ''}|${parsed.location || ''}`
    urlStateReady = true
  })

  $effect(() => {
    if (!urlStateReady) return
    const state = {
      tier: mapState.selectedTier,
      location: mapState.selectedLocationId,
      showEntities: mapState.showEntities,
      entityType: mapState.filters.entityType,
      factions: [...mapState.filters.factions],
      beyondLineage: mapState.filters.beyondLineage,
      showUnknownPositions: mapState.filters.showUnknownPositions,
    }
    const current = untrack(() => page.url)
    const next = writeShipUrlState(current, state)
    const spatialKey = `${state.tier || ''}|${state.location || ''}`
    if (next.toString() !== current.toString()) {
      if (spatialKey !== lastSpatialKey) pushState(next, {})
      else replaceState(next, {})
    }
    lastSpatialKey = spatialKey
  })
</script>

<svelte:window onkeydown={handleEscape} />

<Seo
  title={$t.ship.seoTitle}
  description={$t.ship.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.ship.breadcrumb, path: $link('/ship') },
  ])}
/>

<div class="ship-page">
  <header class="ship-heading">
    <div>
      <h1>Black Whale <em>01</em></h1>
      <p>{$t.ship.workspace.intro}</p>
    </div>
    <span class="ship-heading-caption">{$t.ship.breadcrumb}</span>
  </header>
  {#if PUBLIC_FEATURES.perspectives && ship.contextState.hasAnomaly}
    <ConsciousnessTransferTransition
      visible={true}
      fromBody={ship.contextState.perspectiveName}
      toBody={ship.contextState.occupiedBody}
      consciousness={ship.contextState.followedConsciousness}
    />
  {/if}

  <section
    class="ship-workspace"
    class:expanded
    class:panel-open={panel !== null}
    aria-label={$t.ship.mapRegion}
  >
    <ShipNavigation />
    <div class="ship-toolbar">
      <nav class="ship-breadcrumb" aria-label={$t.ship.activeZone}>
        {#if mapState.selectedTier}
          <button onclick={() => mapState.selectTier(null)} aria-label={$t.ship.overview}>BW</button
          ><span aria-hidden="true">/</span>
        {/if}
        {#if mapState.currentZoomLevel === 'LOCAL'}
          <button onclick={() => mapState.selectLocation(null)}
            >{profiles[mapState.selectedTier || 'overview'].title}</button
          ><span aria-hidden="true">/</span>
        {/if}
        <strong title={mapTitle}>{mapTitle}</strong>
      </nav>
      <div class="ship-actions">
        <button
          class:active={mapState.showEntities}
          aria-pressed={mapState.showEntities}
          onclick={() => (mapState.showEntities = !mapState.showEntities)}
          >{$t.ship.workspace.presences}</button
        >
        <button
          class:active={panel === 'filters'}
          aria-expanded={panel === 'filters'}
          aria-controls="ship-panel"
          onclick={(event) => togglePanel('filters', event)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true"
            ><path d="M3 5h14M3 10h14M3 15h14M7 3v4m6 1v4m-6 1v4" /></svg
          >
          {$t.ship.workspace.filters}{#if filterCount}<span class="ship-count">{filterCount}</span
            >{/if}
        </button>
        <button
          class:active={panel === 'tracking'}
          class:tracking-active={mapState.trackedTargetKind !== 'reader'}
          aria-expanded={panel === 'tracking'}
          aria-controls="ship-panel"
          title={trackingLabel}
          onclick={(event) => togglePanel('tracking', event)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true"
            ><circle cx="10" cy="10" r="6" /><circle cx="10" cy="10" r="2" /><path
              d="M10 1v3m0 12v3M1 10h3m12 0h3"
            /></svg
          >
          {$t.ship.workspace.tracking}
        </button>
        <button
          class:active={panel === 'guide'}
          aria-expanded={panel === 'guide'}
          aria-controls="ship-panel"
          onclick={(event) => togglePanel('guide', event)}>{$t.ship.workspace.guide}</button
        >
        <button
          bind:this={expandButton}
          class="ship-expand"
          aria-label={expanded ? $t.ship.workspace.exitFocus : $t.ship.workspace.focus}
          title={expanded ? $t.ship.workspace.exitFocus : $t.ship.workspace.focus}
          aria-pressed={expanded}
          onclick={() => (expanded = !expanded)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true"
            ><path
              d={expanded
                ? 'M7 2v5H2m16 0h-5V2M2 13h5v5m6 0v-5h5'
                : 'M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4'}
            /></svg
          >
        </button>
      </div>
    </div>
    <div class="ship-map-body">
      <div class="ship-canvas">
        <MapContainer />
        {#if mapState.explainPanelOpen && mapState.explainTarget?.kind === 'character'}
          <CharacterDetails
            target={mapState.explainTarget}
            onClose={() => mapState.closeExplainPanel()}
          />
        {:else if mapState.explainPanelOpen && mapState.explainTarget?.kind === 'object'}
          <WhyPanel
            open={true}
            subject={mapState.explainTarget.subject}
            displayedValue={mapState.explainTarget.value}
            source={mapState.explainTarget.source}
            observedAt={mapState.explainTarget.observedAt}
            freshness={mapState.explainTarget.freshness}
            state={mapState.explainTarget.knowledgeState}
            revealReality={mapState.compareWithReader}
            canonicalValue={mapState.explainTarget.canonicalValue ?? null}
            onClose={() => mapState.closeExplainPanel()}
          />
        {/if}
        <LocationDetails />
        <UnknownPositions />
      </div>
      {#if panel}
        <aside class="ship-panel" id="ship-panel" aria-labelledby="ship-panel-title">
          <header>
            <h2 bind:this={panelHeading} id="ship-panel-title" tabindex="-1">{panelTitle}</h2>
            <button aria-label={$t.ship.workspace.close} onclick={closePanel}>×</button>
          </header>
          <div class="ship-panel-content">
            {#if panel === 'filters'}
              <ShipFilters characters={data.worldState.characters} />
            {:else if panel === 'tracking'}
              <ShipTracking {ship} />
            {:else}
              <ShipGuide {data} />
            {/if}
          </div>
        </aside>
      {/if}
    </div>
    <ShipTimeline {data} {ship} />
  </section>
</div>
