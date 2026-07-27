<script lang="ts">
  // Area inspection is not wired up yet; the keyboard and click affordances
  // stay so the behaviour can be attached in one place when it exists.
  function inspect(_area: string) {}
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') inspect(area)
  }
</script>

<svg
  viewBox="0 0 1000 680"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        fill: none;
        stroke: #fffff0;
        stroke-width: 5;
      }
      .zone {
        fill: rgba(185, 135, 40, 0.08);
        stroke: #8d7335;
        stroke-width: 2;
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(185, 135, 40, 0.2);
      }
      .label {
        fill: #fffff0;
        font: bold 15px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .sub {
        fill: #c8a956;
        font: 11px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .screen {
        fill: #14232a;
        stroke: #6b8792;
        stroke-width: 2;
      }
      .camera {
        fill: #b9c1c5;
        stroke: #222;
        stroke-width: 2;
      }
    </style>
  </defs>
  <text x="500" y="38" class="label" font-size="28" fill="#ffd700"
    >Cha-R Family Office · Tier 5</text
  >
  <text x="500" y="60" class="sub">Middle section beside the propeller</text>
  <g transform="translate(70 90)">
    <rect width="860" height="520" class="wall" />
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the main office"
      class="zone"
      x="25"
      y="25"
      width="360"
      height="300"
      onclick={() => inspect('office')}
      onkeydown={(event) => inspectWithKeyboard(event, 'office')}
    />
    <text x="205" y="90" class="label">Main Office</text>
    <rect x="95" y="155" width="220" height="70" fill="#2b271f" stroke="#8d7335" stroke-width="3" />
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the bedroom"
      class="zone"
      x="25"
      y="355"
      width="360"
      height="140"
      onclick={() => inspect('bedroom')}
      onkeydown={(event) => inspectWithKeyboard(event, 'bedroom')}
    />
    <text x="205" y="425" class="label">Bedroom</text>
    <rect x="75" y="448" width="260" height="28" fill="#d0d5d8" stroke="#6b8792" />
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the monitor room"
      class="zone"
      x="415"
      y="25"
      width="420"
      height="470"
      onclick={() => inspect('monitor-room')}
      onkeydown={(event) => inspectWithKeyboard(event, 'monitor-room')}
    />
    <text x="625" y="78" class="label">Monitor Room</text>
    <text x="625" y="100" class="sub">Surveillance of key Tier 5 areas</text>
    {#each Array(9) as _, i (i)}<rect
        class="screen"
        x={470 + (i % 3) * 105}
        y={140 + Math.floor(i / 3) * 75}
        width="80"
        height="52"
      />{/each}
    <line x1="360" y1="520" x2="500" y2="520" stroke="#39424a" stroke-width="16" />
    <text x="430" y="490" class="sub">Steel smart-lock door</text>
    <path class="camera" d="M340 475 h35 l12 12 h-47 z" />
    <path class="camera" d="M485 475 h35 l12 12 h-47 z" />
    <text x="430" y="510" class="sub">Two entrance cameras</text>
  </g>
</svg>
