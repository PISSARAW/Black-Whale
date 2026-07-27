<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in Tier 3 Cabins`)
  }
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
      .zone {
        fill: rgba(255, 215, 0, 0.05);
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(255, 215, 0, 0.15);
      }
      .furniture {
        stroke: #666;
        stroke-width: 2;
        fill: rgba(100, 100, 100, 0.2);
        pointer-events: none;
      }
      .door {
        stroke: #ffd700;
        stroke-width: 4;
      }
    </style>
  </defs>

  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">First-Class Cabins (Tier 3)</text
  >

  <g transform="translate(50, 80)">
    <!-- Top Half: First Class Floor Plan (Multiple Cabins) -->
    <text x="450" y="20" class="label text-blue-400">First-Class Floor Plan</text>

    <!-- Corridor -->
    <rect x="0" y="250" width="900" height="50" class="zone" />
    <text x="450" y="280" class="sublabel text-gray-500">Hallway</text>

    <!-- 3 Cabins in a row -->
    {#each [0, 1, 2] as i}
      <g transform="translate({i * 300}, 50)">
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
          width="300"
          height="200"
          onclick={() => handleElementClick(`cabin-${i}`)}
        />
        <rect x="0" y="0" width="300" height="200" class="wall" />

        <!-- Entrance / Closet area -->
        <rect x="0" y="150" width="100" height="50" class="wall" />
        <text x="50" y="180" class="sublabel text-xs">CLOSET</text>
        <line class="door" x1="100" y1="200" x2="120" y2="180" />
        <!-- Door to main room -->

        <!-- Door to hallway -->
        <line class="door" x1="50" y1="250" x2="70" y2="230" />

        <!-- Back area (WC + Bed) -->
        <rect x="0" y="0" width="80" height="80" class="wall" />
        <text x="40" y="45" class="sublabel text-xs">WC</text>

        <rect x="80" y="0" width="220" height="80" class="wall" />
        <text x="190" y="45" class="sublabel text-xs">BED</text>
      </g>
    {/each}

    <!-- Bottom Half: Upper Floor Single Cabin (Detailed View) -->
    <g transform="translate(350, 350)">
      <text x="100" y="-15" class="label text-green-400">Upper Floor Single Cabin</text>
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
        height="220"
        onclick={() => handleElementClick('single-cabin-detail')}
      />
      <rect x="0" y="0" width="200" height="220" class="wall" />

      <!-- Door -->
      <line class="door" x1="150" y1="220" x2="190" y2="190" />

      <!-- Bed & Storage (Left Side) -->
      <rect x="0" y="60" width="100" height="120" class="wall" />
      <text x="50" y="115" class="sublabel text-xs">BED &</text>
      <text x="50" y="130" class="sublabel text-xs">STORAGE</text>

      <!-- WC (Top Left) -->
      <rect x="0" y="0" width="100" height="60" class="wall" />
      <text x="50" y="45" class="sublabel text-xs">WC</text>
      <ellipse cx="40" cy="25" rx="15" ry="10" class="furniture" />
      <!-- toilet -->
      <ellipse cx="80" cy="20" rx="8" ry="5" class="furniture" />
      <!-- sink -->

      <!-- Door to WC -->
      <line class="door" x1="100" y1="0" x2="120" y2="30" />
    </g>
  </g>
</svg>
