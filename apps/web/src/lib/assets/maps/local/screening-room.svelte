<script lang="ts">
  // Room interactions are not wired up yet. The elements keep their click
  // and keyboard affordances so the behaviour can be attached in one place
  // when it exists; until then this must not log on a public page.
  function handleElementClick(_elementId: string) {}

  // Raked seating: eight rows widening away from the projection wall, the way
  // the chapter 359 cutaway draws the hall. Rows are generated rather than
  // written out so the curve stays regular.
  const rows = Array.from({ length: 8 }, (_, index) => ({
    y: 210 + index * 42,
    seats: 12 + index * 2,
  }))
</script>

<svg
  viewBox="0 0 1000 600"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
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
      .screen {
        fill: #0d1b2e;
        stroke: #8892b0;
        stroke-width: 3;
      }
      .stage {
        fill: #111;
        stroke: #444;
        stroke-width: 2;
      }
      .seat {
        fill: #222;
        stroke: #555;
        stroke-width: 1;
      }
      .aisle {
        fill: #050505;
      }
      .person {
        fill: #888;
        stroke: #555;
      }
    </style>
  </defs>

  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">Screening Room</text>
  <text x="500" y="60" class="sublabel">Tier 2 — salle de projection</text>

  <!-- Projection wall and the floor the presenter stands on -->
  <g
    role="button"
    tabindex="0"
    aria-label="Inspect projection stage"
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    }}
    onclick={() => handleElementClick('projection-stage')}
  >
    <rect class="zone" x="250" y="80" width="500" height="110" />
    <rect class="screen" x="280" y="85" width="440" height="70" rx="4" />
    <text x="500" y="128" class="sublabel" font-size="14">PROJECTION WALL</text>
    <rect class="stage" x="250" y="165" width="500" height="25" />
    <!-- The presenter, facing the rows -->
    <circle cx="500" cy="177" r="9" class="person" />
  </g>

  <!-- Raked seating, widening away from the wall -->
  <g
    role="button"
    tabindex="0"
    aria-label="Inspect seating rows"
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    }}
    onclick={() => handleElementClick('seating')}
  >
    <rect class="zone" x="120" y="200" width="760" height="360" />
    {#each rows as row (row.y)}
      {#each Array.from({ length: row.seats }, (_, seat) => seat) as seat (seat)}
        <rect
          class="seat"
          x={500 - (row.seats * 26) / 2 + seat * 26 + (seat >= row.seats / 2 ? 24 : 0)}
          y={row.y}
          width="20"
          height="22"
          rx="3"
        />
      {/each}
    {/each}
    <!-- Central aisle down to the stage -->
    <rect class="aisle" x="488" y="200" width="24" height="356" />
  </g>

  <text x="500" y="585" class="sublabel">ENTRANCE — TIER 2 CONCOURSE</text>
</svg>
