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
        stroke: #FFD700;
        fill: #404040;
      }
      .warehouse {
        fill: #1c1c1c;
        stroke: #8b4513;
        stroke-dasharray: 5,5;
      }
      .warehouse:hover {
        fill: #2a2a2a;
      }
      .warehouse.selected {
        stroke: #FFD700;
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
    <pattern id="stripes" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="10" stroke="#8b4513" stroke-width="5" />
    </pattern>
  </defs>

  <!-- Outer Hull Tier 5 -->
  <path class="hull" d="M 150 100 C 50 100, 50 450, 150 450 L 750 450 C 850 450, 850 100, 750 100 Z" />

  <g id="tier-5-zones">
    
    <!-- Frontière de Recyclage (Nord) -->
    <g id="t5-recycling" onclick={() => handleZoneClick('t5-recycling')}>
      <path class="zone recycling" class:selected={mapState.selectedLocationId === 't5-recycling'} d="M 150 100 L 750 100 L 750 140 C 450 160, 450 160, 150 140 Z" />
      <text x="450" y="125" class="label" fill="#1a1a1a">INSTALLATIONS TECHNIQUES & RECYCLAGE (VERS TIER 4)</text>
    </g>

    <!-- Zone Résidentielle (Logistique & Populaire) -->
    <g onclick={() => handleZoneClick('t5-residential')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't5-residential'} x="180" y="170" width="180" height="250" />
      <text x="270" y="290" class="label">Districts Résidentiels</text>
      <text x="270" y="310" class="sublabel">Haute Densité</text>
    </g>

    <!-- Entrepôts & Stockage -->
    <g id="t5-warehouses" onclick={() => handleZoneClick('t5-warehouses')}>
      <rect class="zone warehouse" class:selected={mapState.selectedLocationId === 't5-warehouses'} x="400" y="170" width="320" height="140" />
      <text x="560" y="235" class="label">Entrepôts Principaux</text>
      <text x="560" y="255" class="sublabel">Zones de Stockage</text>
    </g>

    <!-- Bureau Cha-R -->
    <g id="t5-char" onclick={() => handleZoneClick('t5-char')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't5-char'} x="400" y="330" width="120" height="90" />
      <text x="460" y="375" class="label">Bureau Cha-R</text>
    </g>

    <!-- Cafétéria -->
    <g id="t5-cafeteria" onclick={() => handleZoneClick('t5-cafeteria')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't5-cafeteria'} x="540" y="330" width="90" height="90" />
      <text x="585" y="380" class="label">Cafétéria</text>
    </g>

    <!-- Service Médical Limité -->
    <g id="t5-medical-none" onclick={() => handleZoneClick('t5-medical-none')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't5-medical-none'} x="650" y="330" width="70" height="90" />
      <text x="685" y="365" class="label">Médical</text>
      <text x="685" y="380" class="warnlabel">AUCUN MÉDECIN</text>
      <text x="685" y="395" class="warnlabel">PERMANENT</text>
    </g>

  </g>
</svg>
