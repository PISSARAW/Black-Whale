<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'

  type Wall = readonly [number, number, number, number]
  type Layout = { walls: readonly Wall[]; note: string; evidence: string }

  const layouts: Record<string, Layout> = {
    '1011': {
      walls: [
        [245, 100, 245, 700],
        [455, 100, 455, 300],
        [455, 300, 750, 300],
        [535, 300, 535, 700],
        [50, 250, 245, 250],
        [50, 390, 245, 390],
        [50, 525, 245, 525],
        [125, 250, 125, 390],
        [165, 390, 165, 525],
        [130, 525, 130, 700],
        [605, 300, 605, 520],
      ],
      note: 'Clean partitioned layout visible in the cutaway',
      evidence: 'Bed, photos and clock · ch. 366 and 374',
    },
    '1012': {
      walls: [
        [265, 100, 265, 700],
        [265, 315, 545, 315],
        [545, 100, 545, 700],
        [50, 475, 265, 475],
        [135, 475, 135, 700],
        [545, 235, 750, 235],
        [545, 385, 750, 385],
        [545, 535, 750, 535],
        [615, 100, 615, 235],
        [655, 235, 655, 385],
        [620, 385, 620, 535],
        [665, 535, 665, 700],
      ],
      note: 'Layout distinct from 1011, non-interchangeable',
      evidence: 'Canopy bed · ch. 366–368 ; vent grille · ch. 367–368',
    },
    '1013': {
      walls: [
        [275, 100, 275, 700],
        [500, 100, 500, 700],
        [50, 245, 275, 245],
        [50, 380, 275, 380],
        [50, 515, 275, 515],
        [125, 245, 125, 380],
        [165, 380, 165, 515],
        [130, 515, 130, 700],
        [500, 285, 750, 285],
        [575, 285, 575, 470],
        [500, 540, 750, 540],
        [650, 540, 650, 700],
      ],
      note: 'Service block on the left, large central space, private wing on the right',
      evidence: "Children's furniture · ch. 366 ; service vent · ch. 367",
    },
    '1014': {
      walls: [
        [420, 100, 420, 515],
        [50, 515, 750, 515],
        [235, 515, 235, 700],
        [420, 515, 420, 700],
        [50, 250, 420, 250],
      ],
      note: 'Two large open spaces and a front vestibule',
      evidence: 'Salon · ch. 360 ; kitchen · 367 ; dining room · 371',
    },
  }

  const selected = $derived(mapState.selectedLocationId?.match(/10(?:0[1-9]|1[0-4])/)?.[0])
  const roomNumber = $derived(selected && selected in layouts ? selected : '1014')
  const layout = $derived(layouts[roomNumber])
</script>

<svg
  viewBox="0 0 800 800"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
  aria-label={`Prince's Apartment ${roomNumber}, based on chapter 368 cutaway`}
>
  <defs>
    <style>
      .outer {
        fill: rgba(255, 215, 0, 0.025);
        stroke: #fffff0;
        stroke-width: 6;
      }
      .wall {
        stroke: #fffff0;
        stroke-width: 5;
        stroke-linecap: square;
      }
      .door {
        stroke: #ffd700;
        stroke-width: 7;
      }
      .title {
        fill: #ffd700;
        font-family: sans-serif;
        font-size: 28px;
        font-weight: 700;
        text-anchor: middle;
      }
      .caption {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 14px;
        text-anchor: middle;
      }
      .source {
        fill: #999;
        font-family: sans-serif;
        font-size: 12px;
        text-anchor: middle;
      }
      .unknown {
        fill: none;
        stroke: #777;
        stroke-width: 2;
        stroke-dasharray: 8 8;
      }
      .fixed {
        stroke: #ffd700;
        stroke-width: 2;
        fill: rgba(255, 215, 0, 0.09);
        pointer-events: none;
      }
      .sublabel {
        fill: #ffd700;
        font-size: 12px;
        font-family: sans-serif;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
    <pattern id="uncertain" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M-3 3 L3 -3 M0 12 L12 0 M9 15 L15 9" class="unknown" />
    </pattern>
  </defs>

  <text x="400" y="42" class="title">Prince's Apartment {roomNumber}</text>
  <text x="400" y="70" class="source">Chap. 368 · rooms 1011 to 1014 cutaway</text>
  <rect x="50" y="100" width="700" height="600" class="outer" />
  
  {#each layout.walls as wall (`${wall[0]}-${wall[1]}-${wall[2]}-${wall[3]}`)}
    <line x1={wall[0]} y1={wall[1]} x2={wall[2]} y2={wall[3]} class="wall" />
  {/each}

  <!-- The cutaway shows the entrance on the front face without revealing the exact door placement. -->
  <line x1="365" y1="700" x2="435" y2="700" class="door" />

  {#if roomNumber === '1011' || roomNumber === '1012'}
    <rect x="55" y="105" width="690" height="590" fill="url(#uncertain)" opacity="0.08" />
  {/if}

  <!-- Specific room markers -->
  {#if roomNumber === '1012'}
    <rect x="70" y="640" width="40" height="30" rx="3" class="fixed" />
    <text x="90" y="685" class="sublabel" font-size="10">Vent grille · Little Eye</text>
  {:else if roomNumber === '1013'}
    <rect x="70" y="120" width="180" height="80" rx="5" class="fixed" />
    <text x="160" y="165" class="sublabel">Long meeting table</text>
    <text x="400" y="400" class="sublabel">Guarded salon</text>
    <text x="625" y="620" class="sublabel">Bedroom · Marayam</text>
  {:else if roomNumber === '1014'}
    <rect x="70" y="110" width="120" height="130" rx="4" class="fixed" />
    <line class="fixed" x1="70" y1="110" x2="70" y2="240" stroke-width="6" />
    <line class="fixed" x1="190" y1="110" x2="190" y2="240" stroke-width="6" />
    <line class="fixed" x1="70" y1="110" x2="190" y2="110" stroke-width="6" />
    <text x="130" y="180" class="sublabel">Canopy bed</text>
  {/if}

  <text x="400" y="742" class="caption">{layout.note}</text>
  <text x="400" y="764" class="source">{layout.evidence}</text>
  <text x="400" y="786" class="source">Unlabeled functions: undetermined.</text>
</svg>
