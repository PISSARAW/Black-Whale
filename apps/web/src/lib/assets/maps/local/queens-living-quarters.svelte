<script lang="ts">
  // Room interactions are not wired up yet. The elements keep their click
  // and keyboard affordances so the behaviour can be attached in one place
  // when it exists; until then this must not log on a public page.
  function handleElementClick(_elementId: string) {}

  /// The eight rooms of the block, laid out as two rows of four around the
  /// private corridor. Numbers match the `-room-01`…`-room-08` locations the
  /// catalogue declares, which is what lets a marker land in its own room.
  const rooms = Array.from({ length: 8 }, (_, index) => {
    const isNorth = index < 4
    const column = index % 4
    return {
      number: String(index + 1).padStart(2, '0'),
      isNorth,
      x: 10 + column * 145,
      y: isNorth ? 10 : 240,
    }
  })
</script>

<svg
  viewBox="0 0 800 600"
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
      .door {
        stroke: #ffd700;
        stroke-width: 4;
      }
      .furniture {
        fill: #222;
        stroke: #444;
        stroke-width: 2;
      }
      .crib {
        fill: #8a6c4f;
        stroke: #bda267;
        stroke-width: 1.5;
      }
      .mobile {
        fill: #bda267;
        stroke: #fffff0;
        stroke-width: 1;
      }
      .armchair {
        fill: #482736;
        stroke: #bda267;
        stroke-width: 2;
      }
      .side-table {
        fill: #3d2b20;
        stroke: #bda267;
        stroke-width: 1.5;
      }
      .coffee-table {
        fill: #3d2b20;
        stroke: #bda267;
        stroke-width: 1.5;
      }
      .painting {
        stroke: #bda267;
        stroke-width: 2.5;
      }
      .carpet {
        fill: rgba(72, 39, 54, 0.4);
        stroke: #bda267;
        stroke-width: 1;
        stroke-dasharray: 2 2;
      }
    </style>
  </defs>

  <text x="400" y="40" class="label" font-size="28" fill="#FFD700"
    >Queens' Living Quarters (Tier 1)</text
  >

  <g transform="translate(100, 100)">
    <!-- The block is on the deck plan; its interior arrangement is not, so the
         rooms are drawn like the princes' sector. Only the count is canon. -->
    <rect x="0" y="0" width="600" height="400" class="wall" />

    <!-- Central Corridor -->
    <rect x="0" y="160" width="600" height="80" fill="rgba(255,255,255,0.02)" />
    <text x="300" y="205" class="sublabel text-gray-500">Queens' Private Corridor</text>

    <!-- Eight rooms for eight queens: 01–04 north of the corridor, 05–08 south.
         The block holds one room per queen, so none of them is a shared suite. -->
    {#each rooms as room (room.number)}
      <g transform="translate({room.x}, {room.y})">
        <rect
          role="button"
          tabindex="0"
          aria-label="Inspect Queen's Room {room.number}"
          onkeydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
            }
          }}
          class="zone"
          x="0"
          y="0"
          width="135"
          height="150"
          onclick={() => handleElementClick(`queens-living-quarters-room-${room.number}`)}
        />
        <rect x="0" y="0" width="135" height="150" class="wall" />
        <line
          class="door"
          x1="50"
          y1={room.isNorth ? 150 : 0}
          x2="85"
          y2={room.isNorth ? 150 : 0}
        />
        <!-- Door, always on the corridor side -->

        {#if room.number === '01'}
          <!-- Queen Unma's Room (Chapter 403 canonical fidelity) -->
          <!-- Nursery partition wall with open doorway -->
          <line x1="0" y1="48" x2="42" y2="48" class="wall" stroke-width="2.5" />
          <line x1="82" y1="48" x2="135" y2="48" class="wall" stroke-width="2.5" />
          <line class="door" x1="42" y1="48" x2="68" y2="30" stroke-width="2.5" />

          <!-- Nursery: wooden cot & hanging mobile -->
          <rect x="12" y="12" width="26" height="30" rx="2" class="crib" />
          <circle cx="25" cy="27" r="5" class="mobile" />
          <line x1="20" y1="27" x2="30" y2="27" stroke="#bda267" stroke-width="1" />
          <line x1="25" y1="22" x2="25" y2="32" stroke="#bda267" stroke-width="1" />

          <!-- Alcove bed -->
          <rect x="88" y="12" width="38" height="26" class="furniture" />

          <!-- Salon rug -->
          <rect x="36" y="66" width="63" height="68" rx="2" class="carpet" />

          <!-- Queen Unma's carved armchair -->
          <rect x="58" y="78" width="19" height="19" rx="3" class="armchair" />
          <!-- Armchair side tables (guéridons) -->
          <circle cx="48" cy="87" r="5" class="side-table" />
          <circle cx="87" cy="87" r="5" class="side-table" />

          <!-- Rectangular coffee table -->
          <rect x="53" y="106" width="29" height="14" rx="2" class="coffee-table" />

          <!-- Framed pictures on wall -->
          <line x1="56" y1="1" x2="79" y2="1" class="painting" />
          <line x1="90" y1="1" x2="112" y2="1" class="painting" />

          <text x="67.5" y="60" class="sublabel text-yellow-200" font-size="10">Reine Unma</text>
          <text x="67.5" y="142" class="sublabel text-gray-400" font-size="8">Ch. 403</text>
        {:else}
          <rect x="40" y={room.isNorth ? 20 : 100} width="55" height="30" class="furniture" />
          <!-- Bed -->
          <text x="67.5" y="80" class="label text-gray-400">Queen's Room</text>
          <text x="67.5" y="100" class="sublabel text-yellow-200">{room.number}</text>
        {/if}
      </g>
    {/each}
  </g>
</svg>
