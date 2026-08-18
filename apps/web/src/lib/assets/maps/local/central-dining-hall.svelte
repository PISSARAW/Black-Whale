<script lang="ts">
  /**
   * The Tier 5 refectory, drawn from `data/ship/blueprint.json`.
   *
   * It used to draw a toll being collected and the thugs collecting it. Who is
   * in the room is the marker layer's answer and it changes with the chapter;
   * what the room *is* is what ch. 377 draws — long low tables in rows, diners
   * seated directly on the deck, the raised platform among them, and the long service counter
   * under its menu boards with a line of fixed stools. The Buor toll of ch. 358
   * happens at the passage, which is where the label now sits instead.
   *
   * Every fixture is placed by the coordinates the blueprint gives it.
   */

  // Room interactions are not wired up yet. The elements keep their click
  // and keyboard affordances so the behaviour can be attached in one place
  // when it exists; until then this must not log on a public page.
  function handleElementClick(_elementId: string) {}

  function activate(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    ;(event.currentTarget as Element).dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }

  /** Twenty-five pixels to the metre, in the coordinates of the Tier 5 plan. */
  const SCALE = 25
  const x = (metres: number) => (metres - 14) * SCALE + 80
  const y = (metres: number) => (metres - 10.5) * SCALE + 100

  const room = { x0: 14, x1: 45.5, y0: 10.5, y1: 42 }

  /** The six low refectory boards; the panels show no benches. */
  const tables = [16.5, 19.5, 22.5, 37, 40, 43]
  const platform = { at: [29.75, 26.25], size: [9, 12] }
  const counter = { x0: 17, x1: 42.5, z0: 13.925, z1: 15.075 }
  const stools = Array.from({ length: 12 }, (_, index) => 18.1 + index * 2.1)
  const menuBoards = Array.from({ length: 6 }, (_, index) => 18.2 + index * 4.55)

  /** The four openings the tour derives from the shared walls. */
  const doors = [
    { id: 'transverse-corridor', axis: 'y' as const, at: 10.5, from: 28.25, to: 31.25 },
    { id: 'aft-corridor', axis: 'y' as const, at: 42, from: 28.25, to: 31.25 },
    { id: 'service-corridor-forward', axis: 'x' as const, at: 14, from: 24.75, to: 27.75 },
    { id: 'service-corridor-aft', axis: 'x' as const, at: 45.5, from: 24.75, to: 27.75 },
  ]
</script>

