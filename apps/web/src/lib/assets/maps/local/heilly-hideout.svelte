<script lang="ts">
  // Area inspection is not wired up yet; the keyboard and click affordances
  // stay so the behaviour can be attached in one place when it exists.
  function inspect(_area: string) {}
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') inspect(area)
  }
</script>

<svg
  viewBox="0 0 1100 760"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <marker id="uncertain-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"
      ><path d="M0 0 L8 4 L0 8 Z" fill="#8d6ca0" /></marker
    >
    <style>
      .room {
        fill: rgba(125, 75, 150, 0.1);
        stroke: #ad8abd;
        stroke-width: 4;
        cursor: pointer;
      }
      .room:hover {
        fill: rgba(125, 75, 150, 0.22);
      }
      .label {
        fill: #fffff0;
        font: bold 15px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .sub {
        fill: #b99bc6;
        font: 11px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .uncertain {
        fill: none;
        stroke: #8d6ca0;
        stroke-width: 3;
        stroke-dasharray: 10 8;
        marker-end: url(#uncertain-arrow);
      }
      .door {
        fill: #29202d;
        stroke: #ffd700;
        stroke-width: 2;
      }
    </style>
  </defs>
  <text x="550" y="36" class="label" font-size="28" fill="#ffd700"
    >Heil-Ly Secret Hideout · Tier 2</text
  >
  <text x="550" y="58" class="sub"
    >Ch. 398–399 panel details · physical links between rooms remain partly unknown</text
  >
  <g transform="translate(55 95)">
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the processing room"
      class="room"
      x="25"
      y="40"
      width="300"
      height="230"
      onclick={() => inspect('processing-room')}
      onkeydown={(event) => inspectWithKeyboard(event, 'processing-room')}
    />
    <text x="175" y="135" class="label">Processing / Shower Room</text>
    <text x="175" y="152" class="sub">Tiled · Nen-protected walls · seven doors</text>
    <text x="175" y="170" class="sub">showers · floor drains · maintenance shelves</text>
    {#each [0, 1, 2, 3, 4] as i (i)}<rect
        class="door"
        x={65 + i * 48}
        y="32"
        width="28"
        height="16"
      />{/each}
    <rect class="door" x="17" y="135" width="16" height="32" />
    <rect class="door" x="160" y="262" width="32" height="16" />
    <path d="M55 205 q12 -24 24 0 v34" fill="none" stroke="#77a7b8" stroke-width="3" />
    <path d="M95 205 q12 -24 24 0 v34" fill="none" stroke="#77a7b8" stroke-width="3" />
    <circle cx="160" cy="230" r="7" fill="#111" stroke="#777" />
    <circle cx="200" cy="230" r="7" fill="#111" stroke="#777" />
    <rect x="275" y="185" width="38" height="65" fill="#242424" stroke="#777" />
    <line x1="278" y1="205" x2="310" y2="205" stroke="#777" />
    <line x1="278" y1="225" x2="310" y2="225" stroke="#777" />

    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the laundry and disposal room"
      class="room"
      x="25"
      y="370"
      width="300"
      height="230"
      onclick={() => inspect('laundry-disposal')}
      onkeydown={(event) => inspectWithKeyboard(event, 'laundry-disposal')}
    />
    <text x="175" y="455" class="label">Laundry / Disposal Room</text>
    <text x="175" y="478" class="sub">Industrial washers/dryers · sinks · lockers</text>
    <text x="175" y="496" class="sub">wall supplies · drains · two metal worktables</text>
    <rect x="40" y="520" width="54" height="58" fill="#302f34" stroke="#777" />
    <circle cx="67" cy="549" r="17" fill="#111" stroke="#777" />
    <rect x="100" y="520" width="54" height="58" fill="#302f34" stroke="#777" />
    <circle cx="127" cy="549" r="17" fill="#111" stroke="#777" />
    <rect x="164" y="515" width="126" height="28" fill="#332c2c" stroke="#777" />
    <rect x="164" y="550" width="126" height="28" fill="#332c2c" stroke="#777" />
    <rect x="285" y="500" width="28" height="75" fill="#242424" stroke="#777" />
    <rect x="42" y="492" width="108" height="18" fill="#242424" stroke="#777" />

    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the communal room"
      class="room"
      x="415"
      y="370"
      width="300"
      height="230"
      onclick={() => inspect('communal-room')}
      onkeydown={(event) => inspectWithKeyboard(event, 'communal-room')}
    />
    <text x="565" y="440" class="label">Communal Room</text>
    <text x="565" y="460" class="sub">Long table · at least eight chairs · wall storage</text>
    <text x="565" y="478" class="sub">water dispenser · clock · exposed ceiling services</text>
    <rect x="485" y="500" width="160" height="60" rx="5" fill="#302f34" stroke="#777" />
    <rect x="435" y="500" width="35" height="85" fill="#302f34" stroke="#777" />
    {#each [0, 1, 2, 3] as i (i)}
      <circle cx={505 + i * 40} cy="486" r="12" fill="#242424" stroke="#777" />
      <circle cx={505 + i * 40} cy="574" r="12" fill="#242424" stroke="#777" />
    {/each}
    <rect x="680" y="505" width="22" height="58" fill="#263640" stroke="#77a7b8" />
    <rect x="495" y="385" width="145" height="18" fill="#242424" stroke="#777" />
    <path d="M470 414 H660 M490 423 H680" fill="none" stroke="#777" stroke-width="4" />

    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the syndicate leader's office"
      class="room"
      x="805"
      y="370"
      width="180"
      height="230"
      onclick={() => inspect('leader-office')}
      onkeydown={(event) => inspectWithKeyboard(event, 'leader-office')}
    />
    <text x="895" y="430" class="label">Leader's Office</text>
    <text x="895" y="455" class="sub">Desk · facing couch</text>
    <text x="895" y="475" class="sub">TV · consoles · games</text>
    <rect x="840" y="500" width="110" height="42" fill="#302f34" stroke="#777" />
    <rect x="850" y="555" width="90" height="25" fill="#171717" stroke="#777" />

    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the bunker-like corridor"
      class="room"
      x="415"
      y="40"
      width="570"
      height="150"
      onclick={() => inspect('bunker-corridor')}
      onkeydown={(event) => inspectWithKeyboard(event, 'bunker-corridor')}
    />
    <text x="700" y="105" class="label">Bunker-like Corridor</text>
    <text x="700" y="130" class="sub"
      >Frequently shown; exact links to the rooms are unpublished</text
    >
    <path class="uncertain" d="M325 155 H405" />
    <path class="uncertain" d="M565 195 V360" />
    <path class="uncertain" d="M805 195 L710 360" />
  </g>
</svg>
