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

  <g id="tier-1-sector-royal">
    <!-- Corridors -->
    <path class="corridor" d="M 200 300 L 800 300 L 800 350 L 200 350 Z" />
    <text x="500" y="330" class="label">Couloir 1000</text>

    <!-- Room 1014 -->
    <g id="room-1014" on:click={() => handleZoneClick('room-1014')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 'room-1014'} x="250" y="150" width="150" height="150" />
      <text x="325" y="225" class="label">Chambre 1014</text>
    </g>

    <!-- Room 1013 -->
    <g id="room-1013" on:click={() => handleZoneClick('room-1013')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 'room-1013'} x="450" y="150" width="150" height="150" />
      <text x="525" y="225" class="label">Chambre 1013</text>
    </g>
    
    <!-- Room 1004 (Tserriednich) -->
    <g id="room-1004" on:click={() => handleZoneClick('room-1004')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 'room-1004'} x="650" y="150" width="150" height="150" />
      <text x="725" y="225" class="label">Chambre 1004</text>
    </g>

    <!-- Medical Zone -->
    <g id="zone-medical" on:click={() => handleZoneClick('zone-medical')}>
      <rect class="room" class:selected={mapState.selectedLocationId === 'zone-medical'} x="250" y="400" width="200" height="200" />
      <text x="350" y="500" class="label">Zone Médicale</text>
    </g>

    <!-- Unknown Zone (Fog of war) -->
    <g id="zone-unknown">
      <rect class="room fog-of-war" x="550" y="400" width="250" height="200" />
      <text x="675" y="500" class="label">Localisation non révélée</text>
    </g>
  </g>
</svg>
