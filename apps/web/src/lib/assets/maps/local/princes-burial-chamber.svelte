<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in Princes' Burial Chamber`);
  }
</script>

<svg viewBox="0 0 800 800" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .wall { stroke: #FFFFF0; stroke-width: 6; fill: none; }
      .zone { fill: rgba(255, 215, 0, 0.05); transition: fill 0.2s; cursor: pointer; }
      .zone:hover { fill: rgba(255, 215, 0, 0.15); }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 16px; font-weight: bold; pointer-events: none; text-anchor: middle; }
      .sublabel { fill: #FFD700; font-size: 12px; pointer-events: none; text-anchor: middle; }
      .casket { fill: #111; stroke: #FFD700; stroke-width: 2; }
      .casket-occupied { fill: #311; stroke: #f00; stroke-width: 3; }
      .light { fill: #444; }
      .light-on { fill: #f00; filter: drop-shadow(0 0 5px #f00); }
      .capsule { fill: #222; stroke: #888; stroke-width: 4; }
      .pot { fill: #422; stroke: #864; stroke-width: 2; }
      .rune { stroke: #FFD700; stroke-width: 1; fill: none; opacity: 0.3; }
    </style>
  </defs>

  <text x="400" y="40" class="label" font-size="28" fill="#FFD700">Princes' Burial Chamber</text>
  
  <g transform="translate(100, 100)">
    <!-- Circular Room outline -->
    <circle cx="300" cy="300" r="280" class="wall" />
    <circle cx="300" cy="300" r="270" fill="none" stroke="#333" stroke-width="2" />
    
    <!-- Giant Greed Island style runes on floor -->
    <circle cx="300" cy="300" r="200" class="rune" />
    <circle cx="300" cy="300" r="100" class="rune" />
    <path d="M 300 100 L 473 200 L 473 400 L 300 500 L 127 400 L 127 200 Z" class="rune" />
    <path d="M 300 200 L 386 250 L 386 350 L 300 400 L 214 350 L 214 250 Z" class="rune" />

    <!-- Central Capsule -->
    <circle role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="zone" cx="300" cy="300" r="50" onclick={() => handleElementClick('central-capsule')} />
    <circle cx="300" cy="300" r="40" class="capsule" />
    <circle cx="300" cy="300" r="30" fill="#111" />
    <circle cx="300" cy="300" r="10" fill="#FFD700" opacity="0.5" />

    <!-- 2 Pots near capsule -->
    <circle cx="230" cy="300" r="15" class="pot" />
    <circle cx="370" cy="300" r="15" class="pot" />

    <!-- 14 Caskets around the perimeter -->
    {#each Array(14) as _, i}
      <g transform="translate(300, 300) rotate({i * (360 / 14)}) translate(0, -220)">
        <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }}
          x="-15" 
          y="-30" 
          width="30" 
          height="60" 
          class="casket" 
          onclick={() => handleElementClick(`casket-${i}`)}
          cursor="pointer"
        />
        <!-- Indicator Light between casket and center -->
        <circle cx="0" cy="45" r="5" class="light" />
      </g>
    {/each}

  </g>
</svg>
