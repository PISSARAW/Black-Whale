<script lang="ts">
  function inspect(area: string) {
    console.log(`Inspecting ${area} in the Heil-Ly office`);
  }
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') inspect(area);
  }
</script>

<svg viewBox="0 0 900 650" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .wall { fill: none; stroke: #fffff0; stroke-width: 6; }
      .zone { fill: rgba(130,65,165,.09); cursor: pointer; }
      .zone:hover { fill: rgba(130,65,165,.2); }
      .label { fill: #fffff0; font: bold 16px sans-serif; text-anchor: middle; pointer-events: none; }
      .sub { fill: #b58bc9; font: 12px sans-serif; text-anchor: middle; pointer-events: none; }
      .sealed { stroke: #d35b5b; stroke-width: 7; stroke-dasharray: 12 7; }
    </style>
  </defs>
  <text x="450" y="38" class="label" font-size="28" fill="#ffd700">Heil-Ly Family Office · Tier 3</text>
  <text x="450" y="60" class="sub">Official registered office · abandoned early in the voyage</text>
  <g transform="translate(100 90)">
    <rect width="700" height="480" class="wall" />
    <rect role="button" tabindex="0" aria-label="Inspect the abandoned office" class="zone" x="35" y="35" width="630" height="315" onclick={() => inspect('abandoned-office')} onkeydown={(event) => inspectWithKeyboard(event, 'abandoned-office')} />
    <text x="350" y="170" class="label">Abandoned Office</text>
    <text x="350" y="200" class="sub">Registered Heil-Ly premises searched by Kakin soldiers</text>
    <line x1="275" y1="480" x2="425" y2="480" class="sealed" />
    <text x="350" y="450" class="sub">Sealed public entrance</text>
    <rect role="button" tabindex="0" aria-label="Inspect the passage toward the Tier 1 quarters" class="zone" x="520" y="350" width="145" height="95" onclick={() => inspect('tier-1-passage')} onkeydown={(event) => inspectWithKeyboard(event, 'tier-1-passage')} />
    <path d="M555 395 H630 M610 375 L630 395 L610 415" fill="none" stroke="#ffd700" stroke-width="4" />
    <text x="592" y="438" class="sub">Passage to private Tier 1 quarters</text>
  </g>
</svg>
