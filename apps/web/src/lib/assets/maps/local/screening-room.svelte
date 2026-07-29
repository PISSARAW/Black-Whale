<script lang="ts">
  /**
   * The screening room, drawn from `data/ship/blueprint.json`.
   *
   * It used to draw eight rows of raked seats widening away from a projection
   * wall. Ch. 359 draws a theatre instead: a proscenium stage under its
   * curtain, a pier either side of it, boxes running down both side walls above
   * the stalls, and the screen standing on the stage. The walk holds all of
   * that, so the plan does too — every fixture here is placed by the
   * coordinates the blueprint gives it, none by eye.
   *
   * Hatched fixtures hang above head height: the boxes at 4.4 m and the curtain
   * at 5.5 m are things you pass under rather than around.
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

  /** Ten pixels to the metre, in the coordinates of the Tier 2 plan. */
  const SCALE = 10
  const x = (metres: number) => (metres + 87.5) * SCALE + 60
  const y = (metres: number) => (metres - 7) * SCALE + 75

  const room = { x0: -87.5, x1: 0, y0: 7, y1: 52.5 }

  /** Everything the blueprint stands in the room, at its own centre and size. */
  const solids = [
    { id: 'stage', at: [-81.6, 29.75], size: [6.8, 34], hung: false },
    { id: 'proscenium-port', at: [-76, 12], size: [2.4, 4], hung: false },
    { id: 'proscenium-starboard', at: [-76, 47.5], size: [2.4, 4], hung: false },
    { id: 'curtain', at: [-77.6, 29.75], size: [1, 27], hung: true },
    { id: 'screen', at: [-84.6, 24], size: [0.4, 6], hung: true },
    { id: 'boxes-port-forward', at: [-62, 8], size: [26, 1.2], hung: true },
    { id: 'boxes-port-aft', at: [-27, 8], size: [26, 1.2], hung: true },
    { id: 'boxes-starboard-forward', at: [-62, 51.5], size: [26, 1.2], hung: true },
    { id: 'boxes-starboard-aft', at: [-27, 51.5], size: [26, 1.2], hung: true },
    ...[-70, -60, -49.25, -38.25, -27.25, -16.25].map((centre, index) => ({
      id: `seating-${index + 1}`,
      at: [centre, 29.75],
      size: [5, 30],
      hung: false,
    })),
  ]

  /** The three openings the tour derives from the shared walls. */
  const doors = [
    { id: 'main-corridor', axis: 'y' as const, at: 7, from: -45.25, to: -42.25 },
    { id: 'aft-corridor', axis: 'y' as const, at: 52.5, from: -45.25, to: -42.25 },
    { id: 'port-promenade', axis: 'x' as const, at: -87.5, from: 28.25, to: 31.25 },
  ]
</script>

<svg
  viewBox="0 0 1000 560"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .room {
        fill: rgba(255, 255, 240, 0.03);
        stroke: #fffff0;
        stroke-width: 3;
      }
      .solid {
        fill: rgba(217, 164, 65, 0.18);
        stroke: #d9a441;
        stroke-width: 1.5;
        cursor: pointer;
        transition: fill 0.2s;
      }
      .solid:hover {
        fill: rgba(255, 215, 0, 0.35);
      }
      .hung {
        fill: rgba(157, 196, 224, 0.12);
        stroke: #9dc4e0;
        stroke-width: 1.5;
        stroke-dasharray: 5 3;
        cursor: pointer;
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
        font-size: 12px;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #9dc4e0;
        font-family: sans-serif;
        font-size: 11px;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <text x="500" y="30" class="label" font-size="22" font-weight="bold" fill="#FFD700">
    Screening Room — Tier 2
  </text>
  <text x="500" y="50" class="label" font-size="10" opacity="0.55">
    87.5 m × 45.5 m, 10 m to the deckhead — ch. 359: the proscenium, the boxes and the stalls
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

  {#each solids as solid (solid.id)}
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={activate}
      class={solid.hung ? 'hung' : 'solid'}
      x={x(solid.at[0] - solid.size[0] / 2)}
      y={y(solid.at[1] - solid.size[1] / 2)}
      width={solid.size[0] * SCALE}
      height={solid.size[1] * SCALE}
      onclick={() => handleElementClick(solid.id)}
    />
  {/each}

  <text x={x(-81.6)} y={y(29.75)} class="label" transform="rotate(-90 {x(-81.6)} {y(29.75)})"
    >Stage</text
  >
  <text x={x(-84.6)} y={y(19)} class="sublabel">Screen</text>
  <text x={x(-77.6)} y={y(14)} class="sublabel">Curtain</text>
  <text x={x(-44.5)} y={y(10.6)} class="sublabel">Boxes</text>
  <text x={x(-44.5)} y={y(50.2)} class="sublabel">Boxes</text>
  <text x={x(-43)} y={y(30.6)} class="label">Stalls — six blocks</text>
</svg>
