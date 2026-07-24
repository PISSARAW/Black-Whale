<script lang="ts">
  function handleTrapClick() {
    alert("Piège déclenché ! Téléportation vers la base Heil-Ly (Salle de traitement).");
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
  
  <text x="400" y="30" class="label" font-size="24">Chambre 3101 (Cabine 1ère Classe)</text>
  
  <!-- Outer walls -->
  <rect x="200" y="100" width="400" height="400" class="wall" />
  
  <!-- Pièce principale -->
  <rect class="zone" x="200" y="100" width="400" height="400" />
  
  <text x="400" y="200" class="label">Séjour / Chambre</text>
  <text x="400" y="220" class="label text-xs text-gray-400">Leurre visuel</text>
  
  <!-- Porte d'entrée (Piège) -->
  <rect class="trap" x="380" y="490" width="40" height="20" fill="#2d3748" onclick={handleTrapClick} />
  <text x="400" y="535" class="label text-xs text-[#ff4444] cursor-pointer" onclick={handleTrapClick}>Porte principale (Piège de téléportation)</text>
  
  <!-- Faux Mur de plomberie -->
  <rect x="400" y="350" width="200" height="150" fill="#2d3748" stroke="#718096" stroke-width="2" />
  <text x="500" y="425" class="label text-xs">Salle de bain anormale</text>
  <text x="500" y="445" class="label text-[10px] text-[#ff4444]">(Ancienne zone technique)</text>
</svg>
