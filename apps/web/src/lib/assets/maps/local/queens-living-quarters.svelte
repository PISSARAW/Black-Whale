<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in Queens' Living Quarters`);
  }
</script>

<svg viewBox="0 0 800 600" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .wall { stroke: #FFFFF0; stroke-width: 4; fill: none; }
      .zone { fill: rgba(255, 215, 0, 0.05); transition: fill 0.2s; cursor: pointer; }
      .zone:hover { fill: rgba(255, 215, 0, 0.15); }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 16px; font-weight: bold; pointer-events: none; text-anchor: middle; }
      .sublabel { fill: #FFD700; font-size: 12px; pointer-events: none; text-anchor: middle; }
      .door { stroke: #FFD700; stroke-width: 4; }
      .furniture { fill: #222; stroke: #444; stroke-width: 2; }
    </style>
  </defs>

  <text x="400" y="40" class="label" font-size="28" fill="#FFD700">Queens' Living Quarters (Tier 1)</text>

  <g transform="translate(100, 100)">
    
    <!-- Assuming a layout similar to Princes but for the 8 Queens -->
    <rect x="0" y="0" width="600" height="400" class="wall" />
    
    <!-- Central Corridor -->
    <rect x="0" y="160" width="600" height="80" fill="rgba(255,255,255,0.02)" />
    <text x="300" y="205" class="sublabel text-gray-500">Queens' Private Corridor</text>

    <!-- 4 Queens on Top -->
    {#each Array(4) as _, i}
      <g transform="translate({10 + i * 145}, 10)">
        <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="zone" x="0" y="0" width="135" height="150" onclick={() => handleElementClick(`queen-room-top-${i}`)} />
        <rect x="0" y="0" width="135" height="150" class="wall" />
        <line class="door" x1="50" y1="150" x2="85" y2="150" /> <!-- Door -->
        
        {#if i === 0}
          <text x="67.5" y="75" class="label text-yellow-500">Room 01</text>
          <text x="67.5" y="95" class="sublabel text-yellow-200">Royal suite</text>
          <rect x="40" y="20" width="55" height="30" class="furniture" /> <!-- Bed -->
        {:else}
          <text x="67.5" y="75" class="label text-gray-400">Queen's Room</text>
        {/if}
      </g>
    {/each}

    <!-- 4 Queens on Bottom -->
    {#each Array(4) as _, i}
      <g transform="translate({10 + i * 145}, 240)">
        <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="zone" x="0" y="0" width="135" height="150" onclick={() => handleElementClick(`queen-room-bottom-${i}`)} />
        <rect x="0" y="0" width="135" height="150" class="wall" />
        <line class="door" x1="50" y1="0" x2="85" y2="0" /> <!-- Door -->
        
        <text x="67.5" y="75" class="label text-gray-400">Queen's Room</text>
      </g>
    {/each}

  </g>
</svg>
