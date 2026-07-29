<script lang="ts">
  /**
   * The VIP casino, drawn from `data/ship/blueprint.json`.
   *
   * Ch. 405 gives the room three things: the gaming floor, the shopfronts
   * around it and the mezzanine above. The blueprint holds exactly those, and
   * this plan places them by the same coordinates — 17.5 m across by 52.5 m
   * fore to aft, a door at either end. The room is drawn turned a quarter
   * turn, the way the queens' block is: fore is to the left, port at the top.
   *
   * What it no longer draws is a crowd. Who is in the room is the marker
   * layer's answer, and it changes with the chapter; a map that stamps its own
   * gamblers on the felt contradicts it on every page.
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

  /** Sixteen pixels to the metre, ship +z along the page and +x down it. */
  const SCALE = 16
  const px = (fore: number) => (fore - 3.5) * SCALE + 80
  const py = (across: number) => (across + 57.75) * SCALE + 70

  const room = { fore0: 3.5, fore1: 56, across0: -57.75, across1: -40.25 }
  const mezzanines = [-56.4, -41.6]
  const shopfronts = [
    { across: -56.9, fore: 14 },
    { across: -56.9, fore: 45.5 },
    { across: -41.1, fore: 14 },
    { across: -41.1, fore: 45.5 },
  ]
  const tableColumns = [-53.5, -44.5]
  const tableRows = Array.from({ length: 9 }, (_, index) => 8 + index * 5.5)
  const TABLE_RADIUS = 1.1
</script>

<svg
  viewBox="0 0 1000 400"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .room {
        fill: rgba(255, 255, 240, 0.03);
        stroke: #fffff0;
        stroke-width: 3;
      }
      .mezzanine {
        fill: rgba(255, 215, 0, 0.07);
        stroke: #ffd700;
        stroke-width: 1.5;
        stroke-dasharray: 6 4;
      }
      .shopfront {
        fill: rgba(200, 200, 200, 0.15);
        stroke: #aaa;
        stroke-width: 2;
        cursor: pointer;
      }
      .gaming-table {
        fill: rgba(0, 102, 51, 0.55);
        stroke: #8b4513;
        stroke-width: 1.5;
        cursor: pointer;
        transition:
          fill 0.2s,
          stroke 0.2s;
      }
      .gaming-table:hover {
        fill: rgba(255, 215, 0, 0.35);
        stroke: #ffd700;
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
        fill: #ffd700;
        font-family: sans-serif;
        font-size: 11px;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <text x="500" y="30" class="label" font-size="22" font-weight="bold" fill="#FFD700">
    VIP Casino — Tier 1
  </text>
  <text x="500" y="50" class="label" font-size="10" opacity="0.55">
    17.5 m × 52.5 m — ch. 405: the gaming floor, the shopfronts and the mezzanine above
  </text>

  <rect
    x={px(room.fore0)}
    y={py(room.across0)}
    width={(room.fore1 - room.fore0) * SCALE}
    height={(room.across1 - room.across0) * SCALE}
    class="room"
  />

  <!-- The two openings, one at either end of the hall -->
  {#each [room.fore0, room.fore1] as end (end)}
    <line
      role="button"
      tabindex="0"
      aria-label="Open the doors"
      onkeydown={activate}
      class="door"
      x1={px(end)}
      y1={py(-50.5)}
      x2={px(end)}
      y2={py(-47.5)}
      onclick={() => handleElementClick(`door-${end}`)}
    />
  {/each}

  <!-- The mezzanine, running above each long wall -->
  {#each mezzanines as across (across)}
    <rect
      x={px(6.75)}
      y={py(across - 1.25)}
      width={46 * SCALE}
      height={2.5 * SCALE}
      class="mezzanine"
    />
  {/each}
  <text x={px(29.75)} y={py(-56.4) + 4} class="sublabel">Mezzanine</text>
  <text x={px(29.75)} y={py(-41.6) + 4} class="sublabel">Mezzanine</text>

  <!-- The shopfronts, under the mezzanine on both sides -->
  {#each shopfronts as shop, index (index)}
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={activate}
      class="shopfront"
      x={px(shop.fore - 4)}
      y={py(shop.across - 0.5)}
      width={8 * SCALE}
      height={1 * SCALE}
      onclick={() => handleElementClick(`shopfront-${index + 1}`)}
    />
  {/each}

  <!-- The gaming floor -->
  {#each tableColumns as across (across)}
    {#each tableRows as fore (fore)}
      <circle
        role="button"
        tabindex="0"
        aria-label="Inspect map area"
        onkeydown={activate}
        class="gaming-table"
        cx={px(fore)}
        cy={py(across)}
        r={TABLE_RADIUS * SCALE}
        onclick={() => handleElementClick(`gaming-table-${fore}-${across}`)}
      />
    {/each}
  {/each}
</svg>
