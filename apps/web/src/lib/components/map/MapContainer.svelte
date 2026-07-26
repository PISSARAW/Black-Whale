<script lang="ts">
  import panzoom from 'panzoom';
  import { tick } from 'svelte';
  import { mapState } from '$lib/state/mapState.svelte';
  import BlackWhaleOverview from '$lib/assets/maps/black-whale-overview.svelte';
  import Tier1 from '$lib/assets/maps/tier-1.svelte';
  import Tier2 from '$lib/assets/maps/tier-2.svelte';
  import Tier3 from '$lib/assets/maps/tier-3.svelte';
  import Tier4 from '$lib/assets/maps/tier-4.svelte';
  import Tier5 from '$lib/assets/maps/tier-5.svelte';
  import PrinceApartment from '$lib/assets/maps/local/prince-apartment.svelte';
  import Room3101 from '$lib/assets/maps/local/room-3101.svelte';
  import HeillyProcessing from '$lib/assets/maps/local/heilly-processing.svelte';
  import CentralCourthouse from '$lib/assets/maps/local/central-courthouse.svelte';
  import CentralPoliceStation from '$lib/assets/maps/local/central-police-station.svelte';
  import GeneralCabins from '$lib/assets/maps/local/general-cabins.svelte';
  import RoyalArmyOffice from '$lib/assets/maps/local/royal-army-office.svelte';
  import ObservationDeck from '$lib/assets/maps/local/observation-deck.svelte';
  import Cineplex from '$lib/assets/maps/local/cineplex.svelte';
  import CentralDiningHall from '$lib/assets/maps/local/central-dining-hall.svelte';
  import PrincesBurialChamber from '$lib/assets/maps/local/princes-burial-chamber.svelte';
  import VvipLivingQuarters from '$lib/assets/maps/local/vvip-living-quarters.svelte';
  import QueensLivingQuarters from '$lib/assets/maps/local/queens-living-quarters.svelte';
  import SoldiersLivingQuarters from '$lib/assets/maps/local/soldiers-living-quarters.svelte';
  import Casino from '$lib/assets/maps/local/casino.svelte';
  import Room37564 from '$lib/assets/maps/local/room-37564.svelte';
  import MapOverlay from './MapOverlay.svelte';

  let containerEl: HTMLElement | undefined = $state();
  let pz: any;
  let zoomPercent = $state(100);

  function syncZoom() {
    if (!pz) return;
    zoomPercent = Math.round(pz.getTransform().scale * 100);
  }

  function zoomBy(factor: number) {
    if (!pz || !containerEl) return;
    pz.smoothZoom(containerEl.clientWidth / 2, containerEl.clientHeight / 2, factor);
    window.setTimeout(syncZoom, 180);
  }

  function resetView() {
    if (!pz) return;
    pz.moveTo(0, 0);
    pz.zoomAbs(0, 0, 1);
    zoomPercent = 100;
  }

  function handleMapKeydown(event: KeyboardEvent) {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomBy(1.25);
    } else if (event.key === '-') {
      event.preventDefault();
      zoomBy(0.8);
    } else if (event.key === '0') {
      event.preventDefault();
      resetView();
    }
  }

  $effect(() => {
    if (containerEl) {
      pz = panzoom(containerEl, {
        maxZoom: 5,
        minZoom: 0.5,
        bounds: true,
        boundsPadding: 0.1
      });
      pz.on('zoom', syncZoom);
      pz.on('transform', syncZoom);

      return () => {
        pz.dispose();
      };
    }
  });

  // Re-center or adjust zoom when level changes
  $effect(() => {
    if (pz && mapState.currentZoomLevel) {
      resetView();
    }
  });

  // Follow the selected observer after the perspective overlay has rendered.
  // The physical target stays the same across modes; the marker label switches
  // between consciousness, body and public appearance.
  $effect(() => {
    const perspectiveId = mapState.selectedPerspectiveId;
    const perspectiveKind = mapState.selectedPerspectiveKind;
    const followMode = mapState.followMode;
    const zoomLevel = mapState.currentZoomLevel;

    if (!pz || !containerEl) return;

    if (perspectiveKind === 'reader') {
      pz.moveTo(0, 0);
      pz.zoomAbs(0, 0, 1);
      return;
    }

    void tick().then(() => {
      if (!containerEl || mapState.selectedPerspectiveId !== perspectiveId || mapState.followMode !== followMode) return;
      const marker = containerEl.querySelector<HTMLElement>('[data-follow-target="true"]');
      if (!marker) return;

      const transform = pz.getTransform();
      const scale = Math.max(transform.scale, zoomLevel === 'OVERVIEW' ? 1.2 : 1);
      pz.zoomAbs(0, 0, scale);
      pz.moveTo(
        containerEl.clientWidth / 2 - marker.offsetLeft * scale,
        containerEl.clientHeight / 2 - marker.offsetTop * scale
      );
    });
  });

  let isLocalZoom = $derived(mapState.currentZoomLevel === 'LOCAL' && mapState.selectedLocationId);
  let isPrinceRoom = $derived(mapState.selectedLocationId?.startsWith('room-10'));
  const detailedLocationIds = new Set([
    'room-3101', 't3-heilly', 'heilly-processing', 'central-courthouse',
    'central-police-station', 'general-cabins', 'royal-army-office',
    'observation-deck', 'cineplex', 'central-dining-hall',
    'princes-burial-chamber', 'vvip-living-quarters', 'queens-living-quarters',
    'soldiers-living-quarters', 'casino', 'room-37564'
  ]);
  let hasDetailedMap = $derived(Boolean(isPrinceRoom || (mapState.selectedLocationId && detailedLocationIds.has(mapState.selectedLocationId))));
  let selectedLocationLabel = $derived((mapState.selectedLocationId || 'Unmapped area').replaceAll('-', ' '));
