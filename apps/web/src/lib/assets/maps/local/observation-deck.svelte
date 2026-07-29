<script lang="ts">
  /**
   * The observation deck, drawn from `data/ship/blueprint.json`.
   *
   * It used to be drawn as an open-air platform at the bow, over a sea with
   * waves on it. The Black Whale crosses to the Dark Continent through the
   * sky, and the deck plan puts this room inboard on Tier 3, starboard of the
   * corridor, with one wall slanted across the deck. What it looks out of is
   * the window ch. 380 draws curved, and what lies under it is the container
   * city on the tiers below — not water.
   *
   * So this is a plan like the others: the room at its footprint, the window
   * along the outboard wall, and the two ways in.
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

  /** Thirteen pixels to the metre, in the coordinates of the Tier 3 plan. */
  const SCALE = 13
  const x = (metres: number) => (metres - 49) * SCALE + 70
  const y = (metres: number) => (metres + 21) * SCALE + 70

  /** The footprint, corner for corner. */
  const footprint: [number, number][] = [
    [49, -21],
    [101.5, -21],
    [115.5, 17.5],
    [49, 17.5],
  ]
  const outline = footprint.map(([mx, my]) => `${x(mx)},${y(my)}`).join(' ')

  // The window stands just inside the slanted outboard wall, the way the
  // blueprint places it: offset 0.35 m in, and 36 of the wall's 41 m long.
  // These are the ends of that solid, not an eyeballed line along the wall.
  const bay = { from: [102.02, -18.54], to: [114.32, 15.28] }
</script>

<svg
  viewBox="0 0 1000 620"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .room {
        fill: rgba(255, 255, 240, 0.03);
        stroke: #fffff0;
        stroke-width: 3;
      }
      .window {
        stroke: #9dc4e0;
        stroke-width: 9;
        stroke-linecap: round;
        cursor: pointer;
      }
      .window:hover {
        stroke: #d8ecfa;
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
    Observation Deck — Tier 3
  </text>
  <text x="500" y="50" class="label" font-size="10" opacity="0.55">
    66.5 m × 38.5 m, 9 m under the deckhead — ch. 380
  </text>

  <polygon points={outline} class="room" />

  <!-- The window, along the outboard wall the plan slants -->
  <line
    role="button"
    tabindex="0"
    aria-label="Inspect the observation window"
    onkeydown={activate}
    class="window"
    x1={x(bay.from[0])}
    y1={y(bay.from[1])}
    x2={x(bay.to[0])}
    y2={y(bay.to[1])}
    onclick={() => handleElementClick('observation-window')}
  />
  <text x={x(101)} y={y(3)} class="sublabel" transform="rotate(70 {x(101)} {y(3)})">
    Observation window
  </text>
  <text x={x(78)} y={y(-2)} class="label" font-size="11" opacity="0.6">
    The container city lies on the tiers below
  </text>

  <!-- The two ways in: the starboard corridor, and the promenade aft -->
  <line
    role="button"
    tabindex="0"
    aria-label="Open the doors"
    onkeydown={activate}
    class="door"
    x1={x(49)}
    y1={y(-3.25)}
    x2={x(49)}
    y2={y(-0.25)}
    onclick={() => handleElementClick('starboard-corridor')}
  />
  <line
    role="button"
    tabindex="0"
    aria-label="Open the doors"
    onkeydown={activate}
    class="door"
    x1={x(107)}
    y1={y(17.5)}
    x2={x(110)}
    y2={y(17.5)}
    onclick={() => handleElementClick('starboard-promenade')}
  />
</svg>
