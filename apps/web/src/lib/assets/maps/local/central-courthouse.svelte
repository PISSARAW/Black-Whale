<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in Central Courthouse`);
  }
</script>

<svg viewBox="0 0 800 600" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .wall { stroke: #FFFFF0; stroke-width: 6; fill: none; }
      .zone { fill: rgba(255, 215, 0, 0.05); transition: fill 0.2s; cursor: pointer; }
      .zone:hover { fill: rgba(255, 215, 0, 0.15); }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 16px; font-weight: bold; pointer-events: none; text-anchor: middle; }
      .sublabel { fill: #FFD700; font-size: 12px; pointer-events: none; text-anchor: middle; }
      .furniture { fill: #222; stroke: #666; stroke-width: 3; }
      .botobai { fill: #800; stroke: #a00; stroke-width: 2; }
    </style>
  </defs>
  
  <text x="400" y="40" class="label" font-size="28" fill="#FFD700">Tribunal Central</text>

  <g transform="translate(50, 80)">
    <!-- Room Walls -->
    <rect x="0" y="0" width="700" height="500" class="wall" />
    
    <!-- Judge's Dais (Top) -->
    <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="zone" x="200" y="0" width="300" height="200" onclick={() => handleElementClick('judges-bench')} />
    <rect x="220" y="120" width="260" height="60" class="furniture" /> <!-- Bench -->
    
    <!-- Botobai Gigante -->
    <rect x="310" y="20" width="80" height="100" class="botobai" /> <!-- Giant Chair -->
    <circle cx="350" cy="50" r="15" fill="#fcc" /> <!-- Botobai's head -->
    <path d="M 335 40 Q 350 20 365 40" fill="none" stroke="#f00" stroke-width="3" /> <!-- Horns/Hair -->
    <rect x="320" y="70" width="60" height="50" class="botobai" /> <!-- Body -->
    
    <text x="350" y="160" class="label text-white">Botobai Gigante</text>
    <text x="350" y="175" class="sublabel">Zodiac (Dragon)</text>
    
    <!-- Clerk's Desk (Right) -->
    <rect x="550" y="180" width="100" height="60" class="furniture" />
    <circle cx="600" cy="160" r="12" fill="#ddd" />
    <text x="600" y="220" class="sublabel">Clerks</text>
    
    <!-- Defendant's Stand (Center) -->
    <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="zone" x="300" y="300" width="100" height="100" onclick={() => handleElementClick('defendant-stand')} />
    <rect x="310" y="310" width="80" height="40" class="furniture" />
    <circle cx="350" cy="370" r="12" fill="#ddd" /> <!-- Defendant -->
    <line x1="335" y1="380" x2="365" y2="380" stroke="#fff" stroke-width="2" /> <!-- Hands bound -->
    <text x="350" y="340" class="label text-gray-400">Defendant</text>

    <!-- Armed Guards -->
    <circle cx="150" cy="350" r="15" fill="#4a5568" /> <!-- Guard Left -->
    <line x1="150" y1="320" x2="160" y2="280" stroke="#111" stroke-width="4" /> <!-- Rifle -->
    
    <circle cx="550" cy="350" r="15" fill="#4a5568" /> <!-- Guard Right -->
    <line x1="550" y1="320" x2="540" y2="280" stroke="#111" stroke-width="4" /> <!-- Rifle -->
    
    <text x="150" y="385" class="sublabel text-gray-500">Kakin Army</text>
    <text x="550" y="385" class="sublabel text-gray-500">Kakin Army</text>
    
    <!-- Prosecutor / Attorney (Front right) -->
    <circle cx="500" cy="450" r="12" fill="#ddd" />
    <rect x="490" y="470" width="20" height="10" fill="#fff" /> <!-- Document -->
    <text x="500" y="495" class="sublabel">Prosecutor</text>
    
  </g>
</svg>
