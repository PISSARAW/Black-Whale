<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in VIP Detention Area`);
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .wall { stroke: #FFFFF0; stroke-width: 6; fill: none; }
      .bars { stroke: #999; stroke-width: 3; fill: none; stroke-dasharray: 4,8; }
      .zone { fill: rgba(255, 215, 0, 0.05); transition: fill 0.2s; cursor: pointer; }
      .zone:hover { fill: rgba(255, 215, 0, 0.15); }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 16px; font-weight: bold; pointer-events: none; text-anchor: middle; }
      .sublabel { fill: #FFD700; font-size: 12px; pointer-events: none; text-anchor: middle; }
      .furniture { stroke: #666; stroke-width: 2; fill: rgba(100,100,100,0.2); pointer-events: none; }
    </style>
  </defs>
  
  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">V.I.P. Detention Area</text>

  <g transform="translate(50, 80)">
    <!-- Outer boundary -->
    <rect x="0" y="0" width="900" height="500" class="wall" />

    <!-- Prison Corridor (Center Horizontal) -->
    <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="zone" x="0" y="200" width="900" height="100" onclick={() => handleElementClick('prison-corridor')} />
    <text x="450" y="255" class="label text-gray-500">Prison Corridor</text>
    
    <!-- Guard Desk (Left end of corridor) -->
    <rect x="20" y="220" width="60" height="60" fill="#222" stroke="#444" />
    <circle cx="50" cy="250" r="15" fill="#4a5568" /> <!-- Sleeping guard -->
    <text x="50" y="295" class="sublabel text-xs">Guard Desk</text>
    <text x="80" y="240" class="sublabel text-xs">zZz</text>

    <!-- Top Cells (VIP - Camilla) -->
    <!-- Camilla's Cell -->
    <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="zone" x="150" y="0" width="250" height="200" onclick={() => handleElementClick('camilla-cell')} />
    <line class="wall" x1="400" y1="0" x2="400" y2="200" />
    <line class="bars" x1="150" y1="200" x2="400" y2="200" /> <!-- Bars facing corridor -->
    <text x="275" y="40" class="label text-purple-400">Camilla's Cell (First Class)</text>
    <!-- Bed -->
    <rect x="170" y="50" width="100" height="140" class="furniture" />
    <!-- Sink/Toilet -->
    <rect x="330" y="50" width="40" height="40" class="furniture" />
    <circle cx="350" cy="120" r="15" class="furniture" />

    <!-- Empty VIP Cell -->
    <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="zone" x="400" y="0" width="250" height="200" onclick={() => handleElementClick('empty-vip-cell')} />
    <line class="wall" x1="650" y1="0" x2="650" y2="200" />
    <line class="bars" x1="400" y1="200" x2="650" y2="200" />
    <text x="525" y="40" class="label text-gray-500">Empty VIP Cell</text>

    <!-- Bottom Cells (Standard / Bodyguards - Tuffdy) -->
    <!-- Tuffdy's Cell -->
    <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="zone" x="250" y="300" width="150" height="200" onclick={() => handleElementClick('tuffdy-cell')} />
    <line class="wall" x1="400" y1="300" x2="400" y2="500" />
    <line class="bars" x1="250" y1="300" x2="400" y2="300" /> <!-- Bars facing corridor -->
    <text x="325" y="480" class="label text-blue-400">Tuffdy's Cell</text>
    <!-- Bed -->
    <rect x="270" y="320" width="70" height="130" class="furniture" />
    <!-- Sink/Toilet -->
    <rect x="360" y="420" width="30" height="20" class="furniture" />
    <circle cx="375" cy="350" r="12" class="furniture" />

    <!-- Another Standard Cell -->
    <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="zone" x="400" y="300" width="150" height="200" onclick={() => handleElementClick('standard-cell-2')} />
    <line class="wall" x1="550" y1="300" x2="550" y2="500" />
    <line class="bars" x1="400" y1="300" x2="550" y2="300" />
    <text x="475" y="480" class="label text-gray-500">Cell</text>

  </g>
</svg>
