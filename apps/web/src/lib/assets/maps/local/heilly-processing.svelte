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
      .tile {
        stroke: #38424e;
        stroke-width: 1;
        opacity: 0.45;
      }
    </style>
  </defs>

  <text x="400" y="42" class="label" font-size="24">Heil-Ly Processing Room</text>
  <text x="400" y="67" class="label text-[11px] text-gray-400"
    >Ch. 398 pp. 158–167 · tiled room · Nen barrier inside the walls</text
  >

  <!-- Wide room proportions and dense square tile grid from the establishing panel. -->
  <rect x="100" y="200" width="600" height="300" class="zone" />
  <rect x="100" y="200" width="600" height="300" class="wall" />
  <rect x="95" y="195" width="610" height="310" class="nen-reinforced" />
  {#each [130, 160, 190, 220, 250, 280, 310, 340, 370, 400, 430, 460, 490, 520, 550, 580, 610, 640, 670] as x (x)}
    <line x1={x} y1="200" x2={x} y2="500" class="tile" />
  {/each}
  {#each [230, 260, 290, 320, 350, 380, 410, 440, 470] as y (y)}
    <line x1="100" y1={y} x2="700" y2={y} class="tile" />
  {/each}

  <text x="400" y="340" class="label text-[#9f7aea]">Heil-Ly processing room</text>
  <text x="400" y="360" class="label text-xs text-gray-400"
    >Four far-wall doors · one on each side · portal route behind the camera</text
  >

  <path class="blood" d="M 165 215 Q 175 250, 185 285 T 205 310 Z" />
  <path class="blood" d="M 520 420 Q 500 450, 535 465 T 575 445 Z" />

  <path
    d="M680 300 q-32 -35 -45 0 q-12 35 18 54 q32 18 35 -18"
    fill="none"
    stroke="#77a7b8"
    stroke-width="5"
  />
  <text x="624" y="380" class="label text-[10px]">coiled service hose</text>
  <circle cx="355" cy="430" r="12" fill="#111" stroke="#718096" stroke-width="3" />
  <circle cx="445" cy="430" r="12" fill="#111" stroke="#718096" stroke-width="3" />
  <text x="400" y="462" class="label text-[10px]">floor drains</text>

  <text x="400" y="700" class="label text-[11px] text-gray-400"
    >Door functions: 3 toilets · bath · shower cubicle · maintenance · portal route</text
  >

  <!-- Four doors on the far wall, one on each side, and the portal route behind camera. -->
  {#each [0, 1, 2, 3] as i (i)}
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
      x={155 + i * 155}
      y="190"
      width="60"
      height="20"
      onclick={() => handleDoorClick(i + 1)}
    />
  {/each}
  <rect
    role="button"
    tabindex="0"
    aria-label="Inspect door 5"
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    }}
    class="door"
    x="90"
    y="320"
    width="20"
    height="50"
    onclick={() => handleDoorClick(5)}
  />
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
    x="690"
    y="320"
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
    x="220"
    y="490"
    width="60"
    height="20"
    onclick={() => handleDoorClick(7)}
  />
</svg>
