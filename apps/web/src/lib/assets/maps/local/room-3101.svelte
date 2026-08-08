<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'

  function handleTrapClick() {
    mapState.selectLocation('heilly-hideout')
  }
</script>

<svg viewBox="0 0 800 600" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .wall {
        stroke: #fffff0;
        stroke-width: 4;
        fill: none;
      }
      .trap {
        stroke: #ff4444;
        stroke-width: 4;
        fill: none;
        cursor: pointer;
      }
      .zone {
        fill: #1a202c;
        stroke: #4a5568;
        stroke-width: 1;
        transition: fill 0.2s;
      }
      .zone:hover {
        fill: #2d3748;
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 14px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <text x="400" y="30" class="label" font-size="24">Room 3101 · Heil-Ly Bathroom Trap</text>
  <text x="400" y="52" class="label text-[11px] text-gray-400"
    >Ch. 398 pp. 150–153 · ordinary cabin outside the trapped threshold</text
  >

  <!-- Outer walls -->
  <rect x="200" y="100" width="400" height="400" class="wall" />

  <!-- Pièce principale -->
  <rect class="zone" x="200" y="100" width="400" height="400" />

  <text x="365" y="185" class="label">Living Area / Bedroom</text>
  <text x="365" y="207" class="label text-xs text-gray-400"
    >Broad clear floor before the bathroom door</text
  >

  <!-- Furniture visible in the ordinary cabin around the trap. -->
  <rect x="225" y="125" width="90" height="145" rx="8" fill="#2d3748" stroke="#718096" />
  <text x="270" y="290" class="label text-[11px]">Bed</text>
  <rect x="500" y="125" width="75" height="115" fill="#2d3748" stroke="#718096" />
  <line x1="537" y1="125" x2="537" y2="240" stroke="#718096" />
  <text x="537" y="260" class="label text-[11px]">Tall storage</text>

  <!-- Ordinary entrance; the bathroom threshold, not this door, is the trap. -->
  <rect x="380" y="490" width="40" height="20" fill="#2d3748" stroke="#ffd700" stroke-width="3" />
  <text x="400" y="535" class="label text-xs text-[#ffd700]">Ordinary entrance</text>

  <!-- Bathroom volume and its trapped threshold. -->
  <rect x="430" y="340" width="170" height="160" fill="#2d3748" stroke="#718096" stroke-width="2" />
  <text x="515" y="410" class="label text-xs">Bathroom</text>
  <text x="515" y="430" class="label text-[10px] text-gray-400"
    >Fixture positions reconstructed</text
  >
  <rect x="535" y="455" width="48" height="25" rx="8" fill="#1a202c" stroke="#718096" />
  <circle cx="475" cy="470" r="16" fill="#1a202c" stroke="#718096" />
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
    class="trap"
    x="420"
    y="390"
    width="20"
    height="55"
    fill="#2d3748"
    onclick={handleTrapClick}
  />
  <text
    role="button"
    tabindex="0"
    aria-label="Open the main door"
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    }}
    x="430"
    y="325"
    class="label text-xs text-[#ff4444] cursor-pointer"
    onclick={handleTrapClick}>Bathroom threshold = teleport trap</text
  >
</svg>
