<script lang="ts">
  import BlackWhaleOverview from '$lib/assets/maps/black-whale-overview.svelte';
  import Tier1 from '$lib/assets/maps/tier-1.svelte';
  import Tier2 from '$lib/assets/maps/tier-2.svelte';
  import Tier3 from '$lib/assets/maps/tier-3.svelte';
  import Tier4 from '$lib/assets/maps/tier-4.svelte';
  import Tier5 from '$lib/assets/maps/tier-5.svelte';

  interface CompareMarker {
    id: string;
    subjectId: string;
    label: string;
    tier: string | null;
    x: number;
    y: number;
    certainty: string;
    selected?: boolean;
  }

  let {
    title,
    tier,
    zoom,
    focusX = 500,
    focusY = 300,
    markers,
    onSelect
  }: {
    title: string;
    tier: string;
    zoom: number;
    focusX?: number;
    focusY?: number;
    markers: CompareMarker[];
    onSelect?: (subjectId: string) => void;
  } = $props();

  let markerLayer = $derived(markers.filter((marker) => marker.tier === tier));
  let transform = $derived(`translate(calc(50% - ${focusX * zoom}px), calc(50% - ${focusY * zoom}px)) scale(${zoom})`);
</script>

<section class="pane" aria-label={title}>
  <header>{title}</header>
  <div class="viewport">
    <div class="scene" style:transform={transform}>
      <div class="map-root">
        {#if tier === 'tier-1'}
          <Tier1 />
        {:else if tier === 'tier-2'}
          <Tier2 />
        {:else if tier === 'tier-3'}
          <Tier3 />
        {:else if tier === 'tier-4'}
          <Tier4 />
        {:else if tier === 'tier-5'}
          <Tier5 />
        {:else}
          <BlackWhaleOverview />
        {/if}
      </div>

      <div class="overlay">
        {#each markerLayer as marker (marker.id)}
          <button
            type="button"
            class="dot"
            class:selected={marker.selected}
            style={`left:${marker.x}px;top:${marker.y}px`}
            onclick={() => onSelect?.(marker.subjectId)}
            aria-label={`${marker.label} (${marker.certainty})`}
          >
            <span>{marker.label}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .pane {
    border: 1px solid var(--line);
    border-radius: 0.72rem;
    overflow: hidden;
    background: color-mix(in srgb, var(--panel) 88%, #0e1622 12%);
  }

  header {
    padding: 0.5rem 0.72rem;
    border-bottom: 1px solid var(--line);
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--ink) 74%, #8ba7a1 26%);
  }

  .viewport {
    position: relative;
    height: 22rem;
    overflow: hidden;
    background: #05090f;
  }

  .scene {
    position: absolute;
    left: 0;
    top: 0;
    width: 1000px;
    height: 600px;
    transform-origin: 0 0;
    transition: transform 220ms ease;
  }

  .map-root {
    width: 1000px;
    height: 600px;
  }

  .overlay {
    position: absolute;
    inset: 0;
  }

  .dot {
    position: absolute;
    transform: translate(-50%, -50%);
    border: 1px solid color-mix(in srgb, var(--line) 60%, #f8f4e3 30%);
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel) 62%, #173236 38%);
    color: var(--ink);
    padding: 0.18rem 0.45rem;
    font-size: 0.64rem;
    max-width: 8.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dot.selected {
    border-color: var(--state-transferred);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--state-transferred) 45%, transparent);
  }

  .dot span {
    pointer-events: none;
  }

  @media (max-width: 800px) {
    .viewport {
      height: 16rem;
    }
  }
</style>
