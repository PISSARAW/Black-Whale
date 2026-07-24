<script lang="ts">
  function handleDoorClick(n: number) {
    alert(`Porte ${n} cliquée. Redirection aléatoire ou mortelle selon la contamination au Nen !`);
  }
</script>

<svg viewBox="0 0 800 800" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .wall { stroke: #a0aec0; stroke-width: 6; fill: none; }
      .nen-reinforced { stroke: #9f7aea; stroke-dasharray: 10,5; stroke-width: 8; fill: none; }
      .door { stroke: #FFD700; stroke-width: 6; fill: #2d3748; cursor: pointer; transition: stroke 0.2s; }
      .door:hover { stroke: #ff4444; }
      .zone { fill: #1a202c; stroke: #4a5568; stroke-width: 1; transition: fill 0.2s; }
      .zone:hover { fill: #2d3748; }
      .blood { fill: #742a2a; opacity: 0.6; pointer-events: none; }
      .label { fill: #e2e8f0; font-family: sans-serif; font-size: 14px; font-weight: bold; pointer-events: none; text-anchor: middle; }
    </style>
  </defs>
  
  <text x="400" y="50" class="label" font-size="24">Base Heil-Ly : Salle de traitement</text>
  
  <!-- Main Room (Square) -->
  <rect x="150" y="150" width="500" height="500" class="zone" />
  <rect x="150" y="150" width="500" height="500" class="wall" />
  <rect x="145" y="145" width="510" height="510" class="nen-reinforced" />
  
  <text x="400" y="400" class="label text-[#9f7aea]">Murs renforcés au Nen</text>
  <text x="400" y="420" class="label text-xs text-gray-400">(Graffitis et crasse)</text>
  
  <!-- Blood stains -->
  <path class="blood" d="M 300 300 Q 320 350, 350 320 T 400 300 Z" />
  <path class="blood" d="M 500 450 Q 480 500, 520 520 T 550 480 Z" />
  
  <!-- Toilettes séparées & Baignoire (Corners) -->
  <rect x="150" y="150" width="100" height="100" fill="#2d3748" stroke="#4a5568" stroke-width="2" />
  <text x="200" y="205" class="label text-[10px]">Douche / Lavage</text>
  
  <rect x="550" y="150" width="100" height="100" fill="#2d3748" stroke="#4a5568" stroke-width="2" />
  <text x="600" y="205" class="label text-[10px]">Toilettes</text>
  
  <!-- 7 Doors on 3 walls -->
  <!-- Top wall (2 doors) -->
  <rect class="door" x="300" y="140" width="50" height="20" on:click={() => handleDoorClick(1)} />
  <rect class="door" x="450" y="140" width="50" height="20" on:click={() => handleDoorClick(2)} />
  
  <!-- Left wall (2 doors) -->
  <rect class="door" x="140" y="300" width="20" height="50" on:click={() => handleDoorClick(3)} />
  <rect class="door" x="140" y="450" width="20" height="50" on:click={() => handleDoorClick(4)} />
  
  <!-- Right wall (3 doors) -->
  <rect class="door" x="640" y="300" width="20" height="50" on:click={() => handleDoorClick(5)} />
  <rect class="door" x="640" y="425" width="20" height="50" on:click={() => handleDoorClick(6)} />
  <rect class="door" x="640" y="550" width="20" height="50" on:click={() => handleDoorClick(7)} />
  
</svg>
