<script lang="ts">
  function inspect(area: string) {
    console.log(`Inspecting ${area} in the Justice Bureau`);
  }
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') inspect(area);
  }
</script>

<svg viewBox="0 0 1000 700" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <style>
      .wall { fill: none; stroke: #fffff0; stroke-width: 5; }
      .zone { fill: rgba(72,118,145,.1); stroke: #506775; stroke-width: 2; cursor: pointer; }
      .zone:hover { fill: rgba(72,118,145,.22); }
      .safe { fill: rgba(50,155,100,.1); stroke: #4e9d72; stroke-width: 3; }
      .label { fill: #fffff0; font: bold 15px sans-serif; text-anchor: middle; pointer-events: none; }
      .sub { fill: #c8a956; font: 11px sans-serif; text-anchor: middle; pointer-events: none; }
      .glass { fill: rgba(160,210,230,.1); stroke: #a5cedf; stroke-width: 3; }
    </style>
  </defs>
  <text x="500" y="38" class="label" font-size="28" fill="#ffd700">Justice Bureau · Tier 2</text>
  <text x="500" y="60" class="sub">Five-story institution · functional diagram from confirmed rooms</text>
  <g transform="translate(60 90)">
    <rect width="880" height="550" class="wall" />
    <rect role="button" tabindex="0" aria-label="Inspect the lobby" class="zone" x="25" y="25" width="250" height="190" onclick={() => inspect('lobby')} onkeydown={(event) => inspectWithKeyboard(event, 'lobby')} />
    <text x="150" y="115" class="label">Lobby</text>
    <rect role="button" tabindex="0" aria-label="Inspect the deputy minister's office" class="zone" x="305" y="25" width="250" height="190" onclick={() => inspect('deputy-minister-office')} onkeydown={(event) => inspectWithKeyboard(event, 'deputy-minister-office')} />
    <text x="430" y="100" class="label">Deputy Minister's Office</text>
    <text x="430" y="125" class="sub">Bookcases · work desk</text>
    <rect role="button" tabindex="0" aria-label="Inspect interrogation rooms" class="zone" x="585" y="25" width="270" height="190" onclick={() => inspect('interrogation')} onkeydown={(event) => inspectWithKeyboard(event, 'interrogation')} />
    <text x="720" y="105" class="label">Interrogation Rooms</text>
    <rect role="button" tabindex="0" aria-label="Inspect VIP witness protection" class="zone safe" x="25" y="250" width="390" height="270" onclick={() => inspect('vip-witness-protection')} onkeydown={(event) => inspectWithKeyboard(event, 'vip-witness-protection')} />
    <text x="220" y="365" class="label">VIP Witness Protection Area</text>
    <text x="220" y="390" class="sub">Lavishly furnished · described as the safest place aboard</text>
    <rect role="button" tabindex="0" aria-label="Inspect the visitation room" class="zone" x="450" y="250" width="405" height="270" onclick={() => inspect('visitation')} onkeydown={(event) => inspectWithKeyboard(event, 'visitation')} />
    <line x1="652" y1="265" x2="652" y2="505" class="glass" />
    <rect x="590" y="370" width="125" height="35" class="glass" />
    <text x="652" y="330" class="label">Visitation Room</text>
    <text x="550" y="445" class="sub">Visitor</text>
    <text x="755" y="445" class="sub">Protected person</text>
    <text x="652" y="480" class="sub">Glass barrier · recorded 10-minute visits · transfer drawer</text>
  </g>
</svg>
