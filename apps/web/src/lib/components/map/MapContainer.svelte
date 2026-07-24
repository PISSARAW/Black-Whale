<script lang="ts">
  import panzoom from 'panzoom';
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
