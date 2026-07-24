<script lang="ts">
  import panzoom from 'panzoom';
  import { mapState } from '$lib/state/mapState.svelte';
  import BlackWhaleOverview from '$lib/assets/maps/black-whale-overview.svelte';
  import Tier1 from '$lib/assets/maps/tier-1.svelte';
  import Tier2 from '$lib/assets/maps/tier-2.svelte';
  import Tier3 from '$lib/assets/maps/tier-3.svelte';
  import Tier4 from '$lib/assets/maps/tier-4.svelte';
  import Tier5 from '$lib/assets/maps/tier-5.svelte';
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
</script>

<div class="relative w-full h-full overflow-hidden bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
  <!-- Panzoom target -->
  <div bind:this={containerEl} class="relative w-full h-full transform-origin-top-left">
    
    <!-- SVG Map Render -->
    {#if mapState.currentZoomLevel === 'OVERVIEW'}
      <BlackWhaleOverview />
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

    <!-- Dynamic Overlay for characters -->
    <MapOverlay />
    
  </div>
</div>
