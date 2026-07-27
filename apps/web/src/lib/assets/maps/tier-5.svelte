<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'

  function handleZoneClick(zoneId: string) {
    mapState.selectLocation(zoneId)
  }
  function handleZoneKeydown(event: KeyboardEvent, zoneId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      handleZoneClick(zoneId)
    }
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .hull {
        fill: #1a1a1a; /* anthracite */
        stroke: #8b4513; /* rust */
        stroke-width: 4;
      }
      .zone {
        fill: #262626;
        stroke: #5c3a21;
        stroke-width: 2;
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: #333333;
      }
      .zone.selected {
        stroke: #ffd700;
        fill: #404040;
      }
      .warehouse {
        fill: #1c1c1c;
        stroke: #8b4513;
        stroke-dasharray: 5, 5;
      }
      .warehouse:hover {
        fill: #2a2a2a;
      }
      .warehouse.selected {
        stroke: #ffd700;
        fill: #333333;
      }
      .recycling {
        fill: url(#stripes);
      }
      .label {
        fill: #d4d4d4;
        font-family: sans-serif;
        font-size: 13px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #a3a3a3;
        font-size: 10px;
        pointer-events: none;
        text-anchor: middle;
      }
      .warnlabel {
        fill: #ef4444;
        font-size: 9px;
        font-weight: bold;
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
      <line x1="0" y1="0" x2="0" y2="10" stroke="#8b4513" stroke-width="5" />
    </pattern>
  </defs>

  <!-- Outer Hull Tier 5 -->
  <path
    class="hull"
    d="M 150 100 C 50 100, 50 450, 150 450 L 750 450 C 850 450, 850 100, 750 100 Z"
  />

  <g id="tier-5-zones">
    <!-- Frontière de Recyclage (Nord) -->
    <g
      id="t5-recycling"
      role="button"
      tabindex="0"
      aria-label="Open Recycling Boundary"
      onclick={() => handleZoneClick('t5-recycling')}
      onkeydown={(event) => handleZoneKeydown(event, 't5-recycling')}
    >
      <path
        class="zone recycling"
        class:selected={mapState.selectedLocationId === 't5-recycling'}
        d="M 150 100 L 750 100 L 750 140 C 450 160, 450 160, 150 140 Z"
      />
      <text x="450" y="125" class="label" fill="#1a1a1a"
        >INSTALLATIONS TECHNIQUES & RECYCLAGE (VERS TIER 4)</text
      >
    </g>

    <!-- Zone Résidentielle (Logistique & Populaire) -->
    <g
      role="button"
      tabindex="0"
      aria-label="Open Residential Zone"
      onclick={() => handleZoneClick('t5-residential')}
      onkeydown={(event) => handleZoneKeydown(event, 't5-residential')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 't5-residential'}
        x="180"
        y="170"
        width="180"
        height="250"
      />
      <text x="270" y="270" class="label">Standard Cabins</text>
      <text x="270" y="290" class="sublabel">(General Passenger Area)</text>
      <text x="270" y="310" class="warnlabel">&gt; 300 civilians per guard</text>

      <!-- Assembly Point 37564 -->
      <g
        role="button"
        tabindex="0"
        aria-label="Open Room 37564"
        onclick={(e) => {
          e.stopPropagation()
          handleZoneClick('room-37564')
        }}
        onkeydown={(event) => handleZoneKeydown(event, 'room-37564')}
      >
        <rect
          class="zone"
          class:selected={mapState.selectedLocationId === 'room-37564'}
          x="230"
          y="340"
          width="80"
          height="30"
          fill="#4a5568"
        />
        <text x="270" y="360" class="label text-[10px]">Area 37564</text>
      </g>
    </g>

    <!-- Entrepôts & Stockage -->
    <g
      id="t5-warehouses"
      role="button"
      tabindex="0"
      aria-label="Open Warehouses"
      onclick={() => handleZoneClick('t5-warehouses')}
      onkeydown={(event) => handleZoneKeydown(event, 't5-warehouses')}
    >
      <rect
        class="zone warehouse"
        class:selected={mapState.selectedLocationId === 't5-warehouses'}
        x="400"
        y="170"
        width="320"
        height="140"
      />
      <text x="560" y="235" class="label">Main Warehouses</text>
      <text x="560" y="255" class="sublabel">Storage Areas</text>
    </g>

    <!-- Bureau Cha-R -->
    <g
      id="t5-char"
      role="button"
      tabindex="0"
      aria-label="Open Cha-R Territory"
      onclick={() => handleZoneClick('t5-char')}
      onkeydown={(event) => handleZoneKeydown(event, 't5-char')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 't5-char'}
        x="400"
        y="330"
        width="120"
        height="90"
      />
      <text x="460" y="365" class="label text-yellow-500">Cha-R Family HQ</text>
      <text x="460" y="380" class="sublabel text-[9px]">(Commodities Control)</text>
    </g>

    <!-- Cafétéria -->
    <g
      id="t5-cafeteria"
      role="button"
      tabindex="0"
      aria-label="Open Central Dining Hall"
      onclick={() => handleZoneClick('central-dining-hall')}
      onkeydown={(event) => handleZoneKeydown(event, 'central-dining-hall')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 'central-dining-hall'}
        x="540"
        y="330"
        width="90"
        height="90"
      />
      <text x="585" y="370" class="label text-[11px] text-green-400">Central Dining</text>
      <text x="585" y="385" class="sublabel text-[9px] text-red-400">Buor Toll</text>
    </g>

    <!-- Service Médical Limité -->
    <g
      id="t5-medical-none"
      role="button"
      tabindex="0"
      aria-label="Open Limited Medical Service"
      onclick={() => handleZoneClick('t5-medical-none')}
      onkeydown={(event) => handleZoneKeydown(event, 't5-medical-none')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 't5-medical-none'}
        x="650"
        y="330"
        width="70"
        height="90"
      />
      <text x="685" y="355" class="label text-blue-400 text-[10px]">One Clinic</text>
      <text x="685" y="375" class="warnlabel">NO DEDICATED</text>
      <text x="685" y="390" class="warnlabel">DOCTORS</text>
    </g>
  </g>
</svg>
