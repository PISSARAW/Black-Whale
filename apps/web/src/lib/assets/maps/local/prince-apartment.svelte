<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';

  // Extract room number, e.g. "room-1014" -> "1014"
  let roomNumber = $derived(mapState.selectedLocationId?.split('-')[1] || '1000');
  
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in room ${roomNumber}`);
    // In a future update, this could open a modal with narrative details
    alert(`Élément ${elementId} cliqué dans la chambre ${roomNumber}`);
  }
</script>

<svg viewBox="0 0 800 600" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .wall { stroke: #FFFFF0; stroke-width: 4; fill: none; }
      .door { stroke: #FFD700; stroke-width: 4; fill: none; cursor: pointer; }
      .zone { fill: #2a1515; stroke: #8b4513; stroke-width: 1; transition: fill 0.2s; cursor: pointer; }
      .zone:hover { fill: #3d1c1c; }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 14px; font-weight: bold; pointer-events: none; text-anchor: middle; }
      .sublabel { fill: #FFD700; font-size: 10px; pointer-events: none; text-anchor: middle; }
    </style>
  </defs>
  
  <text x="400" y="30" class="label" font-size="24">Appartement Princier {roomNumber}</text>
  
  <!-- Outer walls -->
  <rect x="50" y="50" width="700" height="500" class="wall" />
  
  <!-- Porte principale & Entrée -->
  <rect class="zone" x="50" y="250" width="100" height="100" onclick={() => handleElementClick('entrance')} />
  <line class="door" x1="50" y1="280" x2="50" y2="320" />
  <text x="100" y="305" class="label text-xs">Entrée</text>
  
  <!-- Corridor -->
  <rect class="zone" x="150" y="250" width="150" height="100" />
  <text x="225" y="305" class="label text-xs">Corridor</text>
  
  <!-- Cuisine & Salle à manger (Top left) -->
  <rect class="zone" x="150" y="50" width="200" height="200" onclick={() => handleElementClick('dining')} />
  <text x="250" y="150" class="label">Cuisine & Salle à manger</text>
  
  <!-- Quartiers serviteurs (Bottom left) -->
  <rect class="zone" x="150" y="350" width="200" height="200" onclick={() => handleElementClick('servants')} />
  <text x="250" y="450" class="label">Quartiers Serviteurs</text>
  
  <!-- Toilettes Communes (near corridor/servants) -->
  <rect class="zone" x="300" y="250" width="50" height="100" onclick={() => handleElementClick('shared-toilets')} />
  <text x="325" y="305" class="label text-[10px]" transform="rotate(-90 325 305)">Toilettes</text>
  
  <!-- Grand séjour (Center) -->
  <rect class="zone" x="350" y="50" width="250" height="500" onclick={() => handleElementClick('living')} />
  <text x="475" y="280" class="label">Grand Séjour</text>
  
  <!-- Elements Dynamiques -->
  {#if roomNumber === '1014'}
    <text x="475" y="300" class="sublabel">Salle de cours de Nen</text>
    <rect x="425" y="200" width="100" height="100" fill="none" stroke="#4a5568" stroke-dasharray="5,5" />
    <text x="475" y="250" class="sublabel text-[#4a5568]">Zone de rassemblement</text>
  {/if}
  {#if roomNumber === '1008'}
    <text x="475" y="300" class="sublabel">Suite de Fête (Déchets éparpillés)</text>
  {/if}
  {#if roomNumber === '1007'}
    <text x="475" y="300" class="sublabel">Salon avec TV (Clean Leaf)</text>
    <rect x="550" y="220" width="30" height="60" fill="#333" />
    <text x="565" y="255" class="label text-[8px] transform -rotate-90">TV</text>
  {/if}
  {#if roomNumber === '1009'}
    <text x="475" y="300" class="sublabel text-[#63b3ed]">Zone de Synchronisation (Aura Collective)</text>
    <circle cx="475" cy="250" r="80" fill="rgba(99, 179, 237, 0.2)" stroke="#63b3ed" stroke-width="2" />
  {/if}
  {#if roomNumber === '1001'}
    <text x="475" y="300" class="sublabel text-red-400">Centre de Commandement Militaire</text>
  {/if}
  
  <!-- Chambre principale (Right) -->
  <rect class="zone" x="600" y="50" width="150" height="300" onclick={() => handleElementClick('master-bedroom')} />
  <text x="675" y="180" class="label">Chambre</text>
  <text x="675" y="195" class="label">Principale</text>
  
  <!-- Douche & Cabinet toilette (Bottom Right) -->
  <rect class="zone" x="600" y="350" width="150" height="100" onclick={() => handleElementClick('master-shower')} />
  <text x="675" y="405" class="label text-xs">Douche</text>
  
  <rect class="zone" x="600" y="450" width="150" height="100" onclick={() => handleElementClick('master-toilet')} />
  <text x="675" y="505" class="label text-xs">Cabinet Toilette</text>
  
  <!-- Interior Walls / Partitions -->
  <line class="wall" x1="150" y1="50" x2="150" y2="550" />
  <line class="wall" x1="350" y1="50" x2="350" y2="550" />
  <line class="wall" x1="600" y1="50" x2="600" y2="550" />
  
  <line class="wall" x1="150" y1="250" x2="350" y2="250" />
  <line class="wall" x1="150" y1="350" x2="350" y2="350" />
  <line class="wall" x1="600" y1="350" x2="750" y2="350" />
  <line class="wall" x1="600" y1="450" x2="750" y2="450" />
</svg>
