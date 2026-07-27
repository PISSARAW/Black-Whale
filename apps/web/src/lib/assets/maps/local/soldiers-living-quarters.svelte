<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in Soldiers/Associates' Living Quarters`)
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
      .barracks {
        fill: #1a1a2e;
        stroke: #2a2a4e;
        stroke-width: 2;
      }
      .bunk {
        fill: #111;
        stroke: #444;
      }
      .hunter {
        fill: #2e8b57;
        stroke: #006400;
        stroke-width: 1;
      }
      .soldier {
        fill: #4a5568;
        stroke: #2d3748;
        stroke-width: 1;
      }
    </style>
  </defs>

  <text x="500" y="40" class="label" font-size="28" fill="#FFD700"
    >Soldiers / Associates' Living Quarters (Tier 1)</text
  >
  <text x="500" y="65" class="sublabel text-gray-400"
    >Used by Kakin soldiers and about 150 Provisional Hunters</text
  >

  <g transform="translate(50, 100)">
    <!-- Central Path to Lower Tiers -->
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
      y="200"
      width="900"
      height="50"
      onclick={() => handleElementClick('passageway-lower-tiers')}
    />
    <text x="450" y="230" class="label text-gray-500" font-size="14"
      >Heavily Guarded Passageway to Lower Tiers</text
    >
    <!-- Guards blocking path -->
    <circle cx="50" cy="225" r="8" class="soldier" />
    <circle cx="850" cy="225" r="8" class="soldier" />

    <!-- Top section: Royal Army Barracks -->
    <text x="450" y="20" class="label text-blue-400">Royal Army Barracks</text>
    {#each Array(4) as _, i}
      <g transform="translate({20 + i * 220}, 40)">
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
          class="zone barracks"
          x="0"
          y="0"
          width="200"
          height="150"
          onclick={() => handleElementClick(`army-barracks-${i}`)}
        />
        <!-- Bunk beds -->
        {#each Array(3) as _, r}
          {#each Array(4) as _, c}
            <rect x={10 + c * 45} y={10 + r * 45} width="40" height="30" class="bunk" />
            <circle cx={30 + c * 45} cy={25 + r * 45} r="6" class="soldier" />
          {/each}
        {/each}
      </g>
    {/each}

    <!-- Bottom section: Provisional Hunters Quarters -->
    <text x="450" y="280" class="label text-green-400">Provisional Hunters Quarters</text>
    {#each Array(4) as _, i}
      <g transform="translate({20 + i * 220}, 300)">
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
          class="zone barracks"
          x="0"
          y="0"
          width="200"
          height="150"
          onclick={() => handleElementClick(`hunter-quarters-${i}`)}
        />
        <!-- Slightly different layout for hunters -->
        {#each Array(4) as _, r}
          {#each Array(3) as _, c}
            <rect x={25 + c * 55} y={15 + r * 30} width="40" height="20" class="bunk" />
            {#if Math.random() > 0.3}
              <circle cx={45 + c * 55} cy={25 + r * 30} r="6" class="hunter" />
            {/if}
          {/each}
        {/each}
      </g>
    {/each}
  </g>
</svg>
