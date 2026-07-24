<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in Central Dining Hall`);
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .table { fill: #3e2723; stroke: #2d1815; stroke-width: 2; }
      .bench { fill: #2d1815; stroke: #1a0f0d; stroke-width: 2; }
      .zone { fill: rgba(255, 215, 0, 0.05); transition: fill 0.2s; cursor: pointer; }
      .zone:hover { fill: rgba(255, 215, 0, 0.15); }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 16px; font-weight: bold; pointer-events: none; text-anchor: middle; }
      .sublabel { fill: #FFD700; font-size: 12px; pointer-events: none; text-anchor: middle; }
      .passenger { fill: #555; stroke: #222; }
      .phantom { fill: #111; stroke: #800; stroke-width: 2; }
      .thug { fill: #2b6cb0; stroke: #1a365d; stroke-width: 2; }
      .wall { stroke: #666; stroke-width: 6; }
    </style>
  </defs>
  
  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">Central Dining Hall (Tier 5)</text>

  <g transform="translate(50, 80)">
    
    <!-- Passageway Controlled by Buor Family Thugs (Left side) -->
    <g id="passageway">
      <rect x="0" y="0" width="150" height="500" fill="#0a0a0a" stroke="#222" stroke-width="2" />
      <line class="wall" x1="150" y1="0" x2="150" y2="200" />
      <line class="wall" x1="150" y1="300" x2="150" y2="500" />
      
      <text x="75" y="100" class="label text-red-500">Passageway</text>
      <text x="75" y="120" class="sublabel text-[10px] text-gray-400">Toll: 5,000 Jenny</text>
      
      <!-- Buor Family Thugs -->
      <circle cx="120" cy="220" r="12" class="thug" />
      <circle cx="140" cy="250" r="12" class="thug" />
      <circle cx="120" cy="280" r="12" class="thug" />
      
      <!-- Subdued Thug (by Phantom Troupe) -->
      <line x1="110" y1="210" x2="130" y2="230" stroke="#f00" stroke-width="2" />
      <line x1="110" y1="230" x2="130" y2="210" stroke="#f00" stroke-width="2" />
      
      <text x="75" y="255" class="sublabel text-[10px] text-blue-400">Buor Thugs</text>
      <text x="75" y="270" class="sublabel text-[10px] text-red-500">(Subdued)</text>
    </g>

    <!-- Top section (Rows of tables receding into the distance) -->
    <rect class="zone" x="160" y="0" width="740" height="200" onclick={() => handleElementClick('background-tables')} />
    
    {#each Array(6) as _, row}
      {#each Array(3) as _, col}
        <g transform="translate({180 + col * 240}, {row * 30})">
          <rect x="10" y="0" width="180" height="15" class="table" />
          <rect x="0" y="20" width="200" height="5" class="bench" />
          <!-- Small dots for people -->
          {#each Array(8) as _, p}
            <circle cx="{20 + p * 20}" cy="-5" r="4" class="passenger" />
            <circle cx="{20 + p * 20}" cy="22" r="4" class="passenger" />
          {/each}
        </g>
      {/each}
    {/each}

    <!-- Central Focus Table (Foreground) -->
    <rect class="zone" x="250" y="250" width="500" height="200" onclick={() => handleElementClick('main-table')} />
    
    <rect x="350" y="280" width="300" height="80" class="table" />
    <rect x="330" y="250" width="340" height="20" class="bench" /> <!-- Top bench -->
    <rect x="330" y="370" width="340" height="20" class="bench" /> <!-- Bottom bench -->
    
    <!-- People at Main Table -->
    <!-- Top Bench (Facing us) -->
    <circle cx="380" cy="245" r="15" class="passenger" />
    <circle cx="500" cy="245" r="15" class="phantom" /> <!-- Phinks/Feitan/Nobunaga -->
    <circle cx="600" cy="245" r="15" class="phantom" /> 
    
    <!-- Bottom Bench (Backs to us) -->
    <circle cx="430" cy="385" r="15" class="passenger" />
    <circle cx="500" cy="385" r="15" class="passenger" />
    <circle cx="570" cy="385" r="15" class="passenger" />
    <circle cx="640" cy="385" r="20" class="phantom" /> <!-- Franklin -->
    <text x="640" y="420" class="sublabel text-[10px] text-red-500">Troupe Member</text>
    
    <!-- Huge crowd milling about in the negative space -->
    {#each Array(30) as _, i}
      <circle 
        cx="{160 + Math.random() * 740}" 
        cy="{Math.random() * 200 + 300}" 
        r="{Math.random() * 5 + 10}" 
        class="passenger" 
      />
    {/each}
  </g>
</svg>