<svg
  viewBox="0 0 1000 900"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .room {
        fill: rgba(255, 255, 240, 0.03);
        stroke: #fffff0;
        stroke-width: 3;
      }
      .table {
        fill: rgba(217, 164, 65, 0.18);
        stroke: #d9a441;
        stroke-width: 1.5;
        cursor: pointer;
        transition: fill 0.2s;
      }
      .table:hover {
        fill: rgba(255, 215, 0, 0.35);
      }
      .platform {
        fill: rgba(255, 215, 0, 0.12);
        stroke: #ffd700;
        stroke-width: 2;
        cursor: pointer;
      }
      .counter {
        fill: rgba(157, 111, 70, 0.24);
        stroke: #c79a6b;
        stroke-width: 2;
      }
      .stool {
        fill: rgba(200, 200, 200, 0.18);
        stroke: #aaa;
        stroke-width: 1.5;
      }
      .menu {
        fill: rgba(255, 255, 240, 0.08);
        stroke: #d7d7c9;
        stroke-width: 1;
      }
      .door {
        stroke: #ffd700;
        stroke-width: 5;
        cursor: pointer;
      }
      .door:hover {
        stroke: #fff;
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 13px;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #ffd700;
        font-family: sans-serif;
        font-size: 11px;
        pointer-events: none;
        text-anchor: middle;
      }
      .vending {
        fill: rgba(200, 220, 255, 0.15);
        stroke: #8fb8e6;
        stroke-width: 1.5;
      }
      .bench {
        fill: rgba(180, 150, 120, 0.2);
        stroke: #a67c52;
        stroke-width: 1.5;
      }
    </style>
  </defs>

  <text x="500" y="34" class="label" font-size="22" font-weight="bold" fill="#FFD700">
    Central Dining Hall — Tier 5
  </text>
  <text x="500" y="56" class="label" font-size="11" opacity="0.55">
    31.5 m × 31.5 m — ch. 377: service counter, menu boards, stools and long communal tables
  </text>

  <rect
    x={x(room.x0)}
    y={y(room.y0)}
    width={(room.x1 - room.x0) * SCALE}
    height={(room.y1 - room.y0) * SCALE}
    class="room"
  />

  {#each doors as door (door.id)}
    <line
      role="button"
      tabindex="0"
      aria-label="Open the doors"
      onkeydown={activate}
      class="door"
      x1={door.axis === 'y' ? x(door.from) : x(door.at)}
      y1={door.axis === 'y' ? y(door.at) : y(door.from)}
      x2={door.axis === 'y' ? x(door.to) : x(door.at)}
      y2={door.axis === 'y' ? y(door.at) : y(door.to)}
      onclick={() => handleElementClick(door.id)}
    />
  {/each}

  <!-- The staffed wall counter and the fixed stools shown behind the crowd. -->
  <rect
    x={x(counter.x0)}
    y={y(counter.z0)}
    width={(counter.x1 - counter.x0) * SCALE}
    height={(counter.z1 - counter.z0) * SCALE}
    class="counter"
  />
  {#each stools as centre, index (index)}
    <circle cx={x(centre)} cy={y(16)} r={0.36 * SCALE} class="stool" />
  {/each}
  {#each menuBoards as centre, index (index)}
    <rect
      x={x(centre - 1.65)}
      y={y(10.72)}
      width={3.3 * SCALE}
      height={0.35 * SCALE}
      class="menu"
    />
  {/each}

  <!-- Franklin's isolated corner with vending machines (ch. 379-380) -->
  <rect x={x(14)} y={y(22)} width={0.8 * SCALE} height={3 * SCALE} class="vending" />
  <rect x={x(14)} y={y(25.2)} width={0.8 * SCALE} height={1.5 * SCALE} class="vending" />

  <rect x={x(14)} y={y(28)} width={0.6 * SCALE} height={2.5 * SCALE} class="seat" />
  <rect
    role="button"
    tabindex="0"
    aria-label="Inspect map area"
    onkeydown={activate}
    x={x(14.6)}
    y={y(28.25)}
    width={1.2 * SCALE}
    height={2 * SCALE}
    class="table"
    onclick={() => handleElementClick('franklin-table')}
  />

  <rect x={x(14)} y={y(31)} width={0.8 * SCALE} height={3.5 * SCALE} class="vending" />
  <text x={x(16.5)} y={y(29.4)} class="sublabel">Franklin's table · ch. 379</text>

  <rect
    role="button"
    tabindex="0"
    aria-label="Inspect map area"
    onkeydown={activate}
    class="platform"
    x={x(platform.at[0] - platform.size[0] / 2)}
    y={y(platform.at[1] - platform.size[1] / 2)}
    width={platform.size[0] * SCALE}
    height={platform.size[1] * SCALE}
    onclick={() => handleElementClick('platform')}
  />
  <text x={x(29.75)} y={y(26.6)} class="sublabel">Raised platform</text>

  {#each tables as centre, index (centre)}
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={activate}
      class="table"
      x={x(centre - 0.5)}
      y={y(15.25)}
      width={1 * SCALE}
      height={22 * SCALE}
      onclick={() => handleElementClick(`table-${index + 1}`)}
    />
  {/each}

  <text x={x(19.5)} y={y(14.05)} class="label" font-size="11">
    Six low boards · diners sit directly on the deck
  </text>
  <text x={x(29.75)} y={y(9.4)} class="sublabel"
    >Passage — the Buor take their toll here, ch. 358</text
  >
</svg>
