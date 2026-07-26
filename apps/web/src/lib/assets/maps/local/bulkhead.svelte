<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} at the Bulkhead`);
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .wall { stroke: #FFFFF0; stroke-width: 6; fill: none; }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 16px; font-weight: bold; pointer-events: none; text-anchor: middle; }
      .sublabel { fill: #FFD700; font-size: 12px; pointer-events: none; text-anchor: middle; }
      .bulkhead { fill: #222; stroke: #666; stroke-width: 10; }
      .caution { stroke: #ffcc00; stroke-width: 4; stroke-dasharray: 20 20; }
      .guard { fill: #4a5568; stroke: #2d3748; stroke-width: 2; cursor: pointer; }
    </style>
  </defs>
  
  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">Watertight Bulkhead (Tier 2/3)</text>
  <text x="500" y="70" class="sublabel text-red-500 font-bold">RESTRICTED ACCESS (Emergency opening from Tier 2 only)</text>

  <g transform="translate(50, 100)">
    <!-- Corridor Walls -->
    <line class="wall" x1="0" y1="0" x2="900" y2="0" />
    <line class="wall" x1="0" y1="400" x2="900" y2="400" />
    
    <!-- Tier 2 side -->
    <text x="200" y="200" class="label text-gray-500" font-size="24" opacity="0.5">Tier 2</text>
    
    <!-- Tier 3 side -->
    <text x="700" y="200" class="label text-gray-500" font-size="24" opacity="0.5">Tier 3</text>

    <!-- The Massive Bulkhead Door (Closed) -->
    <rect class="bulkhead" x="400" y="-10" width="100" height="420" />
    
    <!-- Heavy locking mechanisms -->
    <rect x="420" y="100" width="60" height="40" fill="#111" stroke="#444" stroke-width="3" />
    <rect x="420" y="260" width="60" height="40" fill="#111" stroke="#444" stroke-width="3" />
    
    <!-- Emergency Control Panel on Tier 2 Side -->
    <rect x="360" y="180" width="30" height="60" fill="#333" stroke="#f00" stroke-width="2" />
    <circle cx="375" cy="195" r="5" fill="#f00" />
    <circle cx="375" cy="215" r="5" fill="#0f0" />
    <text x="375" y="260" class="sublabel text-[9px] text-red-500">Emergency Open</text>
    <line x1="375" y1="240" x2="375" y2="250" stroke="#f00" stroke-width="1" />

    <!-- Caution lines on floor near bulkhead -->
    <line class="caution" x1="380" y1="0" x2="380" y2="400" />
    <line class="caution" x1="520" y1="0" x2="520" y2="400" />

    <!-- Guards (Kakin Royal Army) on Tier 2 side -->
    <!-- (There are 600 stationed on this tier, showing 2 here) -->
    <circle role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} cx="340" cy="150" r="15" class="guard" onclick={() => handleElementClick('guard-1')} />
    <circle role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} cx="340" cy="250" r="15" class="guard" onclick={() => handleElementClick('guard-2')} />
    
    <!-- Rifles -->
    <line x1="340" y1="150" x2="380" y2="150" stroke="#111" stroke-width="4" />
    <line x1="340" y1="250" x2="380" y2="250" stroke="#111" stroke-width="4" />
  </g>
</svg>
