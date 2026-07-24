<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in Area 37564`);
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .wall { stroke: #FFFFF0; stroke-width: 6; fill: none; }
      .zone { fill: rgba(255, 215, 0, 0.05); transition: fill 0.2s; cursor: pointer; }
      .zone:hover { fill: rgba(255, 215, 0, 0.15); }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 16px; font-weight: bold; pointer-events: none; text-anchor: middle; }
      .sublabel { fill: #FFD700; font-size: 12px; pointer-events: none; text-anchor: middle; }
      .chrollo { fill: #222; stroke: #fff; stroke-width: 2; }
      .passenger { fill: #555; stroke: #222; }
      .pillar { fill: #1a1a1a; stroke: #444; stroke-width: 4; }
    </style>
  </defs>
  
  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">Area 37564 (Tier 5 Assembly Point)</text>

  <g transform="translate(50, 80)">
    <!-- Huge Assembly Hall Walls -->
    <rect x="0" y="0" width="900" height="500" class="wall" />
    
    <!-- Signage on walls -->
    <text x="150" y="50" class="label text-gray-500" font-size="40" opacity="0.4">37564</text>
    <text x="750" y="50" class="label text-gray-500" font-size="40" opacity="0.4">37564</text>

    <!-- Massive support pillars -->
    <circle cx="200" cy="250" r="40" class="pillar" />
    <circle cx="700" cy="250" r="40" class="pillar" />
    
    <rect class="zone" x="0" y="0" width="900" height="500" onclick={() => handleElementClick('crowd')} />

    <!-- Chrollo sitting/standing near a pillar -->
    <g transform="translate(260, 260)">
      <circle cx="0" cy="0" r="18" class="chrollo" />
      <!-- Book (Bandit's Secret) -->
      <rect x="15" y="-10" width="12" height="20" fill="#800" stroke="#fcc" stroke-width="1" transform="rotate(20 15 -10)" />
      <text x="0" y="35" class="sublabel text-xs text-purple-400">Chrollo Lucilfer</text>
    </g>

    <!-- Dense crowd of Tier 5 passengers -->
    {#each Array(80) as _, i}
      <!-- Don't draw over Chrollo -->
      {#if Math.abs((Math.random() * 900) - 260) > 40 || Math.abs((Math.random() * 500) - 260) > 40}
        <circle 
          cx="{Math.random() * 860 + 20}" 
          cy="{Math.random() * 460 + 20}" 
          r="{Math.random() * 6 + 6}" 
          class="passenger" 
        />
      {/if}
    {/each}

  </g>
</svg>
