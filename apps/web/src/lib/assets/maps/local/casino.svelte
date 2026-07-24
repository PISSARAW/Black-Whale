<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in VIP Casino`);
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .table { fill: #006600; stroke: #8b4513; stroke-width: 4; }
      .slot-machine { fill: #222; stroke: #ffcc00; stroke-width: 2; }
      .zone { fill: rgba(255, 215, 0, 0.05); transition: fill 0.2s; cursor: pointer; }
      .zone:hover { fill: rgba(255, 215, 0, 0.15); }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 16px; font-weight: bold; pointer-events: none; text-anchor: middle; }
      .character { fill: #888; stroke: #fff; stroke-width: 1; }
      .bunny { fill: #ff6699; stroke: #fff; stroke-width: 1; }
    </style>
  </defs>
  
  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">VIP Casino (Tier 1)</text>

  <g transform="translate(50, 80)">
    
    <!-- Left Area: Slot Machines -->
    <rect class="zone" x="0" y="0" width="300" height="500" onclick={() => handleElementClick('slot-machines')} />
    <text x="150" y="40" class="label text-yellow-500">Machines à Sous</text>
    
    {#each Array(4) as _, row}
      {#each Array(3) as _, col}
        <g transform="translate({40 + col * 80}, {80 + row * 100})">
          <rect x="0" y="0" width="50" height="70" class="slot-machine" />
          <rect x="10" y="10" width="30" height="30" fill="#111" />
          <circle cx="25" cy="55" r="5" fill="#f00" />
          <!-- Some random players -->
          {#if Math.random() > 0.5}
            <circle cx="25" cy="85" r="12" class="character" />
          {/if}
        </g>
      {/each}
    {/each}

    <!-- Center/Right Area: Poker Tables -->
    <rect class="zone" x="350" y="0" width="550" height="500" onclick={() => handleElementClick('poker-tables')} />
    <text x="625" y="40" class="label text-green-400">Tables de Poker (Variantes non-conventionnelles)</text>
    
    <!-- Table 1 -->
    <g transform="translate(450, 150)">
      <ellipse cx="100" cy="50" rx="80" ry="40" class="table" />
      <text x="100" y="55" class="label text-xs">Table 1</text>
      <!-- Dealer -->
      <circle cx="100" cy="0" r="12" class="character" fill="#111" />
      <!-- Players -->
      <circle cx="20" cy="50" r="15" class="character" />
      <circle cx="180" cy="50" r="15" class="character" />
      <circle cx="60" cy="100" r="15" class="character" />
      <circle cx="140" cy="100" r="15" class="character" />
    </g>

    <!-- Table 2 (Hisoka vs Bonolenov potential area) -->
    <g transform="translate(700, 300)">
      <ellipse cx="100" cy="50" rx="80" ry="40" class="table" />
      <text x="100" y="55" class="label text-xs">Table 2</text>
      <!-- Dealer -->
      <circle cx="100" cy="0" r="12" class="character" fill="#111" />
      
      <!-- Notable Players -->
      <circle cx="20" cy="50" r="15" fill="#ff99cc" stroke="#333" /> <!-- Hisoka stand-in -->
      <text x="20" y="25" class="label text-[10px] text-pink-500">Hisoka?</text>
      
      <circle cx="140" cy="100" r="15" fill="#cc9966" stroke="#333" /> <!-- Bonolenov stand-in -->
      <text x="140" y="130" class="label text-[10px] text-yellow-600">Bonolenov?</text>
    </g>

    <!-- Bunny Girls serving drinks -->
    <circle cx="350" cy="250" r="10" class="bunny" />
    <path d="M 345 240 L 340 225 L 348 235 Z" fill="#ff6699" />
    <path d="M 355 240 L 360 225 L 352 235 Z" fill="#ff6699" />
    
    <circle cx="600" cy="400" r="10" class="bunny" />
    <path d="M 595 390 L 590 375 L 598 385 Z" fill="#ff6699" />
    <path d="M 605 390 L 610 375 L 602 385 Z" fill="#ff6699" />

  </g>
</svg>
