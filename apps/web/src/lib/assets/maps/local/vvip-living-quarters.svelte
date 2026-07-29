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
      .door {
        stroke: #ffd700;
        stroke-width: 4;
      }
      .corridor {
        fill: rgba(255, 255, 255, 0.02);
      }
    </style>
  </defs>

  <text x="500" y="40" class="label" font-size="28" fill="#FFD700"
    >VVIP Living Quarters (Tier 1)</text
  >
  <text x="500" y="65" class="sublabel text-gray-500"
    >Residence for V5 Politicians, Dignitaries, Mafia Bosses & Confined Princes</text
  >

  <g transform="translate(50, 100)">
    <!-- Outer boundary -->
    <rect x="0" y="0" width="900" height="450" class="wall" />

    <!-- Corridor separating VVIP from other areas -->
    <rect class="corridor" x="10" y="10" width="880" height="40" />
    <text x="450" y="35" class="sublabel text-gray-400"
      >Main Corridor (To Banquet Hall / Soldier Quarters)</text
    >

    <!-- Room Layout Grid -->
    <!-- Top Row -->
    {#each Array(4) as _, i (i)}
      <g transform="translate({20 + i * 215}, 70)">
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
          y="0"
          width="200"
          height="150"
          onclick={() => handleElementClick(`vvip-room-top-${i}`)}
        />
        <rect x="0" y="0" width="200" height="150" class="wall" />
        <line class="door" x1="80" y1="0" x2="120" y2="0" />
        <!-- Door to corridor -->

        {#if i === 0}
          <text x="100" y="75" class="label text-red-500">Restricted Royal Suite</text>
          <text x="100" y="100" class="sublabel text-red-400">Confined princes</text>
        {:else if i === 1}
          <text x="100" y="75" class="label text-purple-500">Restricted Royal Suite</text>
          <text x="100" y="100" class="sublabel text-purple-400">Confined princes</text>
        {:else}
          <text x="100" y="75" class="label text-gray-500">VVIP Suite</text>
        {/if}
      </g>
    {/each}

    <!-- Middle Corridor -->
    <rect class="corridor" x="10" y="230" width="880" height="40" />

    <!-- Bottom Row (Mafia Bosses & V5) -->
    {#each Array(4) as _, i (i)}
      <g transform="translate({20 + i * 215}, 280)">
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
          y="0"
          width="200"
          height="150"
          onclick={() => handleElementClick(`vvip-room-bottom-${i}`)}
        />
        <rect x="0" y="0" width="200" height="150" class="wall" />
        <line class="door" x1="80" y1="0" x2="120" y2="0" />

        {#if i === 2}
          <text x="100" y="75" class="label text-yellow-600">Mafia VVIP Suite</text>
          <!-- Cross-bridge to Tier 2 -->
          <line
            x1="100"
            y1="150"
            x2="100"
            y2="200"
            stroke="#ff0"
            stroke-width="4"
            stroke-dasharray="5 5"
          />
          <text
            x="100"
            y="180"
            class="sublabel text-xs text-yellow-500"
            transform="rotate(-90 100 180)">To Tier 2</text
          >
        {:else if i === 3}
          <text x="100" y="75" class="label text-blue-500">V5 Politician</text>
        {:else}
          <text x="100" y="75" class="label text-gray-500">VVIP Suite</text>
        {/if}
      </g>
    {/each}
  </g>
</svg>
