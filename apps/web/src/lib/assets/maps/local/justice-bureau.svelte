<script lang="ts">
  // Area inspection is not wired up yet; the keyboard and click affordances
  // stay so the behaviour can be attached in one place when it exists.
  function inspect(_area: string) {}
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') inspect(area)
  }
</script>

<svg
  viewBox="0 0 1000 700"
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
        fill: rgba(72, 118, 145, 0.1);
        stroke: #506775;
        stroke-width: 2;
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(72, 118, 145, 0.22);
      }
      .safe {
        fill: rgba(50, 155, 100, 0.1);
        stroke: #4e9d72;
        stroke-width: 3;
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
      .glass {
        fill: rgba(160, 210, 230, 0.1);
        stroke: #a5cedf;
        stroke-width: 3;
      }
    </style>
  </defs>
  <text x="500" y="38" class="label" font-size="28" fill="#ffd700">Justice Bureau · Tier 2</text>
  <text x="500" y="60" class="sub"
    >Ch. 400: signed room 1010 + VIP suite details · five-story layout remains schematic</text
  >
  <g transform="translate(60 90)">
    <rect width="880" height="550" class="wall" />
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the lobby"
      class="zone"
      x="25"
      y="25"
      width="250"
      height="190"
      onclick={() => inspect('lobby')}
      onkeydown={(event) => inspectWithKeyboard(event, 'lobby')}
    />
    <text x="150" y="115" class="label">Lobby</text>
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the deputy minister's office"
      class="zone"
      x="305"
      y="25"
      width="250"
      height="190"
      onclick={() => inspect('deputy-minister-office')}
      onkeydown={(event) => inspectWithKeyboard(event, 'deputy-minister-office')}
    />
    <text x="430" y="100" class="label">Deputy Minister's Office</text>
    <text x="430" y="125" class="sub">Room 1010 · judicial interrogation office</text>
    <rect x="335" y="42" width="190" height="24" fill="#222" stroke="#777" />
    {#each [0, 1, 2, 3, 4] as shelf (shelf)}
      <line x1={347 + shelf * 34} y1="44" x2={347 + shelf * 34} y2="64" stroke="#777" />
    {/each}
    <rect x="392" y="150" width="76" height="30" fill="#292929" stroke="#777" />
    <circle cx="407" cy="194" r="10" fill="#242424" stroke="#777" />
    <circle cx="453" cy="194" r="10" fill="#242424" stroke="#777" />
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect interrogation rooms"
      class="zone"
      x="585"
      y="25"
      width="270"
      height="190"
      onclick={() => inspect('interrogation')}
      onkeydown={(event) => inspectWithKeyboard(event, 'interrogation')}
    />
    <text x="720" y="105" class="label">Interrogation Rooms</text>
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect VIP witness protection"
      class="zone safe"
      x="25"
      y="250"
      width="390"
      height="270"
      onclick={() => inspect('vip-witness-protection')}
      onkeydown={(event) => inspectWithKeyboard(event, 'vip-witness-protection')}
    />
    <text x="220" y="365" class="label">VIP Witness Protection Area</text>
    <text x="220" y="390" class="sub"
      >Coffered ceiling · moulded walls · chandelier · oval mirror</text
    >
    <rect x="55" y="280" width="92" height="125" rx="8" fill="#292929" stroke="#777" />
    <rect x="165" y="300" width="120" height="52" fill="#292929" stroke="#777" />
    {#each [0, 1, 2, 3] as chair (chair)}
      <circle
        cx={182 + (chair % 2) * 86}
        cy={chair < 2 ? 286 : 366}
        r="11"
        fill="#242424"
        stroke="#777"
      />
    {/each}
    <rect x="70" y="445" width="62" height="48" rx="12" fill="#292929" stroke="#777" />
    <rect x="154" y="445" width="62" height="48" rx="12" fill="#292929" stroke="#777" />
    <circle cx="143" cy="469" r="12" fill="#242424" stroke="#777" />
    <rect x="360" y="420" width="28" height="70" fill="#263640" stroke="#777" />
    <ellipse cx="374" cy="330" rx="14" ry="30" fill="none" stroke="#c8a956" stroke-width="3" />
    <text x="220" y="515" class="sub"
      >Bed · dining table · 4 chairs · 2 armchairs · side table · cabinet</text
    >
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the visitation room"
      class="zone"
      x="450"
      y="250"
      width="405"
      height="270"
      onclick={() => inspect('visitation')}
      onkeydown={(event) => inspectWithKeyboard(event, 'visitation')}
    />
    <line x1="652" y1="265" x2="652" y2="505" class="glass" />
    <rect x="590" y="370" width="125" height="35" class="glass" />
    <text x="652" y="330" class="label">Visitation Room</text>
    <text x="550" y="445" class="sub">Visitor</text>
    <text x="755" y="445" class="sub">Protected person</text>
    <text x="652" y="480" class="sub"
      >Glass barrier · recorded 10-minute visits · transfer drawer</text
    >
  </g>
</svg>
