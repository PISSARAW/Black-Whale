<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';

  function handleZoneClick(zoneId: string) {
    mapState.selectLocation(zoneId);
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .hull {
        fill: #1a0f0f;
        stroke: #FFD700;
        stroke-width: 4;
      }
      .zone {
        fill: #2a1515;
        stroke: #FFFFF0;
        stroke-width: 2;
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: #3d1c1c;
      }
      .zone.selected {
        stroke: #FFD700;
        fill: #4d2020;
      }
      .corridor {
        fill: #110808;
        stroke: #FFD700;
        stroke-width: 1;
        stroke-dasharray: 4,4;
      }
      .label {
        fill: #FFFFF0;
        font-family: sans-serif;
        font-size: 14px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #FFD700;
        font-size: 11px;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <!-- Outer Hull Tier 1 (Smaller deck) -->
  <path class="hull" d="M 250 100 C 100 100, 100 500, 250 500 L 700 500 C 900 500, 900 100, 700 100 Z" />

  <!-- Main Royal Corridor -->
  <path class="corridor" d="M 200 280 L 800 280 L 800 320 L 200 320 Z" />

  <g id="tier-1-zones">
    <!-- Quartiers Princiers -->
    <g id="t1-princes">
      <!-- Murs extérieurs du bloc princier -->
      <rect x="300" y="150" width="300" height="100" fill="none" stroke="#FFFFF0" stroke-width="2" />
      
      <!-- Ligne du haut (1001 à 1007) -->
      {#each [1, 2, 3, 4, 5, 6, 7] as i}
        <g onclick={() => handleZoneClick(`room-100${i}`)}>
          <rect class="zone" class:selected={mapState.selectedLocationId === `room-100${i}`} x={300 + (i-1)*42.85} y="150" width="42.85" height="50" />
          <text x={300 + (i-1)*42.85 + 21} y="180" class="label text-[9px]">100{i}</text>
        </g>
      {/each}
      
      <!-- Ligne du bas (1008 à 1014) -->
      {#each [8, 9, 10, 11, 12, 13, 14] as i}
        <g onclick={() => handleZoneClick(`room-10${i < 10 ? '0'+i : i}`)}>
          <rect class="zone" class:selected={mapState.selectedLocationId === `room-10${i < 10 ? '0'+i : i}`} x={300 + (i-8)*42.85} y="200" width="42.85" height="50" />
          <text x={300 + (i-8)*42.85 + 21} y="230" class="label text-[9px]">10{i < 10 ? '0'+i : i}</text>
        </g>
      {/each}
      
      <text x="450" y="145" class="label text-xs">Quartier Royal (Appartements)</text>
    </g>

    <!-- Résidence du Roi & Reines -->
    <g id="t1-king-queens" onclick={() => handleZoneClick('t1-king-queens')}>
      <path class="zone" class:selected={mapState.selectedLocationId === 't1-king-queens'} d="M 150 200 L 250 200 L 250 400 L 150 400 C 120 300, 120 250, 150 200 Z" />
      <text x="210" y="295" class="label">Roi & Reines</text>
    </g>

    <!-- Zone cérémonielle & Banquet -->
    <g id="t1-ceremony" onclick={() => handleZoneClick('t1-ceremony')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't1-ceremony'} x="300" y="350" width="200" height="100" />
      <text x="400" y="405" class="label">Cérémonies & Banquet</text>
    </g>

    <!-- Secteur Militaire & Judiciaire -->
    <g id="t1-military" onclick={() => handleZoneClick('t1-military')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't1-military'} x="550" y="350" width="150" height="100" />
      <text x="625" y="395" class="label">Secteur Militaire</text>
      <text x="625" y="415" class="sublabel">& Judiciaire</text>
    </g>

    <!-- Logements Gardes & Hunters -->
    <g id="t1-guards" onclick={() => handleZoneClick('t1-guards')}>
      <path class="zone" class:selected={mapState.selectedLocationId === 't1-guards'} d="M 650 150 L 750 150 C 800 200, 800 250, 800 300 C 800 330, 780 370, 750 400 L 730 400 L 730 250 L 650 250 Z" />
      <text x="730" y="220" class="label text-xs">Logements</text>
      <text x="730" y="240" class="sublabel text-[9px]">Gardes & Hunters</text>
    </g>
  </g>
</svg>
