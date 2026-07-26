<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in Observation Deck`);
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .window-frame { fill: #111; stroke: #333; stroke-width: 8; }
      .sky { fill: qradial-gradient(cx 0.5 cy 0.5 r 0.5 fx 0.5 fy 0.5, #334, #001); }
      .city-block { fill: #2a2a35; stroke: #111; stroke-width: 1; }
      .city-light { fill: #FFD700; opacity: 0.6; }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 16px; font-weight: bold; pointer-events: none; text-anchor: middle; }
    </style>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#445" />
      <stop offset="100%" stop-color="#112" />
    </linearGradient>
  </defs>

  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">Observation Deck (Tier 4)</text>

  <g transform="translate(0, 80)">
    <!-- The View (Sky + Cityscape) -->
    <rect x="50" y="50" width="900" height="400" fill="url(#skyGrad)" />
    
    <!-- Horizon Line -->
    <line x1="50" y1="200" x2="950" y2="200" stroke="#88a" stroke-width="2" />
    <text x="500" y="190" fill="#fff" opacity="0.5" font-size="12" text-anchor="middle">Horizon</text>

    <!-- Generating random city blocks to simulate the massive slums/city -->
    <g transform="translate(50, 200)">
      {#each Array(200) as _, i}
        <rect 
          class="city-block"
          x="{Math.random() * 900}" 
          y="{Math.random() * 200}" 
          width="{Math.random() * 30 + 10}" 
          height="{Math.random() * 20 + 10}" 
        />
        {#if Math.random() > 0.7}
          <rect 
            class="city-light"
            x="{Math.random() * 900}" 
            y="{Math.random() * 200}" 
            width="2" 
            height="2" 
          />
        {/if}
      {/each}
      <!-- Some larger structures -->
      <rect class="city-block" x="200" y="100" width="80" height="60" />
      <rect class="city-block" x="600" y="120" width="100" height="40" />
      <rect class="city-block" x="400" y="50" width="150" height="80" />
    </g>

    <!-- The Massive Window Frame (Foreground) -->
    <path class="window-frame" d="M 0 0 L 1000 0 L 1000 500 L 0 500 Z M 50 50 L 50 450 L 950 450 L 950 50 Z" />
    
    <!-- Diagonal Support Pillars -->
    <path class="window-frame" d="M 200 50 L 150 450 L 120 450 L 170 50 Z" />
    <path class="window-frame" d="M 800 50 L 850 450 L 880 450 L 830 50 Z" />
    
    <!-- Top curved overhang -->
    <path fill="#111" d="M 50 50 Q 500 120 950 50 L 950 0 L 50 0 Z" />

    <!-- Clickable transparent overlay over the window -->
    <rect role="button" tabindex="0" aria-label="Inspect the cityscape" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} x="200" y="100" width="600" height="300" fill="transparent" cursor="pointer" onclick={() => handleElementClick('cityscape')} />
  </g>
</svg>
