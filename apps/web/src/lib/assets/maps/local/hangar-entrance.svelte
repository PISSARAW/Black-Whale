<script lang="ts">
  import { locale } from '$lib/i18n'

  const french = $derived($locale === 'fr')

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
  viewBox="0 0 900 400"
  class="w-full h-full text-[#FFFFF0] bg-[#07090b] rounded-lg border border-[#2a2f35]"
>
  <defs>
    <!-- Hazard diagonal stripes pattern -->
    <pattern
      id="hazard-pattern"
      width="16"
      height="16"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <rect width="8" height="16" fill="#d4a017" />
      <rect x="8" width="8" height="16" fill="#181a1b" />
    </pattern>

    <style>
      .wall {
        fill: none;
        stroke: #777d7f;
        stroke-width: 4;
      }
      .zone {
        fill: rgba(212, 160, 23, 0.06);
        stroke: #875936;
        stroke-width: 1.5;
        cursor: pointer;
        transition:
          fill 0.2s,
          stroke 0.2s;
      }
      .zone:hover {
        fill: rgba(212, 160, 23, 0.18);
        stroke: #d4a017;
      }
      .zone-active {
        fill: rgba(212, 160, 23, 0.26);
        stroke: #ffd700;
        stroke-width: 2.5;
      }
      .gate-body {
        fill: #222629;
        stroke: #d4a017;
        stroke-width: 2;
      }
      .crane-rail {
        stroke: #e5a922;
        stroke-width: 4;
        stroke-dasharray: 8 4;
      }
      .label {
        font-family: monospace;
        font-size: 11px;
        fill: #d4a017;
        font-weight: bold;
        text-anchor: middle;
      }
      .sublabel {
        font-family: sans-serif;
        font-size: 9px;
        fill: #a0a6aa;
        text-anchor: middle;
      }
      .floor-plate {
        fill: rgba(255, 255, 255, 0.02);
        stroke: rgba(255, 255, 255, 0.08);
        stroke-width: 1;
      }
      .barrier-arm {
        stroke: #d4a017;
        stroke-width: 4;
      }
    </style>
  </defs>

  <g id="hangar-entrance-plan">
    <!-- Steel floor plating field (28m x 6.5m metric mapped to x: 50..850, y: 50..350) -->
    <rect class="floor-plate" x="50" y="50" width="800" height="300" />
    {#each [150, 250, 350, 450, 550, 650, 750] as fx (fx)}
      <line x1={fx} y1="50" x2={fx} y2="350" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1" />
    {/each}

    <!-- Overhead Crane Gantry Rail (longitudinal traverse) -->
    <line x1="107" y1="120" x2="793" y2="120" class="crane-rail" />
    <text x="450" y="112" class="sublabel" font-size="8">Overhead Crane Gantry (24m)</text>

    <!-- Traveling Hoist Trolley -->
    <rect
      x="385"
      y="106"
      width="40"
      height="28"
      fill="#e5a922"
      stroke="#181a1b"
      stroke-width="1.5"
      rx="2"
    />
    <circle cx="405" cy="120" r="5" fill="#222629" />

    <!-- North Colossal Blast Gate (10m wide, x = 307 to 593, y = 50) -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect Colossal Hangar Blast Gate"
      class="zone {activeArea === 'hangar-gate' ? 'zone-active' : ''}"
      x="290"
      y="35"
      width="320"
      height="45"
      onclick={() => inspect('hangar-gate')}
      onkeydown={(event) => inspectWithKeyboard(event, 'hangar-gate')}
    />
    <rect class="gate-body" x="307" y="44" width="286" height="16" rx="2" />
    <rect
      x="307"
      y="60"
      width="286"
      height="8"
      fill="url(#hazard-pattern)"
      stroke="#181a1b"
      stroke-width="1"
    />
    <text x="450" y="40" class="label">
      {french ? 'PORTAIL BLINDÉ DU HANGAR (10 m)' : 'COLOSSAL HANGAR BLAST GATE (10m)'}
    </text>

    <!-- Gate hydraulic actuators on jambs -->
    <rect x="295" y="40" width="12" height="24" fill="#3d4449" stroke="#687278" />
    <rect x="593" y="40" width="12" height="24" fill="#3d4449" stroke="#687278" />

    <!-- Safety hazard warning apron bordering gate opening -->
    <rect x="290" y="68" width="320" height="10" fill="url(#hazard-pattern)" opacity="0.8" />

    <!-- West Cargo Staging & Pallets Zone (x = 80 to 220, y = 200 to 300) -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect Cargo Staging and Pallets"
      class="zone {activeArea === 'cargo-staging' ? 'zone-active' : ''}"
      x="80"
      y="190"
      width="155"
      height="115"
      onclick={() => inspect('cargo-staging')}
      onkeydown={(event) => inspectWithKeyboard(event, 'cargo-staging')}
    />
    <!-- Pallets and crates -->
    <rect
      x="90"
      y="200"
      width="45"
      height="35"
      fill="#7a5b3a"
      stroke="#8c6b45"
      stroke-width="1.5"
      rx="1"
    />
    <rect
      x="145"
      y="200"
      width="40"
      height="35"
      fill="#8c6b45"
      stroke="#3d4449"
      stroke-width="1.5"
      rx="1"
    />
    <rect
      x="90"
      y="245"
      width="50"
      height="40"
      fill="#8c6b45"
      stroke="#3d4449"
      stroke-width="1.5"
      rx="1"
    />
    <!-- Pallet jack -->
    <rect x="155" y="255" width="30" height="15" fill="#d4a017" stroke="#222629" />
    <text x="155" y="182" class="label">
      {french ? 'ZONE CALAGE FRET' : 'CARGO STAGING'}
    </text>

    <!-- Security Checkpoint & Boom Barrier (x = 490 to 590, y = 250 to 320) -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect Security Checkpoint and Barrier"
      class="zone {activeArea === 'security-checkpoint' ? 'zone-active' : ''}"
      x="490"
      y="245"
      width="100"
      height="85"
      onclick={() => inspect('security-checkpoint')}
      onkeydown={(event) => inspectWithKeyboard(event, 'security-checkpoint')}
    />
    <!-- Security booth counter -->
    <rect
      x="520"
      y="255"
      width="60"
      height="55"
      fill="#222629"
      stroke="#687278"
      stroke-width="2"
      rx="2"
    />
    <rect x="525" y="260" width="50" height="8" fill="#3d4449" />
    <!-- Control console & CCTV -->
    <circle cx="535" cy="275" r="3" fill="#27ae60" />
    <circle cx="545" cy="275" r="3" fill="#c0392b" />
    <!-- Boom barrier pedestal and arm extending across road -->
    <rect
      x="500"
      y="270"
      width="16"
      height="16"
      fill="#d4a017"
      stroke="#181a1b"
      stroke-width="1.5"
    />
    <line x1="500" y1="278" x2="390" y2="278" class="barrier-arm" stroke-dasharray="12 6" />
    <text x="550" y="325" class="sublabel">
      {french ? 'Poste de Contrôle' : 'Guard Post'}
    </text>

    <!-- East Fluid Drums & Emergency Equipment (x = 690 to 820, y = 200 to 300) -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect Fluid Storage and Safety Equipment"
      class="zone {activeArea === 'safety-equipment' ? 'zone-active' : ''}"
      x="690"
      y="190"
      width="130"
      height="115"
      onclick={() => inspect('safety-equipment')}
      onkeydown={(event) => inspectWithKeyboard(event, 'safety-equipment')}
    />
    <!-- Spill containment basin -->
    <rect
      x="710"
      y="205"
      width="75"
      height="55"
      fill="#222629"
      stroke="#d4a017"
      stroke-width="1.5"
      rx="2"
    />
    <!-- 4 Industrial drums -->
    <circle cx="728" cy="220" r="11" fill="#244b73" stroke="#687278" stroke-width="1.5" />
    <circle cx="762" cy="220" r="11" fill="#244b73" stroke="#687278" stroke-width="1.5" />
    <circle cx="728" cy="245" r="11" fill="#1f543d" stroke="#687278" stroke-width="1.5" />
    <circle cx="762" cy="245" r="11" fill="#1f543d" stroke="#687278" stroke-width="1.5" />
    <!-- Safety bollards -->
    <circle cx="700" cy="270" r="4" fill="#d4a017" stroke="#181a1b" />
    <circle cx="795" cy="270" r="4" fill="#d4a017" stroke="#181a1b" />
    <!-- Wall fire locker -->
    <rect x="740" y="295" width="24" height="12" fill="#9e1b24" stroke="#fffff0" stroke-width="1" />
    <text x="755" y="182" class="label">
      {french ? 'FÛTS & SÉCURITÉ' : 'DRUMS & SAFETY'}
    </text>

    <!-- Room Bulkhead Walls -->
    <!-- North wall flanking the gate -->
    <line x1="50" y1="50" x2="295" y2="50" class="wall" />
    <line x1="605" y1="50" x2="850" y2="50" class="wall" />
    <!-- West and East end walls -->
    <line x1="50" y1="50" x2="50" y2="350" class="wall" />
    <line x1="850" y1="50" x2="850" y2="350" class="wall" />
    <!-- South wall with central opening towards Tier 5 corridor -->
    <line x1="50" y1="350" x2="350" y2="350" class="wall" />
    <line x1="550" y1="350" x2="850" y2="350" class="wall" />
    <!-- South entrance corridor indicator -->
    <text x="450" y="375" class="sublabel" font-size="10">
      {french ? '▲ Vers Coursive Principale du Pont 5' : '▲ To Tier 5 Main Corridor'}
    </text>
  </g>
</svg>
