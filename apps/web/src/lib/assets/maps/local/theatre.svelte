<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in Theatre`);
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
      .stage { fill: #221111; stroke: #800; stroke-width: 4; }
      .seat { fill: #800; stroke: #333; }
      .balcony { fill: #111; stroke: #666; stroke-width: 3; }
    </style>
  </defs>
  
  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">Theater (Tier 2)</text>

  <g transform="translate(50, 80)">
    <!-- Main Walls -->
    <rect x="0" y="0" width="900" height="500" class="wall" />
    
    <!-- Stage (Top) -->
    <rect class="zone" x="150" y="0" width="600" height="150" onclick={() => handleElementClick('stage')} />
    <path class="stage" d="M 150 0 L 750 0 L 750 120 Q 450 160 150 120 Z" />
    <text x="450" y="60" class="label">Stage</text>
    
    <!-- Screen -->
    <rect x="350" y="10" width="200" height="80" fill="#ddd" stroke="#333" stroke-width="2" />
    <text x="450" y="55" font-size="12" fill="#000" text-anchor="middle">Presentation</text>
    
    <!-- Presenter -->
    <circle cx="580" cy="80" r="15" fill="#fff" />
    
    <!-- Main Seating Area -->
    <rect class="zone" x="200" y="200" width="500" height="280" onclick={() => handleElementClick('seating')} />
    <g class="seats">
      {#each Array(8) as _, row}
        {#each Array(20) as _, col}
          <rect x="{220 + col * 23}" y="{220 + row * 30}" width="18" height="20" class="seat" rx="4" />
        {/each}
      {/each}
    </g>

    <!-- Side Balconies -->
    <rect class="zone balcony" x="0" y="150" width="120" height="300" onclick={() => handleElementClick('left-balcony')} />
    <text x="60" y="300" class="sublabel" transform="rotate(-90 60 300)">Left Balcony</text>
    
    <rect class="zone balcony" x="780" y="150" width="120" height="300" onclick={() => handleElementClick('right-balcony')} />
    <text x="840" y="300" class="sublabel" transform="rotate(90 840 300)">Right Balcony</text>

    <!-- Entrances -->
    <line x1="350" y1="500" x2="550" y2="500" stroke="#050505" stroke-width="12" />
    <text x="450" y="490" class="sublabel">Main Entrance</text>
  </g>
</svg>
