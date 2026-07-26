<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in Central Police Station`);
  }
</script>

<svg viewBox="0 0 1000 700" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .wall { stroke: #FFFFF0; stroke-width: 6; fill: none; }
      .zone { fill: rgba(255, 215, 0, 0.05); transition: fill 0.2s; cursor: pointer; }
      .zone:hover { fill: rgba(255, 215, 0, 0.15); }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 16px; font-weight: bold; pointer-events: none; text-anchor: middle; }
      .sublabel { fill: #FFD700; font-size: 12px; pointer-events: none; text-anchor: middle; }
      .column { fill: #222; stroke: #555; stroke-width: 4; }
      .balcony { fill: rgba(255,255,255,0.05); stroke: #444; stroke-width: 2; }
      .furniture { fill: #333; stroke: #666; stroke-width: 2; }
    </style>
  </defs>
  
  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">Commissariat Central (Mizaistom)</text>

  <g transform="translate(50, 80)">
    
    <!-- Left Half: Main Atrium -->
    <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="zone" x="0" y="0" width="550" height="550" onclick={() => handleElementClick('main-atrium')} />
    <rect x="0" y="0" width="550" height="550" class="wall" />
    <text x="275" y="30" class="label text-blue-400">Main Atrium</text>

    <!-- Balconies (Sides) -->
    <rect class="balcony" x="0" y="50" width="100" height="400" />
    <rect class="balcony" x="450" y="50" width="100" height="400" />
    
    <!-- Massive Columns -->
    <rect class="column" x="120" y="50" width="40" height="400" />
    <rect class="column" x="390" y="50" width="40" height="400" />

    <!-- Central Fountain -->
    <ellipse cx="275" cy="350" rx="80" ry="40" class="furniture" />
    <ellipse cx="275" cy="340" rx="60" ry="30" fill="#222" stroke="#444" />
    <circle cx="275" cy="330" r="20" fill="#444" />
    <text x="275" y="360" class="sublabel text-gray-400">Fountain</text>
    
    <!-- Main Entrance Doors (Bottom) -->
    <line x1="200" y1="550" x2="350" y2="550" stroke="#050505" stroke-width="12" />
    <rect x="200" y="520" width="150" height="30" fill="none" stroke="#FFD700" stroke-width="3" />
    <text x="275" y="540" class="sublabel">Entrance</text>

    <!-- Guards -->
    <circle cx="180" cy="530" r="8" fill="#4a5568" />
    <circle cx="370" cy="530" r="8" fill="#4a5568" />

    <!-- Right Half: Community Safety Section -->
    <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="zone" x="600" y="0" width="300" height="300" onclick={() => handleElementClick('community-safety')} />
    <rect x="600" y="0" width="300" height="300" class="wall" />
    <text x="750" y="30" class="label text-green-400">Community Safety Section</text>
    
    <!-- Mizaistom's Desk -->
    <rect x="650" y="120" width="200" height="50" class="furniture" />
    
    <!-- Mizaistom (Cow Zodiac) -->
    <circle cx="750" cy="80" r="25" fill="#f5f5f5" stroke="#333" stroke-width="2" />
    <circle cx="730" cy="60" r="10" fill="#333" /> <!-- Ear/Horn -->
    <circle cx="770" cy="60" r="10" fill="#333" /> <!-- Ear/Horn -->
    <rect x="730" y="80" width="40" height="30" fill="#333" /> <!-- Suit -->
    <text x="750" y="70" font-size="10" fill="#111" text-anchor="middle">Mizaistom</text>
    
    <!-- Civilian / Visitor -->
    <circle cx="750" cy="200" r="15" fill="#ccc" />
    <rect x="735" y="215" width="30" height="20" fill="#666" />
    <text x="750" y="250" class="sublabel text-gray-500">Visitor</text>
    
    <!-- Standing Civilian -->
    <circle cx="650" cy="200" r="15" fill="#aaa" />
    <rect x="640" y="215" width="20" height="40" fill="#555" />

    <!-- Door -->
    <line x1="600" y1="250" x2="600" y2="280" stroke="#050505" stroke-width="8" />
    
  </g>
</svg>
