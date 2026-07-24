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
      .fog-of-war {
        fill: url(#fog);
      }
    </style>
    <pattern id="fog" patternUnits="userSpaceOnUse" width="10" height="10">
      <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="#555" stroke-width="1" />
    </pattern>
  </defs>

  <g id="tier-3-sectors">
    <!-- Corridors -->
    <path class="corridor" d="M 450 150 L 550 150 L 550 650 L 450 650 Z" />
    
    <!-- Zone Publique -->
    <g id="t3-public" on:click={() => handleZoneClick('t3-public')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't3-public'} x="100" y="150" width="300" height="200" />
      <text x="250" y="250" class="label">Zone Publique</text>
    </g>

    <!-- Zone Médicale -->
    <g id="t3-medical" on:click={() => handleZoneClick('t3-medical')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't3-medical'} x="600" y="150" width="300" height="200" />
      <text x="750" y="250" class="label">Zone Médicale</text>
    </g>

    <!-- Bureaux Mafieux -->
    <g id="t3-mafia" on:click={() => handleZoneClick('t3-mafia')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't3-mafia'} x="100" y="450" width="300" height="200" />
      <text x="250" y="550" class="label">Bureaux Mafieux</text>
    </g>

    <!-- Espace de Restauration -->
    <g id="t3-food" on:click={() => handleZoneClick('t3-food')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 't3-food'} x="600" y="450" width="300" height="200" />
      <text x="750" y="550" class="label">Espaces de Restauration</text>
    </g>
  </g>
</svg>
