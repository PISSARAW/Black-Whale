<script lang="ts">
  function inspect(area: string) {
    console.log(`Inspecting ${area} in the Heil-Ly secret hideout`);
  }
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') inspect(area);
  }
</script>

<svg viewBox="0 0 1100 760" class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]">
  <defs>
    <marker id="uncertain-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#8d6ca0" /></marker>
    <style>
      .room { fill: rgba(125,75,150,.1); stroke: #ad8abd; stroke-width: 4; cursor: pointer; }
      .room:hover { fill: rgba(125,75,150,.22); }
      .label { fill: #fffff0; font: bold 15px sans-serif; text-anchor: middle; pointer-events: none; }
      .sub { fill: #b99bc6; font: 11px sans-serif; text-anchor: middle; pointer-events: none; }
      .uncertain { fill: none; stroke: #8d6ca0; stroke-width: 3; stroke-dasharray: 10 8; marker-end: url(#uncertain-arrow); }
      .door { fill: #29202d; stroke: #ffd700; stroke-width: 2; }
    </style>
  </defs>
  <text x="550" y="36" class="label" font-size="28" fill="#ffd700">Heil-Ly Secret Hideout · Between Tiers 2 and 3</text>
  <text x="550" y="58" class="sub">Confirmed rooms and features · their physical connections remain partly unknown</text>
  <g transform="translate(55 95)">
    <rect role="button" tabindex="0" aria-label="Inspect the processing room" class="room" x="25" y="40" width="300" height="230" onclick={() => inspect('processing-room')} onkeydown={(event) => inspectWithKeyboard(event, 'processing-room')} />
    <text x="175" y="135" class="label">Processing / Shower Room</text>
    <text x="175" y="160" class="sub">Seven doors across three walls</text>
    {#each [0,1,2,3,4] as i}<rect class="door" x={65 + i * 48} y="32" width="28" height="16" />{/each}
    <rect class="door" x="17" y="135" width="16" height="32" />
    <rect class="door" x="160" y="262" width="32" height="16" />

    <rect role="button" tabindex="0" aria-label="Inspect the laundry and disposal room" class="room" x="25" y="370" width="300" height="230" onclick={() => inspect('laundry-disposal')} onkeydown={(event) => inspectWithKeyboard(event, 'laundry-disposal')} />
    <text x="175" y="455" class="label">Laundry / Disposal Room</text>
    <text x="175" y="480" class="sub">Laundry equipment · central work table</text>
    <rect x="65" y="515" width="70" height="55" rx="8" fill="#302f34" stroke="#777" />
    <rect x="155" y="510" width="135" height="45" fill="#332c2c" stroke="#777" />

    <rect role="button" tabindex="0" aria-label="Inspect the communal room" class="room" x="415" y="370" width="300" height="230" onclick={() => inspect('communal-room')} onkeydown={(event) => inspectWithKeyboard(event, 'communal-room')} />
    <text x="565" y="440" class="label">Communal Room</text>
    <text x="565" y="465" class="sub">Large table · couch · dartboard · bookcase</text>
    <rect x="485" y="500" width="160" height="60" rx="5" fill="#302f34" stroke="#777" />
    <rect x="435" y="500" width="35" height="85" fill="#302f34" stroke="#777" />

    <rect role="button" tabindex="0" aria-label="Inspect the syndicate leader's office" class="room" x="805" y="370" width="180" height="230" onclick={() => inspect('leader-office')} onkeydown={(event) => inspectWithKeyboard(event, 'leader-office')} />
    <text x="895" y="430" class="label">Leader's Office</text>
    <text x="895" y="455" class="sub">Desk · facing couch</text>
    <text x="895" y="475" class="sub">TV · consoles · games</text>
    <rect x="840" y="500" width="110" height="42" fill="#302f34" stroke="#777" />
    <rect x="850" y="555" width="90" height="25" fill="#171717" stroke="#777" />

    <rect role="button" tabindex="0" aria-label="Inspect the bunker-like corridor" class="room" x="415" y="40" width="570" height="150" onclick={() => inspect('bunker-corridor')} onkeydown={(event) => inspectWithKeyboard(event, 'bunker-corridor')} />
    <text x="700" y="105" class="label">Bunker-like Corridor</text>
    <text x="700" y="130" class="sub">Frequently shown; exact links to the rooms are unpublished</text>
    <path class="uncertain" d="M325 155 H405" />
    <path class="uncertain" d="M565 195 V360" />
    <path class="uncertain" d="M805 195 L710 360" />
  </g>
</svg>
