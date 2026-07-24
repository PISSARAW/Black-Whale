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

  <g id="tier-2-sectors">
    <!-- Main corridor connecting them -->
    <path class="corridor" d="M 150 400 L 850 400 L 850 450 L 150 450 Z" />

    <!-- Quartier VIP -->
    <g id="t2-vip" on:click={() => handleZoneClick('t2-vip')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't2-vip'} x="200" y="150" width="600" height="200" />
      <text x="500" y="250" class="label text-xl">Quartier VIP</text>
    </g>

    <!-- Zone de services / Restauration VIP -->
    <g id="t2-services" on:click={() => handleZoneClick('t2-services')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't2-services'} x="200" y="500" width="250" height="200" />
      <text x="325" y="600" class="label">Services & Restauration</text>
    </g>

    <!-- Zone Militaire -->
    <g id="t2-military" on:click={() => handleZoneClick('t2-military')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't2-military'} x="550" y="500" width="250" height="200" />
      <text x="675" y="600" class="label">Zone Militaire</text>
    </g>
  </g>
</svg>
