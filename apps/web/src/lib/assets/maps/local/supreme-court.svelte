<script lang="ts">
  function inspect(area: string) {
    console.log(`Inspecting ${area} in the Supreme Court`);
  }
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') inspect(area);
  }
</script>

<svg viewBox="0 0 900 650" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .wall { fill: none; stroke: #fffff0; stroke-width: 6; }
      .zone { fill: rgba(70,130,180,.08); cursor: pointer; }
      .zone:hover { fill: rgba(70,130,180,.18); }
      .label { fill: #fffff0; font: bold 16px sans-serif; text-anchor: middle; pointer-events: none; }
      .sub { fill: #c8a956; font: 12px sans-serif; text-anchor: middle; pointer-events: none; }
      .desk { fill: #252525; stroke: #788894; stroke-width: 3; }
    </style>
  </defs>
  <text x="450" y="38" class="label" font-size="28" fill="#ffd700">Supreme Court · Tier 1</text>
  <g transform="translate(75 75)">
    <rect width="750" height="500" class="wall" />
    <rect role="button" tabindex="0" aria-label="Inspect Cleapatro's bench" class="zone" x="180" y="25" width="390" height="150" onclick={() => inspect('magistrate-bench')} onkeydown={(event) => inspectWithKeyboard(event, 'magistrate-bench')} />
    <rect x="225" y="105" width="300" height="55" class="desk" />
    <circle cx="375" cy="72" r="25" fill="#d8c7b7" />
    <text x="375" y="145" class="label">Supreme Magistrate Cleapatro</text>
    <rect x="70" y="245" width="220" height="90" class="desk" />
    <rect x="460" y="245" width="220" height="90" class="desk" />
    <text x="180" y="295" class="label">Prosecution</text>
    <text x="570" y="295" class="label">Defense</text>
    <rect role="button" tabindex="0" aria-label="Inspect the hearing area" class="zone" x="300" y="205" width="150" height="185" onclick={() => inspect('hearing-area')} onkeydown={(event) => inspectWithKeyboard(event, 'hearing-area')} />
    <rect x="325" y="270" width="100" height="55" class="desk" />
    <text x="375" y="350" class="sub">Accused / witnesses</text>
    <rect x="85" y="405" width="580" height="55" class="desk" />
    <text x="375" y="438" class="label">Observers and court officials</text>
    <text x="375" y="490" class="sub">Trials and admissibility rulings are conducted here</text>
  </g>
</svg>
