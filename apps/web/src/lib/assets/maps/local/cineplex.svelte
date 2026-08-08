<script lang="ts">
  // Room interactions are not wired up yet. The elements keep their click
  // and keyboard affordances so the behaviour can be attached in one place
  // when it exists; until then this must not log on a public page.
  function handleElementClick(_elementId: string) {}
</script>

<svg
  viewBox="0 0 1000 800"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        stroke: #fffff0;
        stroke-width: 4;
        fill: none;
      }
      .zone {
        fill: rgba(255, 215, 0, 0.05);
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(255, 215, 0, 0.15);
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 16px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #ffd700;
        font-size: 12px;
        pointer-events: none;
        text-anchor: middle;
      }
      .counter {
        fill: #222;
        stroke: #666;
        stroke-width: 3;
      }
      .pillar {
        fill: #1a1a1a;
        stroke: #444;
        stroke-width: 4;
      }
      .screen-sign {
        fill: #111;
        stroke: #555;
        stroke-width: 2;
      }
      .seat-row {
        fill: #292929;
        stroke: #8b7c68;
        stroke-width: 2;
      }
      .ornate {
        fill: none;
        stroke: #8b7c68;
        stroke-width: 3;
      }
    </style>
  </defs>

  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">Cineplex (Multiplexe)</text>

  <g transform="translate(50, 80)">
    <!-- Left: Food & Drinks -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="0"
      y="100"
      width="250"
      height="300"
      onclick={() => handleElementClick('food-drinks')}
    />
    <rect x="0" y="200" width="250" height="60" class="counter" />
    <rect x="20" y="120" width="200" height="40" fill="#111" stroke="#333" />
    <text x="120" y="145" class="label text-yellow-500">FOOD & DRINKS</text>
    <rect x="20" y="170" width="200" height="30" fill="#050505" stroke="#333" />
    <!-- Menu board -->

    <!-- Right: Tickets -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="750"
      y="100"
      width="250"
      height="300"
      onclick={() => handleElementClick('tickets')}
    />
    <rect x="800" y="120" width="150" height="40" fill="#111" stroke="#333" />
    <text x="875" y="145" class="label text-blue-400">TICKETS</text>
    <rect x="800" y="200" width="150" height="60" class="counter" />
    <!-- Center Corridor leading to screens -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="350"
      y="150"
      width="300"
      height="350"
      onclick={() => handleElementClick('screens-corridor')}
    />

    <!-- Huge Movie Poster above corridor -->
    <rect x="350" y="50" width="300" height="80" class="screen-sign" />
    <text x="500" y="95" class="label text-red-500" font-size="24">THE THING</text>
    <text x="500" y="145" class="sublabel">SCREENS 1 - 8</text>

    <!-- Perspective Lines for Corridor -->
    <line x1="350" y1="150" x2="450" y2="300" stroke="#333" stroke-width="2" />
    <line x1="650" y1="150" x2="550" y2="300" stroke="#333" stroke-width="2" />
    <line x1="350" y1="500" x2="450" y2="300" stroke="#333" stroke-width="2" />
    <line x1="650" y1="500" x2="550" y2="300" stroke="#333" stroke-width="2" />
    <rect x="450" y="250" width="100" height="50" fill="#000" />
    <!-- End of hall -->

    <!-- Foreground Massive Pillar (Right side) -->
    <rect class="pillar" x="650" y="0" width="60" height="500" />
    <rect x="660" y="200" width="40" height="60" fill="#222" />
    <!-- Poster on pillar -->

    <!-- Seating Area (Center-Left Foreground) -->
    <path d="M 100 450 Q 200 500 300 450 L 280 400 Q 200 450 120 400 Z" class="counter" />
  </g>

  <!-- Ch. 393 pp. 60–61 shows one auditorium but never gives its screen number. -->
  <g transform="translate(80 610)">
    <rect
      x="0"
      y="0"
      width="840"
      height="155"
      rx="8"
      fill="#0d0d0d"
      stroke="#8b7c68"
      stroke-width="3"
    />
    <text x="420" y="24" class="label">Unidentified auditorium · panel-confirmed interior</text>
    <text x="420" y="43" class="sublabel"
      >Raked padded rows · coffered/ornate trim · framed posters above the doors</text
    >
    <rect x="34" y="63" width="150" height="70" fill="#080808" stroke="#777" stroke-width="3" />
    <text x="109" y="101" class="sublabel">PROJECTION SCREEN</text>
    {#each [0, 1, 2, 3, 4, 5] as row (row)}
      <rect x={230 + row * 82} y={66 + row * 8} width="64" height="58" rx="8" class="seat-row" />
      <line
        x1={238 + row * 82}
        y1={80 + row * 8}
        x2={286 + row * 82}
        y2={80 + row * 8}
        stroke="#555"
      />
    {/each}
    <path d="M220 54 H780 M230 54 Q500 12 770 54" class="ornate" />
    <rect x="784" y="64" width="28" height="68" fill="#171717" stroke="#666" />
    <rect x="780" y="49" width="36" height="13" fill="#222" stroke="#8b7c68" />
    <text x="798" y="145" class="sublabel">poster + door</text>
  </g>
</svg>
