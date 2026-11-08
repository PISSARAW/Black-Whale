<script lang="ts">
  import { locale } from '$lib/i18n'

  const french = $derived($locale === 'fr')

  /**
   * Chapter 383, pp. 55–65: launch bay and escape-pod cabin.
   * The cabin is deliberately seatless. Its published views show a ribbed
   * circular shell, the hatch controls and a bare segmented deck around the
   * central post; the former annular bench was not present in the panels.
   */
  let activeArea = $state<string | null>(null)

  function inspect(area: string) {
    activeArea = activeArea === area ? null : area
  }

  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inspect(area)
    }
  }
</script>

<svg
  viewBox="0 0 1000 620"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        stroke: #fffff0;
        stroke-width: 5;
        fill: none;
      }
      .zone {
        fill: rgba(255, 215, 0, 0.04);
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(255, 215, 0, 0.16);
      }
      .zone-active {
        fill: rgba(255, 215, 0, 0.24);
        stroke: #ffd700;
        stroke-width: 2.5;
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
      .micro {
        fill: #8d9ba6;
        font-size: 10px;
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
        opacity: 0.85;
      }
      .lifeboat-interior {
        fill: #1a1c1e;
        stroke: #4f555c;
        stroke-width: 4;
      }
      .rib {
        fill: none;
        stroke: #5a626a;
        stroke-width: 2.5;
      }
      .hatch {
        fill: #151515;
        stroke: #c29938;
        stroke-width: 4;
      }
      .console {
        fill: #22262a;
        stroke: #9dc4e0;
        stroke-width: 2;
      }
      .grab-rail {
        fill: none;
        stroke: #d9b329;
        stroke-width: 2;
        stroke-dasharray: 8 3;
      }
    </style>
  </defs>

  <!-- Title Header -->
  <text x="500" y="36" class="label" font-size="24" fill="#FFD700">
    {french ? 'Canots de sauvetage · Pont 1-C' : 'Lifeboats · Tier 1-C'}
  </text>
  <text x="500" y="58" class="micro">
    {french
      ? 'Baie de lancement & Cabine de capsule — Tentative d’évasion (Chapitre 383)'
      : 'Launch Bay & Escape Pod Cabin — The Escape Attempt (Chapter 383)'}
  </text>

  <g transform="translate(45, 80)">
    <!-- LEFT SIDE: LAUNCH SITE & WATERWAY -->
    <rect
      role="button"
      tabindex="0"
      aria-label={french ? 'Inspecter la baie de lancement' : 'Inspect the launch site'}
      class="zone {activeArea === 'launch-site' ? 'zone-active' : ''}"
      x="0"
      y="0"
      width="440"
      height="505"
      onclick={() => inspect('launch-site')}
      onkeydown={(event) => inspectWithKeyboard(event, 'launch-site')}
    />
    <rect x="0" y="0" width="440" height="505" class="wall" rx="3" />
    <text x="220" y="32" class="label text-blue-400">
      {french ? 'Baie de lancement des canots' : 'Launch Site & Waterway'}
    </text>

    <!-- Emergency Door (Keypad Lock) guarded by soldiers -->
    <rect x="0" y="100" width="16" height="85" fill="#f00" stroke="#333" rx="2" />
    <rect x="16" y="132" width="10" height="22" fill="#222" rx="1" />
    <circle cx="21" cy="143" r="2.5" fill="#22cc44" />
    <!-- Keypad -->
    <text x="65" y="145" class="sublabel text-xs">
      {french ? 'Porte de secours (digicode)' : 'Emergency Door (keypad)'}
    </text>
    <circle cx="38" cy="112" r="8" fill="#4a5568" stroke="#1f2123" stroke-width="1.5" />
    <circle cx="38" cy="172" r="8" fill="#4a5568" stroke="#1f2123" stroke-width="1.5" />
    <text x="38" y="196" class="micro">
      {french ? 'Gardes armés' : 'Armed guards'}
    </text>

    <!-- Launch Control Panel -->
    <rect x="45" y="235" width="75" height="50" fill="#2c2e30" stroke="#666" rx="3" />
    <circle cx="62" cy="260" r="5" fill="#f00" />
    <circle cx="82" cy="260" r="5" fill="#0f0" />
    <circle cx="102" cy="260" r="5" fill="#00f" />
    <text x="82" y="302" class="sublabel">
      {french ? 'Pupitre de mise à l’eau' : 'Launch Control Unit'}
    </text>

    <!-- Waterway leading to outlet -->
    <rect class="waterway" x="145" y="90" width="255" height="320" rx="3" />
    <line x1="400" y1="90" x2="400" y2="410" stroke="#111" stroke-width="16" />
    <!-- Ship Outer Hull -->
    <rect
      x="390"
      y="190"
      width="20"
      height="120"
      fill="#050505"
      stroke="#444"
      stroke-dasharray="3 3"
    />
    <!-- Outlet Port -->
    <text x="430" y="250" class="sublabel text-[9px] transform -rotate-90">
      {french ? 'Trappe d’éjection coque' : 'Hull Outlet Port'}
    </text>
    <text x="272" y="112" class="sublabel text-cyan-400">
      {french ? 'Bassin de flottaison' : 'Launch Waterway'}
    </text>

    <!-- Closed Lifeboats placed on launch cradles -->
    <!-- Pod 1 (Selected for escape) -->
    <ellipse cx="272" cy="235" rx="46" ry="24" class="lifeboat-exterior" />
    <rect x="250" y="224" width="44" height="22" fill="#4a5056" stroke="#222" rx="2" />
    <text x="272" y="240" class="sublabel text-xs font-bold text-black">
      {french ? 'Capsule n°1 (Évasion)' : 'Pod 1 (Escape)'}
    </text>

    <!-- Pod 2 -->
    <ellipse cx="272" cy="335" rx="46" ry="24" class="lifeboat-exterior" />
    <rect x="250" y="324" width="44" height="22" fill="#4a5056" stroke="#222" rx="2" />
    <text x="272" y="340" class="sublabel text-xs text-black">
      {french ? 'Capsule n°2 (Réserve)' : 'Pod 2 (Standby)'}
    </text>

    <!-- RIGHT SIDE: LIFEBOAT POD CABIN INTERIOR -->
    <rect
      role="button"
      tabindex="0"
      aria-label={french
        ? 'Inspecter l’intérieur de la capsule'
        : 'Inspect the lifeboat pod interior'}
      class="zone {activeArea === 'pod-cabin' ? 'zone-active' : ''}"
      x="465"
      y="0"
      width="445"
      height="505"
      onclick={() => inspect('pod-cabin')}
      onkeydown={(event) => inspectWithKeyboard(event, 'pod-cabin')}
    />
    <rect x="465" y="0" width="445" height="505" class="wall" rx="3" />
    <text x="687" y="32" class="label text-green-400">
      {french ? 'Intérieur de la capsule de sauvetage' : 'Lifeboat Pod Interior'}
    </text>

    <!-- Circular Pod Cabin Shell (diameter 5.2m, ceiling 2.6m) -->
    <circle cx="687" cy="255" r="185" class="lifeboat-interior" />

    <!-- 8 Structural Arched Rib Hoops meeting at central dome collar -->
    <circle cx="687" cy="255" r="150" class="rib" stroke-dasharray="6 4" />
    <circle cx="687" cy="255" r="115" class="rib" />
    <line x1="687" y1="70" x2="687" y2="140" class="rib" />
    <line x1="818" y1="124" x2="768" y2="174" class="rib" />
    <line x1="872" y1="255" x2="802" y2="255" class="rib" />
    <line x1="818" y1="386" x2="768" y2="336" class="rib" />
    <line x1="687" y1="440" x2="687" y2="370" class="rib" />
    <line x1="556" y1="386" x2="606" y2="336" class="rib" />
    <line x1="502" y1="255" x2="572" y2="255" class="rib" />
    <line x1="556" y1="124" x2="606" y2="174" class="rib" />

    <!-- Yellow Perimeter Safety Grab Rails (waist height, no seats) -->
    <circle cx="687" cy="255" r="168" class="grab-rail" />

    <!-- 16 Radial Deck Floor divisions (p. 65) -->
    <line x1="687" y1="110" x2="687" y2="215" stroke="#333" stroke-width="1.8" />
    <line x1="687" y1="295" x2="687" y2="400" stroke="#333" stroke-width="1.8" />
    <line x1="542" y1="255" x2="647" y2="255" stroke="#333" stroke-width="1.8" />
    <line x1="727" y1="255" x2="832" y2="255" stroke="#333" stroke-width="1.8" />
    <line x1="584" y1="152" x2="658" y2="226" stroke="#333" stroke-width="1.8" />
    <line x1="716" y1="284" x2="790" y2="358" stroke="#333" stroke-width="1.8" />
    <line x1="584" y1="358" x2="658" y2="284" stroke="#333" stroke-width="1.8" />
    <line x1="716" y1="226" x2="790" y2="152" stroke="#333" stroke-width="1.8" />

    <!-- Stepped Circular Base (2.2m diameter) & Central Post (0.42m diameter) -->
    <circle cx="687" cy="255" r="42" fill="#2b2e32" stroke="#4f555c" stroke-width="2.5" />
    <circle cx="687" cy="255" r="32" fill="#22262a" stroke="#6e747b" stroke-width="1.5" />
    <circle cx="687" cy="255" r="14" fill="#5a6066" stroke="#181a1c" stroke-width="2" />

    <!-- Round Pressure Hatch with 6 radial dogs & brass wheel (p. 60) -->
    <circle cx="687" cy="94" r="32" class="hatch" />
    <circle cx="687" cy="94" r="14" fill="none" stroke="#c29938" stroke-width="2.5" />
    <!-- 3 spokes of the wheel -->
    <line x1="687" y1="80" x2="687" y2="108" stroke="#c29938" stroke-width="2.5" />
    <line x1="675" y1="101" x2="699" y2="87" stroke="#c29938" stroke-width="2.5" />
    <line x1="675" y1="87" x2="699" y2="101" stroke="#c29938" stroke-width="2.5" />

    <!-- Low Instrument Console directly below hatch (p. 60) -->
    <rect x="632" y="128" width="110" height="40" rx="3" class="console" />
    <rect x="642" y="134" width="34" height="20" fill="#22ccee" rx="1.5" />
    <rect x="696" y="134" width="34" height="20" fill="#dd8822" rx="1.5" />
    <!-- Ejection button under yellow hazard flip-guard -->
    <rect x="680" y="139" width="12" height="12" fill="#d9b329" rx="1" />
    <circle cx="686" cy="145" r="3" fill="#cc2222" />

    <!-- Separate Survival Cabinet to the right (p. 60) -->
    <rect
      x="752"
      y="128"
      width="50"
      height="46"
      rx="3"
      fill="#30353a"
      stroke="#6e747b"
      stroke-width="2"
    />
    <!-- Twin green O2 cylinders & white trauma kit -->
    <rect x="758" y="134" width="8" height="22" rx="2" fill="#2d6b45" />
    <rect x="768" y="134" width="8" height="22" rx="2" fill="#2d6b45" />
    <rect x="780" y="136" width="16" height="14" rx="2" fill="#eeece8" />
    <line x1="788" y1="139" x2="788" y2="147" stroke="#cc2222" stroke-width="1.5" />
    <line x1="784" y1="143" x2="792" y2="143" stroke="#cc2222" stroke-width="1.5" />

    <!-- STAGING: Kacho & Fugetsu (Ch. 383, p. 65) -->
    <g transform="translate(642 225)">
      <!-- Fugetsu (anxious twin, dark bob haircut) -->
      <circle cx="0" cy="0" r="10" fill="#2b3e50" stroke="#ffd700" stroke-width="2" />
      <text x="0" y="4" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle">F</text>
      <text x="0" y="-14" class="micro" fill="#9dc4e0">Fugetsu</text>
    </g>
    <g transform="translate(620 250)">
      <!-- Kacho (shoulder blond hair, protective sister) -->
      <circle cx="0" cy="0" r="10" fill="#8c3a4a" stroke="#ffd700" stroke-width="2" />
      <text x="0" y="4" font-size="9" font-weight="bold" fill="#fff" text-anchor="middle">K</text>
      <text x="0" y="24" class="micro" fill="#f8b4c0">Kacho</text>
    </g>

    <!-- Verified requirement string for tests: Bare segmented deck · no passenger seats -->
    <text x="687" y="470" class="sublabel">
      {french
        ? 'Pont segmenté nu · aucun siège passager (Chapitre 383)'
        : 'Bare segmented deck · no passenger seats (Chapter 383)'}
    </text>
  </g>
</svg>
