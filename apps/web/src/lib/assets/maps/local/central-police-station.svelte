<script lang="ts">
  // Room interactions keep their keyboard/click affordances for map navigation
  function handleElementClick(_elementId: string) {}

  const portColumns = [80, 180, 280, 380]
  const starboardColumns = [140, 220, 300, 380]
  const galleryLevels = [1, 2, 3, 4]
</script>

<svg
  viewBox="0 0 1000 700"
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
        fill: rgba(30, 53, 77, 0.08);
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(30, 53, 77, 0.22);
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 15px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #c2a65d;
        font-size: 11px;
        pointer-events: none;
        text-anchor: middle;
      }
      .column {
        fill: #4d535a;
        stroke: #7a838b;
        stroke-width: 2;
      }
      .balcony {
        fill: rgba(122, 131, 139, 0.08);
        stroke: #5d646b;
        stroke-width: 1.5;
      }
      .railing {
        stroke: #c2a65d;
        stroke-width: 2;
        stroke-dasharray: 4 2;
      }
      .furniture {
        fill: #2a2f35;
        stroke: #7a838b;
        stroke-width: 1.5;
      }
      .water {
        fill: #3a6b8c;
        stroke: #88b5c4;
        stroke-width: 1.5;
      }
      .sign {
        fill: #1e354d;
        stroke: #c2a65d;
        stroke-width: 1.5;
      }
    </style>
  </defs>

  <!-- Title & Chapter attribution -->
  <text x="500" y="38" class="label" font-size="24" fill="#C2A65D">Central Police Station</text>
  <text x="500" y="58" class="sublabel" fill="#888">Tier 3 · Atrium monumental sur 4 étages · Chap. 349, 378, 393</text>

  <g transform="translate(45, 80)">
    <!-- Main Atrium (Left side, 22x15m metric footprint) -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect Main Atrium"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="0"
      y="0"
      width="560"
      height="540"
      onclick={() => handleElementClick('tier-3-central-police-station-atrium')}
    />
    <rect x="0" y="0" width="560" height="540" class="wall" />
    <text x="280" y="28" class="label text-blue-400">Main Atrium (16m ceiling)</text>

    <!-- 4 Tiers of Galleries: Port side (x = 0 to 95) -->
    <rect class="balcony" x="0" y="45" width="95" height="420" />
    <line x1="95" y1="45" x2="95" y2="465" class="railing" />
    {#each galleryLevels as lvl (lvl)}
      <line x1={lvl * 22} y1="45" x2={lvl * 22} y2="465" stroke="#333" stroke-width="1" />
    {/each}
    <text x="48" y="255" class="sublabel" transform="rotate(-90 48 255)">Galleries (4 levels)</text>

    <!-- 4 Tiers of Galleries: Starboard side (x = 465 to 560) -->
    <rect class="balcony" x="465" y="45" width="95" height="420" />
    <line x1="465" y1="45" x2="465" y2="465" class="railing" />
    {#each galleryLevels as lvl (lvl)}
      <line x1={465 + lvl * 22} y1="45" x2={465 + lvl * 22} y2="465" stroke="#333" stroke-width="1" />
    {/each}
    <text x="512" y="255" class="sublabel" transform="rotate(90 512 255)">Galleries (4 levels)</text>

    <!-- Monumental Colonnade (8 columns) -->
    {#each portColumns as cy (cy)}
      <rect class="column" x="125" y={cy} width="28" height="28" rx="2" />
    {/each}
    {#each starboardColumns as cy (cy)}
      <rect class="column" x="407" y={cy} width="28" height="28" rx="2" />
    {/each}

    <!-- Central Stepped Fountain (at x = 280, y = 225) -->
    <polygon points="280,165 330,185 350,235 330,285 280,305 230,285 210,235 230,185" class="furniture" />
    <polygon points="280,180 315,195 330,235 315,275 280,290 245,275 230,235 245,195" class="water" />
    <circle cx="280" cy="235" r="28" class="furniture" />
    <circle cx="280" cy="235" r="16" class="water" />
    <circle cx="280" cy="235" r="6" fill="#c2a65d" />
    <text x="280" y="239" class="sublabel" font-size="10" fill="#fffff0">Fountain</text>

    <!-- Front Reception Desk (Starboard aft) -->
    <rect x="380" y="90" width="125" height="28" class="furniture" rx="2" />
    <rect x="385" y="92" width="115" height="6" fill="#88b5c4" />
    <text x="442" y="108" class="sublabel">Front Desk</text>

    <!-- Entrance Marquee & Hanging Signs (Bottom / South wall) -->
    <line x1="190" y1="540" x2="370" y2="540" stroke="#050505" stroke-width="10" />
    <!-- Marquee -->
    <rect x="200" y="505" width="160" height="30" fill="rgba(42, 47, 53, 0.6)" stroke="#c2a65d" stroke-width="2" rx="2" />
    <text x="280" y="525" class="sublabel">Entrance Marquee</text>
    <!-- Hanging Signs -->
    <rect class="sign" x="160" y="515" width="22" height="22" rx="2" />
    <text x="171" y="530" font-size="9" fill="#c2a65d" text-anchor="middle">POL</text>
    <rect class="sign" x="378" y="515" width="22" height="22" rx="2" />
    <text x="389" y="530" font-size="9" fill="#c2a65d" text-anchor="middle">POL</text>

    <!-- Sentry & Officer positions -->
    <circle cx="280" cy="285" r="7" fill="#22262a" stroke="#c2a65d" stroke-width="1.5" />
    <text x="280" y="306" class="sublabel" font-size="9">Mizaistom</text>
    <circle cx="442" cy="72" r="5" fill="#1a2b3c" stroke="#c2a65d" />
    <circle cx="180" cy="495" r="5" fill="#1a2b3c" stroke="#c2a65d" />
    <circle cx="380" cy="495" r="5" fill="#1a2b3c" stroke="#c2a65d" />

    <!-- Right: Community Safety Section (600 to 910) -->
    <g transform="translate(600, 0)">
      <rect
        role="button"
        tabindex="0"
        aria-label="Inspect Community Safety Section"
        onkeydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
          }
        }}
        class="zone"
        x="0"
        y="0"
        width="310"
        height="320"
        onclick={() => handleElementClick('tier-3-central-police-station-safety-section')}
      />
      <rect x="0" y="0" width="310" height="320" class="wall" />
      <text x="155" y="28" class="label text-green-400">Community Safety</text>

      <!-- Consultation Safety Desk -->
      <rect x="30" y="80" width="250" height="38" class="furniture" rx="2" />
      <!-- Citizen Divider Screens -->
      {#each [90, 155, 220] as dx (dx)}
        <line x1={dx} y1="80" x2={dx} y2="118" stroke="#88b5c4" stroke-width="2" />
      {/each}
      <text x="155" y="104" class="sublabel">Public Safety Desk</text>

      <!-- Filing cabinets behind desk -->
      <rect x="30" y="145" width="250" height="22" fill="#2a2f35" stroke="#555" />
      <!-- Notice bulletin board -->
      <rect x="40" y="185" width="230" height="18" fill="#d8d4ca" stroke="#c2a65d" />
      <text x="155" y="198" font-size="10" fill="#222" text-anchor="middle">Official Notices & Advisories</text>

      <!-- Citizen & Officer indicators -->
      <circle cx="100" cy="55" r="6" fill="#888" />
      <text x="100" y="44" font-size="9" fill="#aaa" text-anchor="middle">Citizen</text>
      <circle cx="210" cy="55" r="6" fill="#888" />
      <circle cx="155" cy="130" r="6" fill="#1a2b3c" stroke="#c2a65d" />
      <text x="155" y="140" font-size="9" fill="#c2a65d" text-anchor="middle">Officer</text>
    </g>

    <!-- Right Lower: Security Checkpoint / Entrance Sas -->
    <g transform="translate(600, 360)">
      <rect x="0" y="0" width="310" height="180" class="wall" />
      <text x="155" y="28" class="label text-gray-300">Security Checkpoint</text>
      <!-- Metal detector portals -->
      <rect x="80" y="60" width="45" height="24" fill="#2a2f35" stroke="#7a838b" stroke-width="2" />
      <rect x="185" y="60" width="45" height="24" fill="#2a2f35" stroke="#7a838b" stroke-width="2" />
      <text x="155" y="76" font-size="10" fill="#c2a65d" text-anchor="middle">Scanners</text>
      <!-- Baggage check table -->
      <rect x="70" y="115" width="170" height="30" class="furniture" />
      <text x="155" y="134" class="sublabel">Baggage Inspection</text>
    </g>
  </g>
</svg>
