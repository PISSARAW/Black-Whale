<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in General Cabins`);
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .wall { stroke: #FFFFF0; stroke-width: 4; fill: none; }
      .zone { fill: rgba(255, 215, 0, 0.05); transition: fill 0.2s; cursor: pointer; }
      .zone:hover { fill: rgba(255, 215, 0, 0.15); }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 16px; font-weight: bold; pointer-events: none; text-anchor: middle; }
      .sublabel { fill: #FFD700; font-size: 12px; pointer-events: none; text-anchor: middle; }
      .guard { fill: #4a5568; stroke: #2d3748; stroke-width: 2; }
      .passenger { fill: #888; stroke: #555; }
      .door { stroke: #FFD700; stroke-width: 3; }
      .partition { stroke: #444; stroke-width: 4; stroke-dasharray: 10 10; fill: none; }
    </style>
  </defs>
  
  <text x="500" y="30" class="label" font-size="28" fill="#FFD700">General Passenger Area (Tier 3)</text>
  <text x="500" y="55" class="sublabel text-gray-500">Assembly Point (At least 5 sections: Area C, E...)</text>

  <g transform="translate(50, 80)">
    
    <!-- Central Corridor connecting to the area -->
    <rect class="zone" x="0" y="150" width="900" height="200" onclick={() => handleElementClick('main-corridor')} />
    <text x="450" y="250" class="label text-gray-500" font-size="24" opacity="0.3">Corridor Principal (Assembly Point)</text>

    <!-- Partitions between areas -->
    <line class="partition" x1="450" y1="0" x2="450" y2="500" />
    <text x="225" y="470" class="label text-blue-400">Area C</text>
    <text x="675" y="470" class="label text-blue-400">Area E</text>

    <!-- Top Cabins (Standard Single Cabins: bed, cupboards, shelves, bathroom) -->
    {#each Array(6) as _, i}
      <g transform="translate({i * 150}, 0)">
        <rect x="0" y="0" width="150" height="150" class="wall" />
        <rect class="zone" x="0" y="0" width="150" height="150" onclick={() => handleElementClick(`cabin-top-${i}`)} />
        <text x="75" y="50" class="sublabel text-gray-600">Standard Cabin</text>
        <text x="75" y="70" class="sublabel text-[9px] text-gray-500">(Bed, Cupboards, WC)</text>
        <line class="wall" x1="40" y1="150" x2="110" y2="150" /> <!-- Door frame -->
        <rect x="45" y="145" width="60" height="10" fill="#333" /> <!-- Door closed -->
      </g>
    {/each}

    <!-- Bottom Cabins (One Open) -->
    {#each Array(6) as _, i}
      <g transform="translate({i * 150}, 350)">
        <rect x="0" y="0" width="150" height="150" class="wall" />
        <rect class="zone" x="0" y="0" width="150" height="150" onclick={() => handleElementClick(`cabin-bottom-${i}`)} />
        <text x="75" y="50" class="sublabel text-gray-600">Standard Cabin</text>
        
        {#if i === 4}
          <!-- Open Door showing inside -->
          <line class="door" x1="40" y1="0" x2="40" y2="60" /> <!-- Door open inward -->
          <!-- Person sitting inside -->
          <circle cx="75" cy="50" r="15" fill="#aaa" />
          <text x="75" y="90" class="sublabel text-xs">Passenger</text>
        {:else}
          <line class="wall" x1="40" y1="0" x2="110" y2="0" /> <!-- Door frame -->
          <rect x="45" y="-5" width="60" height="10" fill="#333" /> <!-- Door closed -->
        {/if}
      </g>
    {/each}

    <!-- Large crowd of passengers blending in -->
    <g transform="translate(480, 160)">
      <text x="150" y="-10" class="label text-red-500" font-size="12">Noveau Riche & Deplorables blending</text>
      <!-- Draw many small circles for crowd -->
      {#each Array(40) as _, i}
        <circle 
          cx="{Math.random() * 300}" 
          cy="{Math.random() * 160 + 10}" 
          r="{Math.random() * 5 + 8}" 
          class="passenger" 
        />
      {/each}
      
      <!-- A few guards -->
      <circle cx="50" cy="80" r="12" class="guard" />
      <circle cx="280" cy="90" r="12" class="guard" />
    </g>
    
  </g>
</svg>
