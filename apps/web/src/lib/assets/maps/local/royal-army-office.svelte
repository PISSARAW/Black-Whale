<script lang="ts">
  // Room interactions are not wired up yet. The elements keep their click
  // and keyboard affordances so the behaviour can be attached in one place
  // when it exists; until then this must not log on a public page.
  function handleElementClick(_elementId: string) {}
</script>

<svg
  viewBox="0 0 1000 700"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        stroke: #fffff0;
        stroke-width: 6;
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
      .furniture {
        fill: #333;
        stroke: #666;
        stroke-width: 2;
      }
      .screen {
        fill: #fff;
        stroke: #000;
        stroke-width: 4;
      }
    </style>
  </defs>

  <text x="500" y="40" class="label" font-size="28" fill="#FFD700"
    >Kakin Royal Army Conference Room</text
  >

  <g transform="translate(100, 80)">
    <!-- Room Walls -->
    <rect x="0" y="0" width="800" height="600" class="wall" />

    <!-- Stage Area -->
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
      width="800"
      height="200"
      onclick={() => handleElementClick('stage')}
    />
    <line x1="0" y1="200" x2="800" y2="200" stroke="#444" stroke-width="4" />

    <!-- Big Projector Screen -->
    <rect x="250" y="20" width="300" height="120" class="screen" />
    <text x="400" y="80" class="label text-[#000]" font-size="14"
      >Black Whale Security Briefing</text
    >

    <!-- Whiteboard -->
    <rect x="100" y="50" width="200" height="100" fill="#fff" stroke="#888" stroke-width="4" />
    <!-- Podium -->
    <rect x="350" y="150" width="40" height="40" fill="#555" stroke="#222" stroke-width="2" />

    <!-- U-Shaped Meeting Table -->
    <path
      d="M 250 250 L 550 250 L 550 450 L 450 450 L 450 300 L 350 300 L 350 450 L 250 450 Z"
      class="furniture"
    />
  </g>
</svg>
