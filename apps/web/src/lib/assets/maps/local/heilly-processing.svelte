<script lang="ts">
  function handleDoorClick(n: number) {
    alert(`Door ${n} selected. Redirection may be random or fatal depending on Nen contamination.`)
  }
</script>

<svg viewBox="0 0 800 800" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .wall {
        stroke: #a0aec0;
        stroke-width: 6;
        fill: none;
      }
      .nen-reinforced {
        stroke: #9f7aea;
        stroke-dasharray: 10, 5;
        stroke-width: 8;
        fill: none;
      }
      .door {
        stroke: #ffd700;
        stroke-width: 6;
        fill: #2d3748;
        cursor: pointer;
        transition: stroke 0.2s;
      }
      .door:hover {
        stroke: #ff4444;
      }
      .zone {
        fill: #1a202c;
        stroke: #4a5568;
        stroke-width: 1;
        transition: fill 0.2s;
      }
      .zone:hover {
        fill: #2d3748;
      }
      .blood {
        fill: #742a2a;
        opacity: 0.6;
        pointer-events: none;
      }
      .label {
        fill: #e2e8f0;
        font-family: sans-serif;
        font-size: 14px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <text x="400" y="50" class="label" font-size="24">Heil-Ly Base: Processing Room</text>

  <!-- Main Room (Square) -->
  <rect x="150" y="150" width="500" height="500" class="zone" />
  <rect x="150" y="150" width="500" height="500" class="wall" />
  <rect x="145" y="145" width="510" height="510" class="nen-reinforced" />

  <text x="400" y="400" class="label text-[#9f7aea]">Heil-Ly processing / shower room</text>
  <text x="400" y="420" class="label text-xs text-gray-400">Spatially isolated hideout</text>

  <!-- Blood stains -->
  <path class="blood" d="M 300 300 Q 320 350, 350 320 T 400 300 Z" />
  <path class="blood" d="M 500 450 Q 480 500, 520 520 T 550 480 Z" />

  <!-- Toilettes séparées & Baignoire (Corners) -->
  <rect x="150" y="150" width="100" height="100" fill="#2d3748" stroke="#4a5568" stroke-width="2" />
  <text x="200" y="205" class="label text-[10px]">Shower / Wash Area</text>

  <rect x="550" y="150" width="100" height="100" fill="#2d3748" stroke="#4a5568" stroke-width="2" />
  <text x="600" y="205" class="label text-[10px]">Restrooms</text>

  <!-- Seven canonical doors: five together, one on the adjacent wall, one opposite. -->
  {#each [0, 1, 2, 3, 4] as i (i)}
    <rect
      role="button"
      tabindex="0"
      aria-label={`Inspect door ${i + 1}`}
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="door"
      x={210 + i * 80}
      y="140"
      width="50"
      height="20"
      onclick={() => handleDoorClick(i + 1)}
    />
  {/each}
  <rect
    role="button"
    tabindex="0"
    aria-label="Inspect door 6"
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    }}
    class="door"
    x="140"
    y="375"
    width="20"
    height="50"
    onclick={() => handleDoorClick(6)}
  />
  <rect
    role="button"
    tabindex="0"
    aria-label="Inspect door 7"
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    }}
    class="door"
    x="375"
    y="640"
    width="50"
    height="20"
    onclick={() => handleDoorClick(7)}
  />
</svg>
