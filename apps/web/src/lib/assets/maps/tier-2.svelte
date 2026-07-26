<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';

  function handleZoneClick(zoneId: string) {
    mapState.selectLocation(zoneId);
  }
  function handleZoneKeydown(event: KeyboardEvent, zoneId: string) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleZoneClick(zoneId); }
  }
  function handleTierAccessKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); mapState.selectTier('tier-1'); }
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .hull {
        fill: #0a192f;
        stroke: #c0c0c0;
        stroke-width: 4;
      }
      .zone {
        fill: #112240;
        stroke: #c0c0c0;
        stroke-width: 2;
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: #1a365d;
      }
      .zone.selected {
        stroke: #FFD700;
        fill: #234e8c;
      }
      .barrier {
        fill: #020c1b;
        stroke: #FF4500;
        stroke-width: 3;
        stroke-dasharray: 10,5;
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
        fill: #8892b0;
        font-size: 11px;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <!-- Outer Hull Tier 2 -->
  <path class="hull" d="M 200 80 C 50 80, 50 520, 200 520 L 750 520 C 950 520, 950 80, 750 80 Z" />

  <g id="tier-2-zones">
    <!-- Quartiers VIP & Célébrités -->
    <g id="t2-vip" role="button" tabindex="0" aria-label="Open VIP Quarters" onclick={() => handleZoneClick('t2-vip')} onkeydown={(event) => handleZoneKeydown(event, 't2-vip')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't2-vip'} x="250" y="150" width="300" height="150" />
      <text x="400" y="215" class="label">VIP Quarters</text>
      <text x="400" y="235" class="sublabel">Celebrities & Fortunes</text>
    </g>

    <!-- Espaces de Réception & Services -->
    <g id="t2-reception" role="button" tabindex="0" aria-label="Open Reception Areas" onclick={() => handleZoneClick('t2-reception')} onkeydown={(event) => handleZoneKeydown(event, 't2-reception')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't2-reception'} x="250" y="320" width="250" height="130" />
      <text x="375" y="380" class="label text-sm">Reception Areas</text>
    </g>

    <!-- Ministry of Justice HQ -->
    <g id="t2-justice" role="button" tabindex="0" aria-label="Open Ministry of Justice Headquarters" onclick={() => handleZoneClick('t2-justice')} onkeydown={(event) => handleZoneKeydown(event, 't2-justice')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't2-justice'} x="520" y="320" width="280" height="130" />
      <text x="660" y="380" class="label text-blue-400">Ministry of Justice HQ</text>
    </g>

    <!-- Accès Tier 1 -->
    <g id="t2-access-t1" role="button" tabindex="0" aria-label="Open Tier 1" onclick={() => mapState.selectTier('tier-1')} onkeydown={handleTierAccessKeydown}>
      <circle class="zone" cx="525" cy="115" r="25" />
      <text x="525" y="119" class="label text-[10px]">T1</text>
    </g>

    <!-- Secteur de Sécurité & Accès Tier 3 -->
    <g id="t2-security" role="button" tabindex="0" aria-label="Open Security Sector" onclick={() => handleZoneClick('t2-security')} onkeydown={(event) => handleZoneKeydown(event, 't2-security')}>
      <path class="zone" class:selected={mapState.selectedLocationId === 't2-security'} d="M 150 480 L 850 480 L 850 515 C 750 520, 250 520, 150 515 Z" />
      <text x="500" y="505" class="label text-xs">Security Sector (600 Guards Stationed)</text>
    </g>

    <!-- CLOISON BLINDÉE TIER 2 - TIER 3 -->
    <path class="barrier" d="M 150 520 L 850 520" />
    <text x="500" y="535" class="label text-[10px]" fill="#FF4500">ARMORED BULKHEAD (TO TIER 3)</text>
  </g>
</svg>
