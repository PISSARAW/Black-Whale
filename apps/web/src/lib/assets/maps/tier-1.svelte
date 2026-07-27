<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'

  function handleZoneClick(zoneId: string) {
    mapState.selectLocation(zoneId)
  }

  function handleZoneKeydown(event: KeyboardEvent, zoneId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      handleZoneClick(zoneId)
    }
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .hull {
        fill: #1a0f0f;
        stroke: #ffd700;
        stroke-width: 4;
      }
      .zone {
        fill: #2a1515;
        stroke: #fffff0;
        stroke-width: 2;
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: #3d1c1c;
      }
      .zone.selected {
        stroke: #ffd700;
        fill: #4d2020;
      }
      .corridor {
        fill: #110808;
        stroke: #ffd700;
        stroke-width: 1;
        stroke-dasharray: 4, 4;
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 14px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #ffd700;
        font-size: 11px;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <!-- Outer Hull Tier 1 (Smaller deck) -->
  <path
    class="hull"
    d="M 250 100 C 100 100, 100 500, 250 500 L 700 500 C 900 500, 900 100, 700 100 Z"
  />

  <g id="tier-1-zones">
    <!-- King's Living Quarters (Top) -->
    <g
      id="t1-king-quarters"
      role="button"
      tabindex="0"
      aria-label="Open King's Living Quarters"
      onclick={() => handleZoneClick('king-quarters')}
      onkeydown={(event) => handleZoneKeydown(event, 'king-quarters')}
    >
      <path
        class="zone"
        class:selected={mapState.selectedLocationId === 'king-quarters'}
        d="M 250 120 L 700 120 C 750 120, 750 200, 700 200 L 250 200 C 200 200, 200 120, 250 120 Z"
      />
      <text x="475" y="165" class="label text-yellow-500">King's Living Quarters</text>
    </g>

    <!-- Princes' Burial Chamber (Secret, behind King's quarters) -->
    <g
      id="t1-burial-chamber"
      role="button"
      tabindex="0"
      aria-label="Open Princes' Burial Chamber"
      onclick={() => handleZoneClick('princes-burial-chamber')}
      onkeydown={(event) => handleZoneKeydown(event, 'princes-burial-chamber')}
    >
      <circle
        class="zone"
        class:selected={mapState.selectedLocationId === 'princes-burial-chamber'}
        cx="475"
        cy="110"
        r="30"
        stroke="#f00"
        stroke-width="2"
      />
      <text x="475" y="115" class="sublabel text-[9px] text-red-500">Burial</text>
    </g>

    <!-- Banquet Hall (Middle) -->
    <g
      id="t1-banquet-hall"
      role="button"
      tabindex="0"
      aria-label="Open Banquet Hall"
      onclick={() => handleZoneClick('banquet-hall')}
      onkeydown={(event) => handleZoneKeydown(event, 'banquet-hall')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 'banquet-hall'}
        x="250"
        y="220"
        width="450"
        height="70"
      />
      <text x="475" y="260" class="label">Banquet Hall</text>
    </g>

    <!-- VVIP Living Quarters -->
    <g
      id="t1-vvip-quarters"
      role="button"
      tabindex="0"
      aria-label="Open VVIP Living Quarters"
      onclick={() => handleZoneClick('vvip-living-quarters')}
      onkeydown={(event) => handleZoneKeydown(event, 'vvip-living-quarters')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 'vvip-living-quarters'}
        x="250"
        y="310"
        width="80"
        height="150"
      />
      <text x="290" y="380" class="label text-purple-400">VVIP</text>
    </g>

    <!-- VIP Casino -->
    <g
      id="t1-casino"
      role="button"
      tabindex="0"
      aria-label="Open VIP Casino"
      onclick={() => handleZoneClick('casino')}
      onkeydown={(event) => handleZoneKeydown(event, 'casino')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 'casino'}
        x="335"
        y="310"
        width="50"
        height="150"
      />
      <text x="360" y="380" class="label text-yellow-500 text-[10px] transform -rotate-90"
        >VIP Casino</text
      >
    </g>

    <!-- Queens' Living Quarters -->
    <g
      id="t1-queens-quarters"
      role="button"
      tabindex="0"
      aria-label="Open Queens' Living Quarters"
      onclick={() => handleZoneClick('queens-living-quarters')}
      onkeydown={(event) => handleZoneKeydown(event, 'queens-living-quarters')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 'queens-living-quarters'}
        x="390"
        y="310"
        width="65"
        height="150"
      />
      <text x="422" y="380" class="label text-pink-400">Queens'</text>
    </g>

    <!-- Princes' Living Quarters (1001-1014) -->
    <g id="t1-princes-quarters">
      <rect
        x="460"
        y="310"
        width="140"
        height="150"
        fill="none"
        stroke="#FFFFF0"
        stroke-width="2"
      />
      <rect x="460" y="310" width="140" height="150" fill="transparent" pointer-events="none" />

      <!-- Ligne de gauche (Pair) -->
      {#each [2, 4, 6, 8, 10, 12, 14] as i, index (index)}
        <g
          role="button"
          tabindex="0"
          aria-label={`Open Room 10${i < 10 ? '0' + i : i}`}
          onclick={(e) => {
            e.stopPropagation()
            handleZoneClick(`room-10${i < 10 ? '0' + i : i}`)
          }}
          onkeydown={(event) => handleZoneKeydown(event, `room-10${i < 10 ? '0' + i : i}`)}
        >
          <rect
            class="zone"
            class:selected={mapState.selectedLocationId === `room-10${i < 10 ? '0' + i : i}`}
            x="460"
            y={310 + index * 21.4}
            width="35"
            height="21.4"
          />
          <text x="477" y={325 + index * 21.4} class="label text-[8px]"
            >10{i < 10 ? '0' + i : i}</text
          >
        </g>
      {/each}

      <!-- Ligne de droite (Impair) -->
      {#each [1, 3, 5, 7, 9, 11, 13] as i, index (index)}
        <g
          role="button"
          tabindex="0"
          aria-label={`Open Room 10${i < 10 ? '0' + i : i}`}
          onclick={(e) => {
            e.stopPropagation()
            handleZoneClick(`room-10${i < 10 ? '0' + i : i}`)
          }}
          onkeydown={(event) => handleZoneKeydown(event, `room-10${i < 10 ? '0' + i : i}`)}
        >
          <rect
            class="zone"
            class:selected={mapState.selectedLocationId === `room-10${i < 10 ? '0' + i : i}`}
            x="565"
            y={310 + index * 21.4}
            width="35"
            height="21.4"
          />
          <text x="582" y={325 + index * 21.4} class="label text-[8px]"
            >10{i < 10 ? '0' + i : i}</text
          >
        </g>
      {/each}

      <text x="530" y="380" class="label text-xs pointer-events-none transform -rotate-90"
        >Princes' Quarters</text
      >
    </g>

    <!-- Soldiers / Associates' Living Quarters -->
    <g
      id="t1-soldiers-quarters"
      role="button"
      tabindex="0"
      aria-label="Open Soldiers' Living Quarters"
      onclick={() => handleZoneClick('soldiers-living-quarters')}
      onkeydown={(event) => handleZoneKeydown(event, 'soldiers-living-quarters')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 'soldiers-living-quarters'}
        x="605"
        y="310"
        width="95"
        height="150"
      />
      <text x="652" y="380" class="label text-green-400">Soldiers</text>
    </g>

    <!-- Jail Block and VIP Detention -->
    <g id="t1-jail">
      <rect
        x="730"
        y="220"
        width="120"
        height="130"
        fill="none"
        stroke="#f00"
        stroke-width="2"
        stroke-dasharray="4,4"
      />
      <text x="790" y="240" class="label text-red-500">Jail Block</text>

      <g
        role="button"
        tabindex="0"
        aria-label="Open High-security Cell"
        onclick={() => handleZoneClick('beyond-cell')}
        onkeydown={(event) => handleZoneKeydown(event, 'beyond-cell')}
      >
        <rect
          class="zone"
          class:selected={mapState.selectedLocationId === 'beyond-cell'}
          x="740"
          y="250"
          width="100"
          height="40"
        />
        <text x="790" y="275" class="sublabel text-xs">High-security Cell</text>
      </g>

      <g
        role="button"
        tabindex="0"
        aria-label="Open VIP Detention"
        onclick={() => handleZoneClick('vip-detention')}
        onkeydown={(event) => handleZoneKeydown(event, 'vip-detention')}
      >
        <rect
          class="zone"
          class:selected={mapState.selectedLocationId === 'vip-detention'}
          x="740"
          y="300"
          width="100"
          height="40"
        />
        <text x="790" y="325" class="sublabel text-xs">VIP Detention</text>
      </g>
    </g>

    <g
      id="t1-supreme-court"
      role="button"
      tabindex="0"
      aria-label="Open Supreme Court"
      onclick={() => handleZoneClick('supreme-court')}
      onkeydown={(event) => handleZoneKeydown(event, 'supreme-court')}
    >
      <rect
        class="zone"
        class:selected={mapState.selectedLocationId === 'supreme-court'}
        x="730"
        y="370"
        width="120"
        height="80"
      />
      <text x="790" y="405" class="label text-blue-400 text-[10px]">Supreme Court</text>
      <text x="790" y="422" class="sublabel text-[9px]">Judicial chamber</text>
    </g>

    <!-- Lifeboats (Edges of the ship) -->
    <g
      id="t1-lifeboats"
      role="button"
      tabindex="0"
      aria-label="Open Lifeboats"
      onclick={() => handleZoneClick('lifeboats')}
      onkeydown={(event) => handleZoneKeydown(event, 'lifeboats')}
    >
      <!-- Left side lifeboats -->
      <path
        class="zone"
        class:selected={mapState.selectedLocationId === 'lifeboats'}
        d="M 120 250 L 150 250 L 150 350 L 120 350 Z"
      />
      <text x="135" y="300" class="label text-cyan-400 text-[10px] transform -rotate-90"
        >Lifeboats</text
      >
      <!-- Right side lifeboats -->
      <path
        class="zone"
        class:selected={mapState.selectedLocationId === 'lifeboats'}
        d="M 850 250 L 880 250 L 880 350 L 850 350 Z"
      />
      <text x="865" y="300" class="label text-cyan-400 text-[10px] transform -rotate-90"
        >Lifeboats</text
      >
    </g>
  </g>
</svg>
