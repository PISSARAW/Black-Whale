<script lang="ts">
  /**
   * The Cha-R-controlled hold, drawn from `data/ship/blueprint.json`.
   *
   * The plan gives it one entrance, centred on the aft wall, with four guard
   * posts on it and a camera watching it — and rows of crates in the bays
   * between. All of that stands in the walk; this plan places it by the same
   * coordinates rather than by eye, so the two cannot drift.
   */

  // Area inspection is not wired up yet; the keyboard and click affordances
  // stay so the behaviour can be attached in one place when it exists.
  function inspect(_area: string) {}
  function activate(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    ;(event.currentTarget as Element).dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }

  /** Eight pixels to the metre, in the coordinates of the Tier 5 plan. */
  const SCALE = 8
  const x = (metres: number) => (metres + 35) * SCALE + 55
  const y = (metres: number) => (metres + 45.5) * SCALE + 85

  const room = { x0: -35, x1: 77, y0: -45.5, y1: 3.5 }

  /** Thirty-two crates: eight to a row, four rows deep. */
  const crateColumns = Array.from({ length: 8 }, (_, index) => -17.5 + index * 11)
  const crateRows = [-40, -26.5, -15.5, -4.5]

  /** The guard posts flanking the freight door, and the camera over it. */
  const posts = [
    [17, 1.7],
    [25, 1.7],
    [17, 0.5],
    [25, 0.5],
  ]
  const camera = { at: [35.8, 3.28], size: [0.8, 0.4] }

  /** The single declared entrance: six metres, because freight comes through. */
  const entrance = { at: 3.5, from: 18, to: 24 }
</script>

<svg
  viewBox="0 0 1000 540"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .room {
        fill: rgba(255, 255, 240, 0.03);
        stroke: #fffff0;
        stroke-width: 3;
      }
      .crate {
        fill: rgba(130, 107, 69, 0.22);
        stroke: #826b45;
        stroke-width: 1.2;
        cursor: pointer;
        transition: fill 0.2s;
      }
      .crate:hover {
        fill: rgba(255, 215, 0, 0.3);
      }
      .guard {
        fill: rgba(82, 97, 106, 0.5);
        stroke: #9eb0ba;
        stroke-width: 1.5;
      }
      .camera {
        fill: rgba(157, 196, 224, 0.2);
        stroke: #9dc4e0;
        stroke-width: 1.5;
        stroke-dasharray: 4 3;
      }
      .door {
        stroke: #ffd700;
        stroke-width: 6;
        cursor: pointer;
      }
      .door:hover {
        stroke: #fff;
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 12px;
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

  <text x="500" y="32" class="label" font-size="22" font-weight="bold" fill="#FFD700">
    Cha-R-Controlled Warehouse — Tier 5
  </text>
  <text x="500" y="52" class="label" font-size="10" opacity="0.55">
    112 m × 49 m, 12 m to the deckhead — one guarded entrance, thirty-two crates
  </text>

  <rect
    x={x(room.x0)}
    y={y(room.y0)}
    width={(room.x1 - room.x0) * SCALE}
    height={(room.y1 - room.y0) * SCALE}
    class="room"
  />

  {#each crateRows as row (row)}
    {#each crateColumns as column (column)}
      <rect
        role="button"
        tabindex="0"
        aria-label="Inspect map area"
        onkeydown={activate}
        class="crate"
        x={x(column - 3)}
        y={y(row - 1.3)}
        width={6 * SCALE}
        height={2.6 * SCALE}
        onclick={() => inspect(`crate-${column}-${row}`)}
      />
    {/each}
  {/each}

  <line
    role="button"
    tabindex="0"
    aria-label="Open the freight door"
    onkeydown={activate}
    class="door"
    x1={x(entrance.from)}
    y1={y(entrance.at)}
    x2={x(entrance.to)}
    y2={y(entrance.at)}
    onclick={() => inspect('main-entrance')}
  />
  <text x={x(21)} y={y(6.4)} class="sublabel">Main entrance — the hold's only way in</text>

  {#each posts as post, index (index)}
    <rect
      class="guard"
      x={x(post[0] - 0.7)}
      y={y(post[1] - 0.4)}
      width={1.4 * SCALE}
      height={0.8 * SCALE}
    />
  {/each}
  <text x={x(21)} y={y(-2.4)} class="label" font-size="10">Four guard posts</text>

  <rect
    class="camera"
    x={x(camera.at[0] - camera.size[0] / 2)}
    y={y(camera.at[1] - camera.size[1] / 2)}
    width={camera.size[0] * SCALE}
    height={camera.size[1] * SCALE}
  />
  <text x={x(41)} y={y(5.2)} class="sublabel">Camera, installed after loading</text>
</svg>
