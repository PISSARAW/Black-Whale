<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'

  function handleZoneClick(zoneId: string) {
    mapState.selectLocation(zoneId)
  }
  function handleZoneKeydown(event: KeyboardEvent, zoneId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleZoneClick(zoneId)
    }
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
        stroke: #ffd700;
        fill: #5c4125;
      }
      .transport {
        fill: none;
        stroke: #4a5568;
        stroke-width: 8;
        stroke-dasharray: 10, 10;
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
    <pattern
      id="stripes"
      patternUnits="userSpaceOnUse"
      width="10"
      height="10"
      patternTransform="rotate(45)"
    >
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
    <g
      role="button"
      tabindex="0"
      aria-label="Open West Commercial District"
      onclick={() => handleZoneClick('t4-dist-west')}
      onkeydown={(event) => handleZoneKeydown(event, 't4-dist-west')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 't4-dist-west'}
        x="160"
        y="80"
        width="140"
        height="150"
      />
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 't4-dist-west'}
        x="160"
        y="270"
        width="140"
        height="60"
      />
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 't4-dist-west'}
        x="160"
        y="370"
        width="140"
        height="110"
      />
      <text x="230" y="160" class="label">General Passenger Area (West)</text>
      <text x="230" y="175" class="sublabel text-red-400">&gt; 300 civilians per guard</text>
    </g>

    <!-- Center block -->
    <g
      role="button"
      tabindex="0"
      aria-label="Open Central Commercial District"
      onclick={() => handleZoneClick('t4-dist-center')}
      onkeydown={(event) => handleZoneKeydown(event, 't4-dist-center')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 't4-dist-center'}
        x="320"
        y="80"
        width="160"
        height="150"
      />
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 't4-dist-center'}
        x="320"
        y="370"
        width="160"
        height="110"
      />
      <text x="400" y="160" class="label">General Passenger Area (Center)</text>
      <text x="400" y="175" class="sublabel text-red-400">&gt; 300 civilians per guard</text>
    </g>

    <!-- Xi-Yu Office -->
    <g
      id="t4-xiyu"
      role="button"
      tabindex="0"
      aria-label="Open Xi-Yu Territory"
      onclick={() => handleZoneClick('t4-xiyu')}
      onkeydown={(event) => handleZoneKeydown(event, 't4-xiyu')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 't4-xiyu'}
        x="320"
        y="270"
        width="160"
        height="60"
      />
      <text x="400" y="300" class="label text-yellow-500">Xi-Yu Family HQ</text>
      <text x="400" y="315" class="sublabel text-yellow-600"
        >(Public Order & Human Trafficking)</text
      >
    </g>

    <!-- Medical (Limited) & Military -->
    <g
      id="t4-military-conf"
      role="button"
      tabindex="0"
      aria-label="Open Royal Army Conference Room"
      onclick={() => handleZoneClick('royal-army-office')}
      onkeydown={(event) => handleZoneKeydown(event, 'royal-army-office')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 'royal-army-office'}
        x="500"
        y="80"
        width="150"
        height="150"
      />
      <text x="575" y="150" class="label text-green-500 text-[11px]"
        >Kakin Royal Army Conf. Room</text
      >
      <text x="575" y="165" class="sublabel">Security coordination</text>
    </g>
    <g
      id="t4-medical-limited"
      role="button"
      tabindex="0"
      aria-label="Open Medical Clinic"
      onclick={() => handleZoneClick('t4-medical-limited')}
      onkeydown={(event) => handleZoneKeydown(event, 't4-medical-limited')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 't4-medical-limited'}
        x="500"
        y="370"
        width="150"
        height="110"
      />
      <text x="575" y="425" class="label text-blue-400">One Medical Clinic</text>
      <text x="575" y="440" class="sublabel">(Only clinic on this tier)</text>
    </g>

    <!-- Right block -->
    <g
      role="button"
      tabindex="0"
      aria-label="Open East Commercial District"
      onclick={() => handleZoneClick('t4-dist-east')}
      onkeydown={(event) => handleZoneKeydown(event, 't4-dist-east')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 't4-dist-east'}
        x="670"
        y="80"
        width="140"
        height="400"
      />
      <text x="740" y="280" class="label">General Passenger Area (East)</text>
      <text x="740" y="295" class="sublabel text-red-400">&gt; 300 civilians per guard</text>
    </g>

    <!-- Frontière de Recyclage (Sud) -->
    <g
      id="t4-recycling"
      role="button"
      tabindex="0"
      aria-label="Open Recycling Boundary"
      onclick={() => handleZoneClick('t4-recycling')}
      onkeydown={(event) => handleZoneKeydown(event, 't4-recycling')}
    >
      <path
        class="zone recycling"
        class:selected={mapState.selectedLocationId === 't4-recycling'}
        d="M 120 500 L 850 500 L 850 540 C 750 550, 250 550, 120 540 Z"
      />
      <text x="500" y="525" class="label" fill="#1a202c"
        >INSTALLATIONS TECHNIQUES & RECYCLAGE (VERS TIER 5)</text
      >
    </g>
  </g>
</svg>
