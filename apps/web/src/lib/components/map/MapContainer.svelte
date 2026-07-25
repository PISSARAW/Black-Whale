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

  $effect(() => {
    if (containerEl) {
      pz = panzoom(containerEl, {
        maxZoom: 5,
        minZoom: 0.5,
        bounds: true,
        boundsPadding: 0.1
      });

      return () => {
        pz.dispose();
      };
    }
  });

  // Re-center or adjust zoom when level changes
  $effect(() => {
    if (pz && mapState.currentZoomLevel) {
      pz.moveTo(0, 0);
      pz.zoomAbs(0, 0, 1);
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
</script>

<div class="relative w-full h-full overflow-hidden bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
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
        <div class="flex items-center justify-center w-full h-full text-[#FFFFF0]">
          <h2>Carte détaillée pour {mapState.selectedLocationId} non disponible en V1</h2>
        </div>
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
        <h2>Map pour {mapState.selectedTier} introuvable</h2>
      </div>
    {/if}

    {#if isLocalZoom}
      <button 
        class="absolute top-4 left-4 px-3 py-1 bg-[#1a202c] text-[#e2e8f0] border border-[#4a5568] rounded shadow hover:bg-[#2d3748] z-10 font-bold pointer-events-auto"
        onclick={() => mapState.selectLocation(null)}
      >
        ← Retour au Tier
      </button>
    {/if}

    <!-- Dynamic Overlay for characters -->
    <MapOverlay />
    
  </div>
</div>
