<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in Observation Deck`)
  }
</script>

<svg
  viewBox="0 0 1000 600"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .window-frame {
        fill: #111;
        stroke: #333;
        stroke-width: 8;
      }
      .sky {
        fill: qradial-gradient(cx 0.5 cy 0.5 r 0.5 fx 0.5 fy 0.5, #334, #001);
      }
      .sea {
        fill: #0b2636;
      }
      .wave {
        fill: none;
        stroke: #6b9bb3;
        stroke-width: 2;
        opacity: 0.45;
      }
      .fixture {
        fill: #202a30;
        stroke: #73808a;
        stroke-width: 2;
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 16px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#445" />
      <stop offset="100%" stop-color="#112" />
    </linearGradient>
  </defs>

  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">Observation Deck (Tier 3)</text>

  <g transform="translate(0, 80)">
    <!-- Open-air sightseeing platform at the ship's bow. -->
    <rect x="50" y="50" width="900" height="180" fill="url(#skyGrad)" />
    <rect x="50" y="230" width="900" height="220" class="sea" />
    <line x1="50" y1="230" x2="950" y2="230" stroke="#88a" stroke-width="2" />
    <path class="wave" d="M60 290 Q130 260 200 290 T340 290 T480 290 T620 290 T760 290 T940 290" />
    <path class="wave" d="M60 360 Q130 330 200 360 T340 360 T480 360 T620 360 T760 360 T940 360" />

    <!-- Canonically shown amenities; their exact spacing is schematic. -->
    <g transform="translate(120, 330)">
      {#each [0, 1, 2, 3] as i}
        <rect class="fixture" x={i * 95} y="0" width="62" height="28" rx="5" />
        <line x1={i * 95 + 12} y1="28" x2={i * 95 + 4} y2="48" stroke="#73808a" stroke-width="3" />
        <line x1={i * 95 + 50} y1="28" x2={i * 95 + 58} y2="48" stroke="#73808a" stroke-width="3" />
      {/each}
      <text x="175" y="72" class="label" font-size="13">Outdoor lounge chairs</text>
    </g>
    <rect class="fixture" x="610" y="320" width="125" height="95" rx="6" />
    <text x="672" y="370" class="label" font-size="13">Shops</text>
    <rect class="fixture" x="760" y="320" width="125" height="95" rx="6" />
    <text x="822" y="370" class="label" font-size="13">Bars</text>

    <path
      class="window-frame"
      d="M 0 0 L 1000 0 L 1000 500 L 0 500 Z M 50 50 L 50 450 L 950 450 L 950 50 Z"
    />
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the observation deck"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      x="80"
      y="260"
      width="840"
      height="180"
      fill="transparent"
      cursor="pointer"
      onclick={() => handleElementClick('observation-deck')}
    />
  </g>
</svg>
