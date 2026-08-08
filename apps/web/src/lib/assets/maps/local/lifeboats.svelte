<script lang="ts">
  /**
   * Chapter 383, pp. 55–65: launch bay and escape-pod cabin.
   * The cabin is deliberately seatless. Its published views show a ribbed
   * circular shell, the hatch controls and a bare segmented deck around the
   * central post; the former annular bench was not present in the panels.
   */
  // Room interactions are not wired up yet. The elements keep their click
  // and keyboard affordances so the behaviour can be attached in one place
  // when it exists; until then this must not log on a public page.
  function handleElementClick(_elementId: string) {}
</script>

<svg
  viewBox="0 0 1000 600"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        stroke: #fffff0;
        stroke-width: 6;
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
      .lifeboat-exterior {
        fill: #ddd;
        stroke: #333;
        stroke-width: 3;
      }
      .waterway {
        fill: #003366;
        stroke: #001133;
        stroke-width: 2;
        opacity: 0.8;
      }
      .lifeboat-interior {
        fill: #222;
        stroke: #555;
        stroke-width: 4;
      }
      .rib {
        fill: none;
        stroke: #555;
        stroke-width: 2;
      }
      .hatch {
        fill: #151515;
        stroke: #c9c9c0;
        stroke-width: 5;
      }
      .console {
        fill: #333;
        stroke: #9dc4e0;
        stroke-width: 2;
      }
    </style>
  </defs>

  <text x="500" y="40" class="label" font-size="28" fill="#FFD700">Lifeboats</text>

  <g transform="translate(50, 80)">
    <!-- Left Side: Launch Site (Exterior View) -->
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
      y="0"
      width="450"
      height="500"
      onclick={() => handleElementClick('launch-site')}
    />
    <rect x="0" y="0" width="450" height="500" class="wall" />
    <text x="225" y="40" class="label text-blue-400">Launch Site</text>

    <!-- Emergency Door (Keypad Lock) guarded by soldiers -->
    <rect x="0" y="100" width="15" height="80" fill="#f00" stroke="#333" />
    <rect x="15" y="130" width="10" height="20" fill="#333" />
    <!-- Keypad -->
    <text x="50" y="145" class="sublabel text-xs">Emergency Door</text>
    <circle cx="40" cy="110" r="8" fill="#4a5568" />
    <!-- Guard -->
    <circle cx="40" cy="170" r="8" fill="#4a5568" />
    <!-- Guard -->

    <!-- Control Panel -->
    <rect x="50" y="220" width="60" height="40" fill="#333" stroke="#666" />
    <circle cx="65" cy="240" r="5" fill="#f00" />
    <circle cx="80" cy="240" r="5" fill="#0f0" />
    <circle cx="95" cy="240" r="5" fill="#00f" />
    <text x="80" y="280" class="sublabel">Control Unit</text>

    <!-- Waterway leading to outlet -->
    <rect class="waterway" x="150" y="100" width="250" height="300" />
    <line x1="400" y1="100" x2="400" y2="400" stroke="#000" stroke-width="15" />
    <!-- Ship Wall -->
    <rect
      x="390"
      y="200"
      width="20"
      height="100"
      fill="#050505"
      stroke="#333"
      stroke-dasharray="2,2"
    />
    <!-- Outlet Hole -->
    <text x="430" y="250" class="sublabel text-[9px] transform -rotate-90">Outlet Hole</text>
    <text x="275" y="120" class="sublabel text-cyan-500">Waterway</text>

    <!-- Closed Lifeboats placed in waterway -->
    <!-- Pod 1 -->
    <ellipse cx="275" cy="250" rx="40" ry="20" class="lifeboat-exterior" />
    <rect x="255" y="240" width="40" height="20" fill="#555" />
    <!-- Hatch -->
    <text x="275" y="255" class="sublabel text-xs text-black">Pod A</text>

    <!-- Pod 2 -->
    <ellipse cx="275" cy="330" rx="40" ry="20" class="lifeboat-exterior" />
    <rect x="255" y="320" width="40" height="20" fill="#555" />
    <text x="275" y="335" class="sublabel text-xs text-black">Pod B</text>

    <!-- Right Side: Lifeboat Interior -->
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
      x="450"
      y="0"
      width="450"
      height="500"
      onclick={() => handleElementClick('lifeboat-interior')}
    />
    <rect x="450" y="0" width="450" height="500" class="wall" />
    <text x="675" y="40" class="label text-green-400">Lifeboat Interior</text>

    <!-- Circular Pod Interior -->
    <circle cx="675" cy="250" r="180" class="lifeboat-interior" />

    <!-- Ribbed circular shell and bare deck: no seats are shown in ch. 383. -->
    <circle cx="675" cy="250" r="145" class="rib" />
    <circle cx="675" cy="250" r="112" class="rib" />
    <line x1="675" y1="70" x2="675" y2="138" class="rib" />
    <line x1="802" y1="123" x2="754" y2="171" class="rib" />
    <line x1="855" y1="250" x2="787" y2="250" class="rib" />
    <line x1="548" y1="123" x2="596" y2="171" class="rib" />
    <line x1="495" y1="250" x2="563" y2="250" class="rib" />

    <!-- Round exterior hatch, low control console and separate cabinet (p. 60). -->
    <circle cx="675" cy="92" r="32" class="hatch" />
    <rect x="622" y="124" width="106" height="36" rx="4" class="console" />
    <rect x="742" y="124" width="48" height="44" rx="3" class="console" />
    <circle cx="646" cy="142" r="5" fill="#ffd700" />
    <circle cx="664" cy="142" r="5" fill="#9dc4e0" />
    <circle cx="682" cy="142" r="5" fill="#c9c9c0" />

    <!-- Central Pillar -->
    <circle cx="675" cy="250" r="40" fill="#333" stroke="#666" stroke-width="2" />
    <circle cx="675" cy="250" r="20" fill="#555" />
    <!-- Inner pole -->

    <!-- Floor divisions visible around Fugetsu on p. 65. -->
    <line x1="675" y1="105" x2="675" y2="210" stroke="#444" stroke-width="2" />
    <line x1="675" y1="290" x2="675" y2="395" stroke="#444" stroke-width="2" />
    <line x1="530" y1="250" x2="635" y2="250" stroke="#444" stroke-width="2" />
    <line x1="715" y1="250" x2="820" y2="250" stroke="#444" stroke-width="2" />
    <text x="675" y="455" class="sublabel">Bare segmented deck · no passenger seats</text>
  </g>
</svg>
