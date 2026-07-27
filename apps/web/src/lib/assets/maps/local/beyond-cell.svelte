<script lang="ts">
  function handleElementClick(elementId: string) {
    console.log(`Clicked on ${elementId} in the high-security cell area`)
  }
</script>

<svg
  viewBox="0 0 800 600"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        stroke: #fffff0;
        stroke-width: 8;
        fill: none;
      }
      .bars {
        stroke: #999;
        stroke-width: 4;
        fill: none;
        stroke-dasharray: 5, 15;
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
      .manacle {
        stroke: #ffd700;
        stroke-width: 3;
        fill: none;
      }
    </style>
  </defs>

  <text x="400" y="40" class="label" font-size="28" fill="#FFD700">High-Security Holding Cell</text>

  <g transform="translate(100, 100)">
    <!-- Outer Walls -->
    <rect x="0" y="0" width="600" height="400" class="wall" />

    <!-- Cell Area (Left side) -->
    <!-- It is described as very small -->
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
      width="250"
      height="400"
      onclick={() => handleElementClick('beyond-cell')}
    />

    <!-- Bed -->
    <rect x="30" y="100" width="120" height="250" fill="#111" stroke="#333" stroke-width="2" />
    <text x="90" y="225" class="sublabel text-gray-500 text-xs">Bed</text>

    <!-- Manacle bolting right arm to wall -->
    <path class="manacle" d="M 0 160 Q 50 180 110 160" />
    <!-- Chain -->
    <circle cx="110" cy="160" r="10" stroke="#FFD700" stroke-width="2" fill="none" />
    <!-- Cuff -->
    <rect x="0" y="150" width="10" height="20" fill="#FFD700" />
    <!-- Wall Bolt -->

    <!-- Urinal -->
    <path
      d="M 30 30 Q 50 30 50 50 L 50 70 Q 50 90 30 90 L 0 90 L 0 30 Z"
      fill="#222"
      stroke="#444"
      stroke-width="2"
    />
    <text x="25" y="65" class="sublabel text-[9px] text-gray-400">Urinal</text>

    <!-- Cell Bars (Center division) -->
    <line class="bars" x1="250" y1="0" x2="250" y2="400" />

    <!-- Guard Area (Right side) -->
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
      x="250"
      y="0"
      width="350"
      height="400"
      onclick={() => handleElementClick('guard-area')}
    />
    <text x="425" y="40" class="label text-blue-400">Zodiac 24-Hour Watch</text>

    <!-- Guard workstations -->
    <rect x="300" y="80" width="80" height="60" fill="#222" stroke="#444" />
    <text x="340" y="115" class="sublabel text-xs">Station 1</text>
    <rect x="420" y="160" width="80" height="60" fill="#222" stroke="#444" />
    <text x="460" y="195" class="sublabel text-xs">Station 2</text>
    <rect x="300" y="260" width="80" height="60" fill="#222" stroke="#444" />
    <text x="340" y="295" class="sublabel text-xs">Station 3</text>

    <!-- Security Camera -->
    <circle cx="550" cy="50" r="15" fill="#111" stroke="#FFD700" />
    <polygon points="535,60 510,80 520,90 545,70" fill="#FFD700" opacity="0.3" />

    <!-- Entrance to Guard Area -->
    <line x1="600" y1="150" x2="600" y2="250" stroke="#050505" stroke-width="12" />
    <!-- Doorway -->
    <line x1="600" y1="150" x2="650" y2="120" stroke="#FFD700" stroke-width="4" />
    <text x="650" y="200" class="label" font-size="12">To Corridors</text>
  </g>
</svg>
