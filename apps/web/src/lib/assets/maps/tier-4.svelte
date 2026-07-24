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
        fill: #2d2013; /* amber/brown */
        stroke: #a0aec0; /* metallic */
        stroke-width: 4;
      }
      .zone {
        fill: #1c140c;
        stroke: #718096;
        stroke-width: 1;
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: #362617;
      }
      .zone.selected {
        stroke: #FFD700;
        fill: #5c4125;
      }
      .transport {
        fill: none;
        stroke: #4a5568;
        stroke-width: 8;
        stroke-dasharray: 10,10;
      }
      .recycling {
        fill: url(#stripes);
      }
      .label {
        fill: #e2e8f0;
        font-family: sans-serif;
        font-size: 12px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #a0aec0;
        font-size: 9px;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
    <pattern id="stripes" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="10" stroke="#718096" stroke-width="5" />
    </pattern>
  </defs>

  <!-- Outer Hull Tier 4 -->
  <path class="hull" d="M 120 50 C 20 50, 20 550, 120 550 L 850 550 C 970 550, 970 50, 850 50 Z" />

  <g id="tier-4-zones">
    
    <!-- Routes de Transport -->
    <path class="transport" d="M 150 250 L 820 250 M 150 350 L 820 350" />
    
    <!-- Districts Commerciaux & Résidentiels (Dense) -->
    <!-- Left block -->
    <g onclick={() => handleZoneClick('t4-dist-west')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't4-dist-west'} x="160" y="80" width="140" height="150" />
      <rect class="zone" class:selected={mapState.selectedLocationId === 't4-dist-west'} x="160" y="270" width="140" height="60" />
      <rect class="zone" class:selected={mapState.selectedLocationId === 't4-dist-west'} x="160" y="370" width="140" height="110" />
      <text x="230" y="160" class="label">District Ouest</text>
    </g>

    <!-- Center block -->
    <g onclick={() => handleZoneClick('t4-dist-center')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't4-dist-center'} x="320" y="80" width="160" height="150" />
      <rect class="zone" class:selected={mapState.selectedLocationId === 't4-dist-center'} x="320" y="370" width="160" height="110" />
      <text x="400" y="160" class="label">District Central</text>
      <text x="400" y="175" class="sublabel">Commerce & Résidence</text>
    </g>

    <!-- Xi-Yu Office -->
    <g id="t4-xiyu" onclick={() => handleZoneClick('t4-xiyu')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't4-xiyu'} x="320" y="270" width="160" height="60" />
      <text x="400" y="305" class="label">Bureau Xi-Yu</text>
    </g>

    <!-- Medical (Limited) & Military -->
    <g id="t4-military-conf" onclick={() => handleZoneClick('t4-military-conf')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't4-military-conf'} x="500" y="80" width="150" height="150" />
      <text x="575" y="150" class="label">Conférence</text>
      <text x="575" y="165" class="sublabel">Militaire</text>
    </g>
    <g id="t4-medical-limited" onclick={() => handleZoneClick('t4-medical-limited')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't4-medical-limited'} x="500" y="370" width="150" height="110" />
      <text x="575" y="425" class="label">Service Médical</text>
      <text x="575" y="440" class="sublabel">(Capacité Limitée)</text>
    </g>

    <!-- Right block -->
    <g onclick={() => handleZoneClick('t4-dist-east')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't4-dist-east'} x="670" y="80" width="140" height="400" />
      <text x="740" y="280" class="label">District Est</text>
    </g>

    <!-- Frontière de Recyclage (Sud) -->
    <g id="t4-recycling" onclick={() => handleZoneClick('t4-recycling')}>
      <path class="zone recycling" class:selected={mapState.selectedLocationId === 't4-recycling'} d="M 120 500 L 850 500 L 850 540 C 750 550, 250 550, 120 540 Z" />
      <text x="500" y="525" class="label" fill="#1a202c">INSTALLATIONS TECHNIQUES & RECYCLAGE (VERS TIER 5)</text>
    </g>

  </g>
</svg>
