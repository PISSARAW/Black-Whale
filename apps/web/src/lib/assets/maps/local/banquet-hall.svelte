<script lang="ts">
  /**
   * The Banquet Hall, drawn from `data/ship/blueprint.json`.
   *
   * The hall is the long room the ch. 349 deck plan cuts across the fore of
   * Tier 1: 157.5 m of it, 24.5 m deep, entered from the guarded vestibule that
   * runs its whole length. What stands in it is what the panels show — the
   * stage at the head, the throne on its dais before it, the round tables in
   * rows with an aisle left open on the throne's axis, and the buffet counters
   * at the far end. No dimension is invented here: `x()` and `y()` map the
   * blueprint's metres into this viewBox, and every fixture is placed by the
   * coordinates the blueprint gives it, so the plan and the tour cannot drift
   * apart the way they had.
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

  /** Six pixels to the metre, with the vestibule's fore wall at the origin. */
  const SCALE = 6
  const x = (metres: number) => (metres + 87.5) * SCALE + 28
  const y = (metres: number) => (metres + 35) * SCALE + 96

  // The hall and the vestibule, as the footprints give them.
  const hall = { x0: -87.5, x1: 46, y0: -28, y1: -3.5 }
  // The end the buffet is laid in is a step down from the floor the tables
  // stand on, ch. 383, and a room of its own for that reason: a footprint has
  // one height. Its ceiling is raised by the depth of the step, so the ceiling
  // runs level over both.
  const serviceEnd = { x0: 46, x1: 70, step: -0.6 }
  const vestibule = { y0: -35, y1: -28 }

  // The four table rows, an aisle between the second and the third, and the
  // eighteen columns they run in: the same grid the blueprint lays.
  const rows = [-24.5, -19.5, -12, -7]
  const columns = Array.from({ length: 18 }, (_, index) => -58 + index * 6)
  const TABLE_RADIUS = 1.3

  // The raised galleries down both side walls, ch. 359, broken where the doors
  // of the hall are: the same runs the blueprint stands.
  const galleries = [
    {
      at: -4.55,
      runs: [
        [-76, -54.25],
        [-47.25, 7],
        [14, 37],
      ],
    },
    {
      at: -26.95,
      runs: [
        [-76, -24.24],
        [-17.25, 45.89],
      ],
    },
  ]

  /** Openings the tour derives from the shared walls, at their own width. */
  const doors = [
    { id: 'vestibule-doors', axis: 'y' as const, at: -28, from: -22.25, to: -19.25 },
    { id: 'vestibule-doors-service', axis: 'y' as const, at: -28, from: 56.5, to: 59.5 },
    { id: 'main-corridor', axis: 'y' as const, at: -3.5, from: -52.25, to: -49.25 },
    { id: 'princes-gate', axis: 'y' as const, at: -3.5, from: 9, to: 12 },
    { id: 'main-corridor-starboard', axis: 'y' as const, at: -3.5, from: 39, to: 42 },
    { id: 'main-corridor-starboard-service', axis: 'y' as const, at: -3.5, from: 56.5, to: 59.5 },
    { id: 'starboard-corridor', axis: 'x' as const, at: 70, from: -17.25, to: -14.25 },
  ]
</script>

