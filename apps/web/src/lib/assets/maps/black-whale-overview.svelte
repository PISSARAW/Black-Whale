<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';

  function handleTierClick(tierId: string) {
    mapState.selectTier(tierId);
  }
</script>

<svg viewBox="0 0 800 600" class="w-full h-full text-gray-300">
  <defs>
    <style>
      .tier {
        fill: #1a1a1a;
        stroke: #FFD700;
        stroke-width: 2;
        transition: fill 0.2s, transform 0.2s;
        cursor: pointer;
      }
      .tier:hover {
        fill: #2a2a2a;
      }
      .text-label {
        fill: #FFFFF0;
        font-family: sans-serif;
        font-size: 24px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <!-- Background/Sea placeholder -->
  <rect x="0" y="550" width="800" height="50" fill="#0f172a" stroke="none" />

  <g on:click={() => handleTierClick('tier-1')}>
    <path class="tier" d="M 300 100 L 500 100 L 520 180 L 280 180 Z" />
    <text x="400" y="150" class="text-label">TIER 1</text>
  </g>

  <g on:click={() => handleTierClick('tier-2')}>
    <path class="tier" d="M 280 180 L 520 180 L 560 260 L 240 260 Z" />
    <text x="400" y="230" class="text-label">TIER 2</text>
  </g>

  <g on:click={() => handleTierClick('tier-3')}>
    <path class="tier" d="M 240 260 L 560 260 L 620 360 L 180 360 Z" />
    <text x="400" y="320" class="text-label">TIER 3</text>
  </g>

  <g on:click={() => handleTierClick('tier-4')}>
    <path class="tier" d="M 180 360 L 620 360 L 680 460 L 120 460 Z" />
    <text x="400" y="420" class="text-label">TIER 4</text>
  </g>

  <g on:click={() => handleTierClick('tier-5')}>
    <path class="tier" d="M 120 460 L 680 460 L 740 550 L 60 550 Z" />
    <text x="400" y="515" class="text-label">TIER 5</text>
  </g>
</svg>
