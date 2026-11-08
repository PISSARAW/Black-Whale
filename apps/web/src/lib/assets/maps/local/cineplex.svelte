<script lang="ts">
  // Room interactions keep their keyboard and click affordances so behaviour
  // can be attached in one place when it exists.
  function handleElementClick(_elementId: string) {}
</script>

<svg
  viewBox="0 0 1000 800"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        stroke: #fffff0;
        stroke-width: 4;
        fill: none;
      }
      .zone {
        fill: rgba(255, 215, 0, 0.05);
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(255, 215, 0, 0.15);
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 16px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #ffd700;
        font-size: 12px;
        pointer-events: none;
        text-anchor: middle;
      }
      .counter {
        fill: #222;
        stroke: #666;
        stroke-width: 3;
      }
      .pillar {
        fill: #1a1a1a;
        stroke: #444;
        stroke-width: 4;
      }
      .screen-sign {
        fill: #111;
        stroke: #555;
        stroke-width: 2;
      }
      .seat-row {
        fill: #292929;
        stroke: #8b7c68;
        stroke-width: 2;
      }
      .ornate {
        fill: none;
        stroke: #8b7c68;
        stroke-width: 3;
      }
      .stanchion {
        fill: #d4af37;
        stroke: #8b7c68;
        stroke-width: 1.5;
      }
      .velvet-rope {
        stroke: #851724;
        stroke-width: 3;
        fill: none;
      }
      .popcorn-glow {
        fill: #f5d77f;
      }
      .rail {
        stroke: #d4af37;
        stroke-width: 2.5;
        fill: none;
      }
      .led-guide {
        stroke: #3d7499;
        stroke-width: 1.5;
        stroke-dasharray: 4 2;
      }
    </style>
  </defs>

  <text x="500" y="36" class="label" font-size="26" fill="#FFD700">Cineplex Concourse (Chapitre 393)</text>
  <text x="500" y="56" class="sublabel">Grand hall ouvert · billetterie · confiserie/pop-corn · rampe des salles</text>

  <g transform="translate(50, 70)">
    <!-- Left: Food & Drinks Concession -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="0"
      y="80"
      width="270"
      height="320"
      onclick={() => handleElementClick('food-drinks')}
    />
    <!-- Concession Counter Body -->
    <rect x="10" y="180" width="240" height="70" rx="4" class="counter" />
    <rect x="8" y="176" width="244" height="10" rx="2" fill="#2a2a2e" stroke="#444" />

    <!-- Popcorn Machine on Counter -->
    <rect x="25" y="145" width="45" height="40" rx="3" fill="#cc292b" stroke="#777" />
    <rect x="28" y="152" width="39" height="26" fill="#88c0d0" opacity="0.6" />
    <circle cx="47" cy="165" r="8" class="popcorn-glow" />
    <text x="47" y="140" class="sublabel" font-size="9">POPCORN</text>

    <!-- Hot Snack Showcase -->
    <rect x="80" y="155" width="60" height="28" rx="2" fill="#88c0d0" opacity="0.4" stroke="#555" />
    <line x1="82" y1="168" x2="138" y2="168" stroke="#f5d77f" stroke-width="2" />

    <!-- Soda Fountain -->
    <rect x="155" y="150" width="40" height="32" rx="2" fill="#768088" stroke="#333" />
    {#each [160, 168, 176, 184] as tap (tap)}
      <circle cx={tap} cy="162" r="2.5" fill="#1a1a1a" />
    {/each}

    <!-- POS Registers -->
    <rect x="205" y="168" width="16" height="12" fill="#222" stroke="#555" />
    <rect x="228" y="168" width="16" height="12" fill="#222" stroke="#555" />

    <!-- Overhead Menu Board -->
    <rect x="15" y="100" width="230" height="35" rx="3" fill="#111" stroke="#444" />
    <text x="130" y="122" class="label text-yellow-500" font-size="14">FOOD &amp; DRINKS</text>

    <!-- Center: Descending Corridor Ramp to screens -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="330"
      y="110"
      width="340"
      height="380"
      onclick={() => handleElementClick('screens-corridor')}
    />

    <!-- Huge Movie Poster Marquee above ramp -->
    <rect x="340" y="50" width="320" height="65" rx="4" class="screen-sign" />
    <text x="500" y="85" class="label text-red-500" font-size="22">THE THING</text>
    <text x="500" y="104" class="sublabel" font-size="11">NOW SHOWING · SCREENS 1 - 8</text>

    <!-- Descending Ramp Perspective and Guardrails -->
    <line x1="360" y1="120" x2="430" y2="350" class="rail" />
    <line x1="640" y1="120" x2="570" y2="350" class="rail" />
    {#each [150, 190, 230, 270, 310] as rz (rz)}
      <line x1={360 + (rz - 120) * 0.3} y1={rz} x2={640 - (rz - 120) * 0.3} y2={rz} class="led-guide" />
    {/each}
    <rect x="420" y="340" width="160" height="26" rx="3" fill="#0c0c10" stroke="#444" />
    <text x="500" y="357" class="sublabel" font-size="10">HALL DES SALLES (1–8)</text>

    <!-- Portails d'accès aux 8 auditoriums -->
    <g transform="translate(290, 375)">
      {#each [1, 2, 3, 4, 5, 6, 7, 8] as num (num)}
        <rect x={(num - 1) * 52} y="0" width="46" height="20" rx="3" fill="#141418" stroke="#d4af37" stroke-width="1.2" />
        <text x={(num - 1) * 52 + 23} y="14" class="sublabel" font-size="9">S{num}</text>
      {/each}
    </g>

    <!-- Foreground Massive Pillar with Posters -->
    <rect class="pillar" x="650" y="120" width="50" height="280" rx="3" />
    <rect x="655" y="160" width="40" height="60" fill="#1b2a38" stroke="#777" />
    <text x="675" y="195" class="sublabel" font-size="8">POSTER</text>

    <!-- Circular Seating Island (Hisoka / Bonolenov with Popcorn) -->
    <g transform="translate(180, 380)">
      <circle cx="0" cy="0" r="48" fill="#1a1215" stroke="#851724" stroke-width="4" />
      <circle cx="0" cy="0" r="22" fill="#36241b" stroke="#666" stroke-width="2" />
      <!-- Popcorn bucket & drink cup on the island table -->
      <circle cx="6" cy="4" r="7" class="popcorn-glow" stroke="#cc292b" stroke-width="2" />
      <circle cx="-8" cy="-5" r="4" fill="#203550" stroke="#eee" stroke-width="1.5" />
      <text x="0" y="62" class="sublabel" font-size="10">Ilot central · Hisoka (pop-corn)</text>
    </g>

    <!-- Right: Tickets Desk -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="730"
      y="80"
      width="270"
      height="320"
      onclick={() => handleElementClick('tickets')}
    />
    <!-- Ticket Counter Body -->
    <rect x="750" y="180" width="230" height="70" rx="4" class="counter" />
    <rect x="748" y="176" width="234" height="10" rx="2" fill="#2a2a2e" stroke="#444" />

    <!-- 3 Glazed Ticket Booth Windows -->
    {#each [770, 840, 910] as wx (wx)}
      <rect x={wx} y="130" width="55" height="50" fill="#88c0d0" opacity="0.4" stroke="#768088" />
      <circle cx={wx + 27} cy="155" r="4" fill="#768088" />
      <rect x={wx + 15} y="174" width="25" height="4" fill="#18181c" />
    {/each}

    <!-- Timetable Screens -->
    <rect x="755" y="95" width="220" height="35" rx="3" fill="#0c1520" stroke="#3d7499" />
    <text x="865" y="117" class="label text-blue-400" font-size="14">TICKETS &amp; SÉANCES</text>

    <!-- Queue Guidance Stanchions & Velvet Ropes -->
    {#each [770, 840, 910] as sx (sx)}
      <line x1={sx + 10} y1="210" x2={sx + 10} y2="280" class="velvet-rope" />
      <circle cx={sx + 10} cy="210" r="4" class="stanchion" />
      <circle cx={sx + 10} cy="245" r="4" class="stanchion" />
      <circle cx={sx + 10} cy="280" r="4" class="stanchion" />
    {/each}
  </g>

  <!-- Ch. 393 pp. 60–61 shows one auditorium but never gives its screen number. -->
  <g transform="translate(80 610)">
    <rect
      x="0"
      y="0"
      width="840"
      height="155"
      rx="8"
      fill="#0d0d0d"
      stroke="#8b7c68"
      stroke-width="3"
    />
    <text x="420" y="24" class="label">Unidentified auditorium · panel-confirmed interior</text>
    <text x="420" y="43" class="sublabel"
      >Raked padded rows · coffered/ornate trim · framed posters above the doors</text
    >
    <rect x="34" y="63" width="150" height="70" fill="#080808" stroke="#777" stroke-width="3" />
    <text x="109" y="101" class="sublabel">PROJECTION SCREEN</text>
    {#each [0, 1, 2, 3, 4, 5] as row (row)}
      <rect x={230 + row * 82} y={66 + row * 8} width="64" height="58" rx="8" class="seat-row" />
      <line
        x1={238 + row * 82}
        y1={80 + row * 8}
        x2={286 + row * 82}
        y2={80 + row * 8}
        stroke="#555"
      />
    {/each}
    <path d="M220 54 H780 M230 54 Q500 12 770 54" class="ornate" />
    <rect x="784" y="64" width="28" height="68" fill="#171717" stroke="#666" />
    <rect x="780" y="49" width="36" height="13" fill="#222" stroke="#8b7c68" />
    <text x="798" y="145" class="sublabel">poster + door</text>
  </g>
</svg>