</script>

<div class="map-frame" role="region" aria-label="Interactive deck map">
  <!-- Panzoom target -->
  <div bind:this={containerEl} class="relative w-full h-full transform-origin-top-left">
    
    <!-- SVG Map Render -->
    {#if mapState.currentZoomLevel === 'OVERVIEW'}
      <BlackWhaleOverview />
    {:else if isLocalZoom}
      {#if isPrinceRoom}
        <PrinceApartment />
      {:else if mapState.selectedLocationId === 'room-3101'}
        <Room3101 />
      {:else if mapState.selectedLocationId === 't3-heilly' || mapState.selectedLocationId === 'heilly-processing'}
        <HeillyProcessing />
      {:else if mapState.selectedLocationId === 'central-courthouse'}
        <CentralCourthouse />
      {:else if mapState.selectedLocationId === 'central-police-station'}
        <CentralPoliceStation />
      {:else if mapState.selectedLocationId === 'general-cabins'}
        <GeneralCabins />
      {:else if mapState.selectedLocationId === 'royal-army-office'}
        <RoyalArmyOffice />
      {:else if mapState.selectedLocationId === 'observation-deck'}
        <ObservationDeck />
      {:else if mapState.selectedLocationId === 'cineplex'}
        <Cineplex />
      {:else if mapState.selectedLocationId === 'central-dining-hall'}
        <CentralDiningHall />
      {:else if mapState.selectedLocationId === 'princes-burial-chamber'}
        <PrincesBurialChamber />
      {:else if mapState.selectedLocationId === 'vvip-living-quarters'}
        <VvipLivingQuarters />
      {:else if mapState.selectedLocationId === 'queens-living-quarters'}
        <QueensLivingQuarters />
      {:else if mapState.selectedLocationId === 'soldiers-living-quarters'}
        <SoldiersLivingQuarters />
      {:else if mapState.selectedLocationId === 'casino'}
        <Casino />
      {:else if mapState.selectedLocationId === 'room-37564'}
        <Room37564 />
      {:else}
        <section class="cartographic-gap" aria-live="polite">
          <div class="gap-mark" aria-hidden="true"><span></span><i></i></div>
          <p>Cartographic gap · local scan unavailable</p>
          <h2 class="capitalize">{selectedLocationLabel}</h2>
          <span>This zone is indexed in the archive, but no verified local floor plan has been recovered.</span>
          <button type="button" onclick={() => mapState.selectLocation(null)}>Return to tier map</button>
        </section>
      {/if}
    {:else if mapState.selectedTier === 'tier-1'}
      <Tier1 />
    {:else if mapState.selectedTier === 'tier-2'}
      <Tier2 />
    {:else if mapState.selectedTier === 'tier-3'}
      <Tier3 />
    {:else if mapState.selectedTier === 'tier-4'}
      <Tier4 />
    {:else if mapState.selectedTier === 'tier-5'}
      <Tier5 />
    {:else}
      <!-- Fallback for other tiers -->
      <div class="flex items-center justify-center w-full h-full text-[#FFFFF0]">
        <h2>Map for {mapState.selectedTier} not found</h2>
      </div>
    {/if}

    {#if isLocalZoom && hasDetailedMap}
      <button 
        class="absolute top-4 left-4 px-3 py-1 bg-[#1a202c] text-[#e2e8f0] border border-[#4a5568] rounded shadow hover:bg-[#2d3748] z-10 font-bold pointer-events-auto"
        onclick={() => mapState.selectLocation(null)}
      >
        ← Back to tier
      </button>
    {/if}

    <!-- Dynamic Overlay for characters -->
    <MapOverlay />
  </div>

  <div class="zoom-controls" data-hatsu-pass aria-label="Map zoom controls">
    <button type="button" onclick={() => zoomBy(1.25)} onkeydown={handleMapKeydown} aria-label="Zoom in">+</button>
    <span aria-live="polite">{zoomPercent}%</span>
    <button type="button" onclick={() => zoomBy(0.8)} onkeydown={handleMapKeydown} aria-label="Zoom out">−</button>
    <button class="reset" type="button" onclick={resetView} onkeydown={handleMapKeydown} aria-label="Reset map view">⌖</button>
  </div>

  <div class="keyboard-hint" aria-hidden="true"><kbd>+</kbd><kbd>−</kbd> zoom <kbd>0</kbd> reset</div>
</div>

<style>
  .map-frame { position: relative; width: 100%; height: 100%; overflow: hidden; border: 1px solid rgba(83,105,113,.28); border-radius: .65rem; background: #080c10; }
  .zoom-controls { position: absolute; z-index: 20; top: 1rem; right: 1rem; display: grid; grid-template-columns: 2rem 3.4rem 2rem 2rem; align-items: center; overflow: hidden; border: 1px solid rgba(101,126,133,.35); border-radius: .45rem; background: rgba(8,14,18,.9); box-shadow: 0 8px 24px rgba(0,0,0,.25); backdrop-filter: blur(10px); }
  .zoom-controls button { display: grid; height: 2rem; place-items: center; border: 0; border-right: 1px solid rgba(101,126,133,.2); background: transparent; color: var(--text-secondary); cursor: pointer; }
  .zoom-controls button:hover { background: rgba(200,169,86,.1); color: var(--accent-gold-bright); }
  .zoom-controls span { color: var(--text-muted); font: .5rem/1 var(--font-mono); text-align: center; }
  .zoom-controls .reset { border-right: 0; border-left: 1px solid rgba(101,126,133,.2); color: var(--accent-gold); }
  .keyboard-hint { position: absolute; z-index: 15; right: 1rem; bottom: 1rem; color: var(--text-faint); font: .48rem/1 var(--font-mono); letter-spacing: .04em; text-transform: uppercase; }
  .keyboard-hint kbd { display: inline-grid; min-width: 1rem; height: 1rem; margin: 0 .15rem; place-items: center; border: 1px solid rgba(101,126,133,.3); border-radius: .2rem; background: rgba(8,14,18,.75); color: var(--text-secondary); }
  .cartographic-gap { position: absolute; inset: 0; display: grid; max-width: 32rem; height: fit-content; margin: auto; justify-items: center; padding: 2rem; color: var(--text-secondary); text-align: center; }
  .cartographic-gap .gap-mark { position: relative; width: 5rem; height: 5rem; margin-bottom: 1.4rem; border: 1px dashed rgba(200,169,86,.35); border-radius: 50%; }
  .gap-mark::before,.gap-mark::after { position: absolute; inset: 50% 12%; height: 1px; background: rgba(200,169,86,.24); content: ''; }.gap-mark::after { transform: rotate(90deg); }.gap-mark span { position: absolute; inset: 30%; border: 1px solid var(--accent-gold); border-radius: 50%; }.gap-mark i { position: absolute; top: 50%; left: 50%; width: .35rem; height: .35rem; border-radius: 50%; background: var(--accent-gold-bright); box-shadow: 0 0 12px var(--accent-gold-glow); transform: translate(-50%,-50%); }
  .cartographic-gap p { margin: 0 0 .6rem; color: var(--accent-gold); font: .52rem/1 var(--font-mono); letter-spacing: .12em; text-transform: uppercase; }.cartographic-gap h2 { margin: 0; color: var(--text-primary); font-size: 2rem; }.cartographic-gap > span { max-width: 27rem; margin-top: .7rem; color: var(--text-muted); font-size: .72rem; line-height: 1.6; }.cartographic-gap button { margin-top: 1.4rem; padding: .6rem .8rem; border: 1px solid var(--line-strong); border-radius: .35rem; background: rgba(200,169,86,.08); color: var(--accent-gold-bright); font-size: .65rem; cursor: pointer; }
  @media(max-width:720px){.keyboard-hint{display:none}.zoom-controls{top:.65rem;right:.65rem}}
</style>