<svg
  viewBox="0 0 1000 320"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        stroke: #fffff0;
        stroke-width: 3;
        fill: none;
      }
      .room {
        fill: rgba(255, 255, 240, 0.03);
      }
      .vestibule {
        fill: rgba(255, 255, 240, 0.015);
        stroke: #fffff0;
        stroke-width: 2;
        stroke-opacity: 0.5;
      }
      .stage {
        fill: rgba(139, 69, 19, 0.25);
        stroke: #8b4513;
        stroke-width: 2;
      }
      .throne-platform {
        fill: rgba(255, 215, 0, 0.12);
        stroke: #ffd700;
        stroke-width: 2;
      }
      .gallery {
        fill: rgba(255, 255, 240, 0.07);
        stroke: #fffff0;
        stroke-width: 1.5;
        stroke-opacity: 0.6;
      }
      .pier {
        fill: rgba(139, 69, 19, 0.35);
        stroke: #8b4513;
        stroke-width: 1.5;
      }
      .buffet {
        fill: rgba(200, 200, 200, 0.15);
        stroke: #aaa;
        stroke-width: 2;
      }
      .table {
        fill: rgba(255, 255, 255, 0.08);
        stroke: #666;
        stroke-width: 1;
        cursor: pointer;
        transition:
          fill 0.2s,
          stroke 0.2s;
      }
      .table:hover {
        fill: rgba(255, 215, 0, 0.3);
        stroke: #ffd700;
      }
      .interactive {
        cursor: pointer;
      }
      .door {
        stroke: #ffd700;
        stroke-width: 4;
        cursor: pointer;
      }
      .door:hover {
        stroke: #fff;
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 11px;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #ffd700;
        font-family: sans-serif;
        font-size: 10px;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <text x="500" y="30" class="label" font-size="22" font-weight="bold" fill="#FFD700">
    Banquet Hall
  </text>
  <text x="500" y="48" class="label" font-size="10" fill="#FFFFF0" opacity="0.55">
    133.5 m × 24.5 m, plus its service end — Tier 1, ch. 349 deck plan
  </text>

  <!-- The guarded vestibule the hall is entered from, ch. 383 -->
  <rect
    x={x(hall.x0)}
    y={y(vestibule.y0)}
    width={(hall.x1 - hall.x0) * SCALE}
    height={(vestibule.y1 - vestibule.y0) * SCALE}
    class="vestibule"
  />
  <text x={x(-40)} y={y(-31.2)} class="label" font-size="10" opacity="0.7">Vestibule</text>
  <!-- The stair up from Tier 2 -->
  <line x1={x(7.25)} y1={y(vestibule.y0)} x2={x(10.25)} y2={y(vestibule.y0)} class="door" />
  <text x={x(8.75)} y={y(-36.2)} class="sublabel">Tier 2</text>

  <!-- The hall itself -->
  <rect
    x={x(hall.x0)}
    y={y(hall.y0)}
    width={(hall.x1 - hall.x0) * SCALE}
    height={(hall.y1 - hall.y0) * SCALE}
    class="room wall"
  />

  <!-- The service end, a step below the floor the tables stand on -->
  <rect
    role="button"
    tabindex="0"
    aria-label="Inspect map area"
    onkeydown={activate}
    class="room wall interactive"
    x={x(serviceEnd.x0)}
    y={y(hall.y0)}
    width={(serviceEnd.x1 - serviceEnd.x0) * SCALE}
    height={(hall.y1 - hall.y0) * SCALE}
    onclick={() => handleElementClick('service-end')}
  />
  <text x={x(58)} y={y(-30.5)} class="sublabel">−0,6 m</text>
  <!-- The step itself: the whole depth of the hall is open across it -->
  {#each [0, 0.5, 1] as offset (offset)}
    <line
      x1={x(serviceEnd.x0 + offset)}
      y1={y(hall.y0)}
      x2={x(serviceEnd.x0 + offset)}
      y2={y(hall.y1)}
      class="gallery"
      stroke="#FFFFF0"
      stroke-opacity="0.35"
    />
  {/each}

  <!-- The openings, cut out of the walls they are derived from -->
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

  <!-- Stage, at the head of the hall and across its whole depth -->
  <rect
    role="button"
    tabindex="0"
    aria-label="Inspect map area"
    onkeydown={activate}
    class="stage interactive"
    x={x(-86)}
    y={y(-25.75)}
    width={7 * SCALE}
    height={20 * SCALE}
    onclick={() => handleElementClick('stage')}
  />
  <text x={x(-82.5)} y={y(-15.75)} class="label" transform="rotate(-90 {x(-82.5)} {y(-15.75)})"
    >Stage</text
  >

  <!-- The galleries down both side walls, and the piers framing the stage -->
  {#each galleries as gallery (gallery.at)}
    {#each gallery.runs as run (run[0])}
      <rect
        x={x(run[0])}
        y={y(gallery.at - 1)}
        width={(run[1] - run[0]) * SCALE}
        height={2 * SCALE}
        class="gallery"
      />
    {/each}
  {/each}
  {#each [-23.75, -7.75] as pier (pier)}
    <rect x={x(-78.7)} y={y(pier - 2)} width={2.4 * SCALE} height={4 * SCALE} class="pier" />
  {/each}

  <!-- The throne on its dais, facing the hall -->
  <rect
    role="button"
    tabindex="0"
    aria-label="Inspect map area"
    onkeydown={activate}
    class="throne-platform interactive"
    x={x(-72.25)}
    y={y(-19.75)}
    width={6 * SCALE}
    height={8 * SCALE}
    onclick={() => handleElementClick('throne-dais')}
  />
  <rect
    x={x(-70.5)}
    y={y(-17.25)}
    width={2.5 * SCALE}
    height={3 * SCALE}
    fill="none"
    stroke="#FFD700"
    stroke-width="1.5"
  />
  <!-- Its draped parapet, and the steps down from it into the hall -->
  <rect
    x={x(-66.7)}
    y={y(-19.55)}
    width={0.4 * SCALE}
    height={7.6 * SCALE}
    class="throne-platform"
  />
  <rect x={x(-66.2)} y={y(-20.75)} width={0.95 * SCALE} height={10 * SCALE} class="gallery" />
  <text x={x(-69.25)} y={y(-21)} class="sublabel">King's Throne</text>

  <!-- The tables, four rows with the throne's axis left open between them -->
  <g class="tables">
    {#each rows as row, rowIndex (row)}
      {#each columns as column, columnIndex (column)}
        <circle
          role="button"
          tabindex="0"
          aria-label="Inspect map area"
          onkeydown={activate}
          class="table"
          cx={x(column)}
          cy={y(row)}
          r={TABLE_RADIUS * SCALE}
          onclick={() => handleElementClick(`table-${rowIndex}-${columnIndex}`)}
        />
      {/each}
    {/each}
  </g>

  <!-- The buffet the hall is served from, ch. 383 -->
  {#each [-22, -9.5] as centre, index (centre)}
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={activate}
      class="buffet interactive"
      x={x(49)}
      y={y(centre - 1.1)}
      width={14 * SCALE}
      height={2.2 * SCALE}
      onclick={() => handleElementClick(`buffet-${index + 1}`)}
    />
  {/each}
  <!-- The line the buffet is dressed from, behind each counter -->
  {#each [-25.2, -7.2] as line (line)}
    <rect x={x(49)} y={y(line - 0.6)} width={14 * SCALE} height={1.2 * SCALE} class="buffet" />
  {/each}
  <rect x={x(68.7)} y={y(-25)} width={0.6 * SCALE} height={6 * SCALE} class="buffet" />
  <text x={x(56)} y={y(-15)} class="label" font-size="10">Buffet</text>
</svg>
