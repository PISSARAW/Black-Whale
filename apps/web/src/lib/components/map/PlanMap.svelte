<script lang="ts">
  import BlackWhaleOverview from '$lib/assets/maps/black-whale-overview.svelte'

  /** An entity on the plan, as a loader's map projection hands it over. */
  interface Marker {
    id: string
    label: string
    x: number
    y: number
    tier: string | null
    state: 'confirmed' | 'believed' | 'outdated'
    /** Drawn in gold: the followed observer, or the entity an effect reaches. */
    isObserver: boolean
    locationLabel: string | null
  }

  /**
   * The deck plan with entities placed on it, at the positions the shared map
   * projection computes — the same geometry `/ship` draws. Pages that need to
   * show *where* something is use this rather than counting it: a subjective
   * view, a simulated branch.
   */
  let {
    markers,
    tier,
    emptyLabel,
    elsewhereLabel,
  }: {
    markers: Marker[]
    tier: string | null
    emptyLabel: string
    /** Worded by the caller, because only it knows what the markers are. */
    elsewhereLabel: (count: number) => string
  } = $props()

  let layer = $derived(markers.filter((marker) => marker.tier === tier))
  let elsewhere = $derived(markers.length - layer.length)
</script>

<div class="viewport">
  <div class="scene">
    <div class="map-root"><BlackWhaleOverview /></div>
    <div class="overlay">
      {#each layer as marker (marker.id)}
        <span
          class="dot"
          data-state={marker.state}
          class:highlight={marker.isObserver}
          style={`left:${marker.x}px;top:${marker.y}px`}
          title={marker.locationLabel ?? ''}
        >
          {marker.label}
        </span>
      {/each}
    </div>
  </div>
</div>

{#if markers.length === 0}
  <p class="note">{emptyLabel}</p>
{:else if elsewhere > 0}
  <p class="note">{elsewhereLabel(elsewhere)}</p>
{/if}

<style>
  .viewport {
    position: relative;
    height: 20rem;
    overflow: hidden;
    border: 1px solid var(--line, #2b3440);
    border-radius: 0.5rem;
    background: #05090f;
  }

  .scene {
    position: absolute;
    left: 0;
    top: 0;
    width: 1000px;
    height: 700px;
    transform: scale(0.62);
    transform-origin: 0 0;
  }

  .map-root {
    width: 1000px;
    height: 700px;
  }

  .overlay {
    position: absolute;
    inset: 0;
  }

  .dot {
    position: absolute;
    transform: translate(-50%, -50%);
    max-width: 9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid #6b7d8c;
    border-radius: 999px;
    background: rgba(16, 35, 50, 0.82);
    padding: 0.18rem 0.45rem;
    font-size: 0.66rem;
    color: #e8eef2;
  }

  .dot[data-state='believed'] {
    border-style: dashed;
  }

  .dot[data-state='outdated'] {
    border-style: dotted;
    opacity: 0.72;
  }

  .dot.highlight {
    border-color: #e5c57a;
    color: #f5e6bd;
  }

  .note {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    color: color-mix(in srgb, currentColor 65%, transparent);
  }
</style>
