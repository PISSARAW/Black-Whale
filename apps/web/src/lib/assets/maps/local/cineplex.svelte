<script lang="ts">
  // Room interactions are not wired up yet. The elements keep their click
  // and keyboard affordances so the behaviour can be attached in one place
  // when it exists; until then this must not log on a public page.
  function handleElementClick(_elementId: string) {}
</script>

<svg
  viewBox="0 0 1000 600"
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
      .person {
        fill: #888;
        stroke: #555;
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

    <!-- Workers behind counter -->
    <circle cx="80" cy="190" r="10" class="person" />
    <circle cx="180" cy="190" r="10" class="person" />

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
    <!-- Workers -->
    <circle cx="840" cy="190" r="10" class="person" />
    <circle cx="910" cy="190" r="10" class="person" />

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

    <!-- Passengers hanging out -->
    <circle cx="150" cy="420" r="15" class="person" />
    <circle cx="250" cy="420" r="15" class="person" />
    <circle cx="200" cy="440" r="15" class="person" />

    <circle cx="280" cy="300" r="12" class="person" />
    <circle cx="780" cy="320" r="12" class="person" />
  </g>
</svg>
