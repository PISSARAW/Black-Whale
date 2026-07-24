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
        fill: #2d3748; /* administrative gray */
        stroke: #718096;
        stroke-width: 4;
      }
      .zone {
        fill: #1a202c;
        stroke: #4a5568;
        stroke-width: 1.5;
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: #2d3748;
      }
      .zone.selected {
        stroke: #4299e1;
        fill: #2c5282;
      }
      .medical {
        fill: #2b6cb0;
        stroke: #90cdf4;
      }
      .medical:hover {
        fill: #3182ce;
      }
      .medical.selected {
        stroke: #FFD700;
        fill: #2c5282;
      }
      .label {
        fill: #e2e8f0;
        font-family: sans-serif;
        font-size: 13px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #a0aec0;
        font-size: 10px;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <!-- Outer Hull Tier 3 (Widest deck) -->
  <path class="hull" d="M 120 50 C 10 50, 10 550, 120 550 L 850 550 C 980 550, 980 50, 850 50 Z" />

  <g id="tier-3-zones">
    <!-- Zone Résidentielle -->
    <g id="t3-residential-1st" on:click={() => handleZoneClick('t3-residential-1st')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't3-residential-1st'} x="180" y="100" width="180" height="150" />
      <text x="270" y="170" class="label">Cabines 1ère Classe</text>
    </g>
    
    <g id="t3-residential-ord" on:click={() => handleZoneClick('t3-residential-ord')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't3-residential-ord'} x="180" y="270" width="180" height="200" />
      <text x="270" y="360" class="label">Cabines Ordinaires</text>
    </g>

    <!-- Secteur Médical -->
    <g id="t3-hospital" on:click={() => handleZoneClick('t3-hospital')}>
      <rect class="zone medical" class:selected={mapState.selectedLocationId === 't3-hospital'} x="400" y="100" width="200" height="180" />
      <text x="500" y="185" class="label" fill="#FFFFF0">Hôpital Principal</text>
      <text x="500" y="205" class="sublabel" fill="#ebf8ff">Secteur Médical</text>
    </g>

    <!-- Secteur Administratif & Judiciaire -->
    <g id="t3-police" on:click={() => handleZoneClick('t3-police')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't3-police'} x="400" y="300" width="100" height="170" />
      <text x="450" y="380" class="label">Police</text>
    </g>
    <g id="t3-army-office" on:click={() => handleZoneClick('t3-army-office')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't3-army-office'} x="500" y="300" width="100" height="85" />
      <text x="550" y="345" class="label">Armée</text>
    </g>
    <g id="t3-justice" on:click={() => handleZoneClick('t3-justice')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't3-justice'} x="500" y="385" width="100" height="85" />
      <text x="550" y="425" class="label">Justice</text>
      <text x="550" y="440" class="sublabel">Détention</text>
    </g>

    <!-- Loisirs & Heil-Ly -->
    <g id="t3-cinema" on:click={() => handleZoneClick('t3-cinema')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't3-cinema'} x="640" y="100" width="150" height="120" />
      <text x="715" y="165" class="label">Cinéma</text>
    </g>
    <g id="t3-obs-deck" on:click={() => handleZoneClick('t3-obs-deck')}>
      <path class="zone" class:selected={mapState.selectedLocationId === 't3-obs-deck'} d="M 640 240 L 790 240 L 830 350 L 640 350 Z" />
      <text x="715" y="300" class="label">Pont</text>
      <text x="715" y="315" class="sublabel">d'Observation</text>
    </g>
    <g id="t3-heilly" on:click={() => handleZoneClick('t3-heilly')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't3-heilly'} x="640" y="370" width="150" height="100" />
      <text x="715" y="420" class="label">Bureau Heil-Ly</text>
      <text x="715" y="440" class="sublabel text-purple-400">Zone Officielle</text>
    </g>

    <!-- Sas de sécurité vers le haut -->
    <g id="t3-access-t2" on:click={() => handleZoneClick('t3-access-t2')}>
      <rect class="zone" class:selected={mapState.selectedLocationId === 't3-access-t2'} x="450" y="60" width="100" height="30" />
      <text x="500" y="80" class="label text-[10px]">Accès T2 (Bloqué)</text>
    </g>
  </g>
</svg>
