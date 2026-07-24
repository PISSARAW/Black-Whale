<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';

  function handleTierClick(tierId: string) {
    mapState.selectTier(tierId);
  }
</script>

<svg viewBox="0 0 1000 700" class="w-full h-full text-gray-300">
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
        font-size: 28px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
        letter-spacing: 2px;
      }
    </style>
  </defs>

  <!-- Background/Sea placeholder -->
  <rect x="0" y="580" width="1000" height="120" fill="#0f172a" stroke="none" />

  <!-- TIER 1 -->
  <g on:click={() => handleTierClick('tier-1')}>
    <!-- Superstructure (bridge) and top deck -->
    <path class="tier" d="M 450 80 L 550 80 L 550 120 L 650 120 C 670 120, 700 150, 750 180 L 250 180 C 300 150, 330 120, 350 120 L 450 120 Z" />
    <text x="500" y="160" class="text-label">TIER 1</text>
  </g>

  <!-- TIER 2 -->
  <g on:click={() => handleTierClick('tier-2')}>
    <path class="tier" d="M 250 180 L 750 180 C 800 200, 830 230, 850 260 L 150 260 C 170 230, 200 200, 250 180 Z" />
    <text x="500" y="235" class="text-label">TIER 2</text>
  </g>

  <!-- TIER 3 -->
  <g on:click={() => handleTierClick('tier-3')}>
    <path class="tier" d="M 150 260 L 850 260 C 870 300, 880 340, 880 380 L 100 380 C 100 340, 120 300, 150 260 Z" />
    <text x="500" y="335" class="text-label">TIER 3</text>
    <!-- Whale Eye -->
    <circle cx="200" cy="320" r="35" fill="#050505" stroke="#FFD700" stroke-width="3" pointer-events="none" />
    <circle cx="200" cy="320" r="15" fill="#FFFFF0" pointer-events="none" />
  </g>

  <!-- TIER 4 -->
  <g on:click={() => handleTierClick('tier-4')}>
    <path class="tier" d="M 100 380 L 880 380 C 880 430, 860 470, 830 500 L 120 500 C 100 470, 95 430, 100 380 Z" />
    <text x="500" y="455" class="text-label">TIER 4</text>
  </g>

  <!-- TIER 5 -->
  <g on:click={() => handleTierClick('tier-5')}>
    <path class="tier" d="M 120 500 L 830 500 C 780 580, 700 600, 600 600 L 300 600 C 200 600, 150 560, 120 500 Z" />
    <text x="500" y="565" class="text-label">TIER 5</text>
  </g>
</svg>
