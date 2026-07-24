<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';

  function handleZoneClick(zoneId: string) {
    mapState.selectLocation(zoneId);
  }
</script>

<svg viewBox="0 0 1000 800" class="w-full h-full text-gray-300">
  <defs>
    <style>
      .room {
        fill: #1a1a1a;
        stroke: #FFFFF0;
        stroke-width: 2;
        transition: fill 0.2s;
        cursor: pointer;
      }
      .room:hover {
        fill: #333;
      }
      .room.selected {
        stroke: #FFD700;
        fill: #2a2a2a;
      }
      .corridor {
        fill: #111;
        stroke: #FFFFF0;
        stroke-width: 2;
        stroke-dasharray: 5,5;
      }
      .label {
        fill: #FFFFF0;
        font-family: sans-serif;
        font-size: 14px;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <g id="tier-5-sectors">
    <path class="corridor" d="M 100 350 L 900 350 L 900 450 L 100 450 Z" />

    <g id="t5-slums" on:click={() => handleZoneClick('t5-slums')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't5-slums'} x="150" y="100" width="700" height="200" />
      <text x="500" y="200" class="label text-xl">Dortoirs Précaires (Classe populaire)</text>
    </g>

    <g id="t5-engine" on:click={() => handleZoneClick('t5-engine')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't5-engine'} x="150" y="500" width="300" height="200" />
      <text x="300" y="600" class="label">Salle des machines / Ingénierie</text>
    </g>

    <g id="t5-storage" on:click={() => handleZoneClick('t5-storage')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't5-storage'} x="550" y="500" width="300" height="200" />
      <text x="700" y="600" class="label">Soutes / Stockage</text>
    </g>
  </g>
</svg>
