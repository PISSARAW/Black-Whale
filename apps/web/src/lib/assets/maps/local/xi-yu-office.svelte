<script lang="ts">
  // Area inspection is not wired up yet; the keyboard and click affordances
  // stay so the behaviour can be attached in one place when it exists.
  function inspect(_area: string) {}
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') inspect(area)
  }
</script>

<svg
  viewBox="0 0 900 650"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        fill: none;
        stroke: #fffff0;
        stroke-width: 6;
      }
      .zone {
        fill: rgba(195, 150, 45, 0.08);
        stroke: #8d7335;
        stroke-width: 2;
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(195, 150, 45, 0.18);
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
      .desk {
        fill: #29251e;
        stroke: #8d7335;
        stroke-width: 3;
      }
    </style>
  </defs>
  <text x="450" y="38" class="label" font-size="28" fill="#ffd700"
    >Xi-Yu Family Office · Tier 4</text
  >
  <text x="450" y="60" class="sub">Forward section, inside the Black Whale's “teeth”</text>
  <g transform="translate(85 90)">
    <path d="M0 40 L120 0 H610 L730 40 V500 H0 Z" class="wall" />
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the Xi-Yu meeting office"
      class="zone"
      x="55"
      y="55"
      width="620"
      height="310"
      onclick={() => inspect('meeting-office')}
      onkeydown={(event) => inspectWithKeyboard(event, 'meeting-office')}
    />
    <text x="365" y="105" class="label">Family Meeting Office</text>
    <rect x="180" y="175" width="370" height="95" rx="8" class="desk" />
    {#each [220, 300, 380, 460, 540] as x (x)}<circle
        cx={x}
        cy="145"
        r="17"
        fill="#4a4a4a"
      />{/each}
    {#each [220, 300, 380, 460, 540] as x (x)}<circle
        cx={x}
        cy="300"
        r="17"
        fill="#4a4a4a"
      />{/each}
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the public entrance"
      class="zone"
      x="250"
      y="395"
      width="230"
      height="80"
      onclick={() => inspect('entrance')}
      onkeydown={(event) => inspectWithKeyboard(event, 'entrance')}
    />
    <text x="365" y="442" class="label">Guarded Entrance</text>
    <text x="365" y="490" class="sub"
      >Office interior is only partially shown; spacing is schematic</text
    >
  </g>
</svg>
