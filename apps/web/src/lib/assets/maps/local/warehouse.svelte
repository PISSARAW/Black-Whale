<script lang="ts">
  function inspect(area: string) {
    console.log(`Inspecting ${area} in the Tier 5 warehouse`);
  }
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') inspect(area);
  }
</script>

<svg viewBox="0 0 1000 680" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .wall { fill: none; stroke: #fffff0; stroke-width: 5; }
      .zone { fill: rgba(120,100,65,.1); stroke: #827253; stroke-width: 2; cursor: pointer; }
      .zone:hover { fill: rgba(120,100,65,.22); }
      .label { fill: #fffff0; font: bold 15px sans-serif; text-anchor: middle; pointer-events: none; }
      .sub { fill: #c8a956; font: 11px sans-serif; text-anchor: middle; pointer-events: none; }
      .crate { fill: #30281e; stroke: #826b45; stroke-width: 2; }
      .guard { fill: #52616a; stroke: #9eb0ba; stroke-width: 2; }
    </style>
  </defs>
  <text x="500" y="38" class="label" font-size="28" fill="#ffd700">Cha-R-Controlled Warehouse · Tier 5</text>
  <text x="500" y="60" class="sub">Loaded goods, including items smuggled through the black market</text>
  <g transform="translate(65 90)">
    <rect width="870" height="520" class="wall" />
    <rect role="button" tabindex="0" aria-label="Inspect stored cargo" class="zone" x="25" y="25" width="820" height="385" onclick={() => inspect('cargo')} onkeydown={(event) => inspectWithKeyboard(event, 'cargo')} />
    {#each Array(24) as _, i}
      <rect class="crate" x={60 + (i % 6) * 130} y={70 + Math.floor(i / 6) * 80} width="90" height="52" />
      <path d={`M${60 + (i % 6) * 130} ${70 + Math.floor(i / 6) * 80} l90 52 M${150 + (i % 6) * 130} ${70 + Math.floor(i / 6) * 80} l-90 52`} stroke="#665131" stroke-width="1" />
    {/each}
    <line x1="345" y1="520" x2="525" y2="520" stroke="#050505" stroke-width="16" />
    <text x="435" y="490" class="label">Main Entrance</text>
    <path d="M520 470 h42 l15 12 h-57 z" fill="#b9c1c5" stroke="#222" stroke-width="2" />
    <text x="550" y="505" class="sub">Security camera installed after loading</text>
    {#each [[315,465],[555,465],[315,430],[555,430]] as point}
      <circle class="guard" cx={point[0]} cy={point[1]} r="14" />
    {/each}
    <text x="435" y="448" class="sub">Four guard posts before Luini's attack</text>
  </g>
</svg>
