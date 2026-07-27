<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in Banquet Hall`)
  }
</script>

<svg
  viewBox="0 0 1000 800"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        stroke: #fffff0;
        stroke-width: 6;
        fill: none;
      }
      .stage {
        fill: rgba(139, 69, 19, 0.2);
        stroke: #8b4513;
        stroke-width: 3;
      }
      .table {
        fill: rgba(255, 255, 255, 0.1);
        stroke: #666;
        stroke-width: 2;
        cursor: pointer;
        transition: fill 0.2s;
      }
      .table:hover {
        fill: rgba(255, 215, 0, 0.3);
        stroke: #ffd700;
      }
      .throne-platform {
        fill: rgba(255, 215, 0, 0.1);
        stroke: #ffd700;
        stroke-width: 3;
      }
      .buffet {
        fill: rgba(200, 200, 200, 0.15);
        stroke: #aaa;
        stroke-width: 2;
      }
      .door {
        stroke: #ffd700;
        stroke-width: 6;
        cursor: pointer;
      }
      .door:hover {
        stroke: #fff;
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 18px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #ffd700;
        font-size: 14px;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <text x="500" y="40" class="label" font-size="32" fill="#FFD700">Banquet Hall</text>

  <g transform="translate(50, 80)">
    <!-- Main Hall Walls -->
    <rect x="0" y="0" width="900" height="650" class="wall" />

    <!-- Stage (Top) -->
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
      x="100"
      y="0"
      width="700"
      height="120"
      class="stage"
      onclick={() => handleElementClick('stage')}
    />
    <text x="450" y="60" class="label">Stage</text>
    <rect x="420" y="40" width="60" height="30" fill="#111" stroke="#333" />
    <!-- Piano -->
    <text x="450" y="90" class="sublabel">Piano & Performance Area</text>
    <line class="wall" x1="100" y1="120" x2="800" y2="120" />
    <!-- Stage edge -->

    <!-- Dining Tables (Middle Area) -->
    <g class="tables">
      {#each Array(4) as _, row}
        {#each Array(6) as _, col}
          <g
            role="button"
            tabindex="0"
            aria-label="Inspect map area"
            onkeydown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
              }
            }}
            transform="translate({150 + col * 120}, {200 + row * 90})"
            onclick={() => handleElementClick(`table-${row}-${col}`)}
          >
            <circle cx="0" cy="0" r="30" class="table" />
            <!-- Seats -->
            <circle cx="0" cy="-35" r="5" fill="#555" />
            <circle cx="0" cy="35" r="5" fill="#555" />
            <circle cx="-35" cy="0" r="5" fill="#555" />
            <circle cx="35" cy="0" r="5" fill="#555" />
          </g>
        {/each}
      {/each}
    </g>

    <!-- Food Buffets (Bottom Left and Right) -->
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
      x="50"
      y="550"
      width="250"
      height="60"
      class="buffet"
      onclick={() => handleElementClick('buffet-left')}
    />
    <text x="175" y="585" class="label" font-size="14">Food Buffet</text>

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
      x="600"
      y="550"
      width="250"
      height="60"
      class="buffet"
      onclick={() => handleElementClick('buffet-right')}
    />
    <text x="725" y="585" class="label" font-size="14">Food Buffet</text>

    <!-- King's Throne Platform (Bottom Center) -->
    <path
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="throne-platform"
      d="M 350 650 L 350 550 L 550 550 L 550 650 Z"
      onclick={() => handleElementClick('throne-platform')}
    />
    <path class="throne-platform" d="M 370 550 L 370 520 L 530 520 L 530 550 Z" />
    <!-- Stairs -->
    <rect x="420" y="570" width="60" height="60" fill="none" stroke="#FFD700" stroke-width="2" />
    <!-- Throne -->
    <text x="450" y="610" class="sublabel">King's Throne</text>

    <!-- Main Entrance / Passageway (Left Wall) -->
    <line x1="0" y1="300" x2="0" y2="400" stroke="#050505" stroke-width="10" />
    <!-- Opening in wall -->
    <line
      role="button"
      tabindex="0"
      aria-label="Open the main doors"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="door"
      x1="-30"
      y1="300"
      x2="0"
      y2="350"
      onclick={() => handleElementClick('main-doors')}
    />
    <line
      role="button"
      tabindex="0"
      aria-label="Open the main doors"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="door"
      x1="-30"
      y1="400"
      x2="0"
      y2="350"
      onclick={() => handleElementClick('main-doors')}
    />
    <text x="-40" y="355" class="label" font-size="14" transform="rotate(-90 -40 355)"
      >Passageway</text
    >

    <!-- Guards at entrance -->
    <circle cx="20" cy="280" r="10" fill="#4a5568" />
    <circle cx="20" cy="420" r="10" fill="#4a5568" />
  </g>
</svg>
