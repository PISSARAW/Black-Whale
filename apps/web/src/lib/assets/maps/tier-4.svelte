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

  <g id="tier-4-sectors">
    <path class="corridor" d="M 200 400 L 800 400 L 800 450 L 200 450 Z" />

    <g id="t4-dorms" on:click={() => handleZoneClick('t4-dorms')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't4-dorms'} x="250" y="150" width="500" height="200" />
      <text x="500" y="250" class="label text-xl">Dortoirs Civils (Classe moyenne)</text>
    </g>

    <g id="t4-market" on:click={() => handleZoneClick('t4-market')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't4-market'} x="250" y="500" width="200" height="200" />
      <text x="350" y="600" class="label">Marché / Commerces</text>
    </g>

    <g id="t4-control" on:click={() => handleZoneClick('t4-control')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't4-control'} x="550" y="500" width="200" height="200" />
      <text x="650" y="600" class="label">Contrôle de sécurité</text>
    </g>
  </g>
</svg>
