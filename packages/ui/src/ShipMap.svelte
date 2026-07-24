<script lang="ts">
  import type { MapState } from '@black-whale/map-engine'

  export let mapState: MapState
  export let selectedDeck: number = 1
</script>

<!-- Black Whale ship map — 2D SVG layers per deck -->
<div class="ship-map">
  <div class="deck-tabs">
    {#each mapState.layers as layer}
      <button
        class:active={layer.deck === selectedDeck}
        on:click={() => (selectedDeck = layer.deck)}
      >
        Deck {layer.deck} — {layer.label}
      </button>
    {/each}
  </div>

  {#each mapState.layers.filter((l) => l.deck === selectedDeck) as layer}
    <svg class="deck-svg" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
      {#each layer.zones as zone}
        <g id={zone.id} class="zone" data-zone-id={zone.id}>
          <!-- Zone geometry will be injected via geometryId -->
          <rect x="0" y="0" width="100" height="100" fill="none" stroke="#4a5568" />
          <text x="10" y="20" font-size="12">{zone.name}</text>
        </g>
      {/each}
    </svg>
  {/each}
</div>

<style>
  .ship-map {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .deck-tabs {
    display: flex;
    gap: 0.25rem;
  }
  button.active {
    font-weight: bold;
  }
  .deck-svg {
    width: 100%;
    height: auto;
  }
</style>
