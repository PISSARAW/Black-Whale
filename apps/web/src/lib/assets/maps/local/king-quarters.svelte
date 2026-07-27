<script lang="ts">
  function inspect(area: string) {
    console.log(`Inspecting ${area} in the King's Living Quarters`)
  }
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') inspect(area)
  }
</script>

<svg
  viewBox="0 0 900 650"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <pattern id="royal-floor" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M0 16 L16 0 L32 16 L16 32 Z" fill="none" stroke="#6f5b2a" stroke-width="1" />
    </pattern>
    <style>
      .wall {
        fill: none;
        stroke: #fffff0;
        stroke-width: 6;
      }
      .zone {
        fill: rgba(255, 215, 0, 0.05);
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(255, 215, 0, 0.14);
      }
      .label {
        fill: #fffff0;
        font: bold 16px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .sub {
        fill: #c8a956;
        font: 12px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .furniture {
        fill: #2a241c;
        stroke: #9a7a35;
        stroke-width: 2;
      }
      .painting {
        fill: #181818;
        stroke: #c8a956;
        stroke-width: 3;
      }
    </style>
  </defs>
  <text x="450" y="38" class="label" font-size="28" fill="#ffd700">Royal Living Quarters</text>
  <g transform="translate(75 75)">
    <rect width="750" height="520" fill="url(#royal-floor)" class="wall" />
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the royal living room"
      class="zone"
      x="40"
      y="55"
      width="670"
      height="390"
      onclick={() => inspect('living-room')}
      onkeydown={(event) => inspectWithKeyboard(event, 'living-room')}
    />
    <text x="375" y="185" class="label">Royal Living Room</text>
    <rect x="235" y="205" width="280" height="95" rx="10" class="furniture" />
    <rect x="105" y="205" width="95" height="170" rx="8" class="furniture" />
    <rect x="550" y="205" width="95" height="170" rx="8" class="furniture" />
    <rect x="315" y="330" width="120" height="55" class="furniture" />
    {#each [135, 285, 435, 585] as x}
      <rect x={x - 35} y="65" width="70" height="90" class="painting" />
    {/each}
    <line x1="300" y1="520" x2="450" y2="520" stroke="#050505" stroke-width="14" />
    <path d="M300 515 Q375 435 450 515" fill="none" stroke="#ffd700" stroke-width="4" />
    <text x="375" y="490" class="sub">Guarded gate toward the Banquet Hall</text>
  </g>
</svg>
