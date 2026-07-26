<script lang="ts">
  function handleTrapClick() {
    alert("Trap triggered! Teleporting to the Heil-Ly base (Processing Room).");
  }
</script>

<svg viewBox="0 0 800 600" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .wall { stroke: #FFFFF0; stroke-width: 4; fill: none; }
      .trap { stroke: #ff4444; stroke-width: 4; fill: none; cursor: pointer; }
      .zone { fill: #1a202c; stroke: #4a5568; stroke-width: 1; transition: fill 0.2s; }
      .zone:hover { fill: #2d3748; }
      .label { fill: #FFFFF0; font-family: sans-serif; font-size: 14px; font-weight: bold; pointer-events: none; text-anchor: middle; }
    </style>
  </defs>
  
  <text x="400" y="30" class="label" font-size="24">Room 3101 (First-Class Cabin)</text>
  
  <!-- Outer walls -->
  <rect x="200" y="100" width="400" height="400" class="wall" />
  
  <!-- Pièce principale -->
  <rect class="zone" x="200" y="100" width="400" height="400" />
  
  <text x="400" y="200" class="label">Living Area / Bedroom</text>
  <text x="400" y="220" class="label text-xs text-gray-400">Visual decoy</text>
  
  <!-- Porte d'entrée (Piège) -->
  <rect role="button" tabindex="0" aria-label="Inspect map area" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} class="trap" x="380" y="490" width="40" height="20" fill="#2d3748" onclick={handleTrapClick} />
  <text role="button" tabindex="0" aria-label="Open the main door" onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} x="400" y="535" class="label text-xs text-[#ff4444] cursor-pointer" onclick={handleTrapClick}>Main Door (Teleportation Trap)</text>
  
  <!-- Faux Mur de plomberie -->
  <rect x="400" y="350" width="200" height="150" fill="#2d3748" stroke="#718096" stroke-width="2" />
  <text x="500" y="425" class="label text-xs">Anomalous Bathroom</text>
  <text x="500" y="445" class="label text-[10px] text-[#ff4444]">(Former technical area)</text>
</svg>
