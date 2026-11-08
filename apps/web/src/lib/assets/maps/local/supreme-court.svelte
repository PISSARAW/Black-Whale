<script lang="ts">
  function inspect(_area: string) {}
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inspect(area)
    }
  }
</script>

<svg
  viewBox="0 0 900 650"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        fill: none;
        stroke: #fffff0;
        stroke-width: 6;
      }
      .zone {
        fill: rgba(70, 130, 180, 0.08);
        cursor: pointer;
        transition: fill 0.2s;
      }
      .zone:hover {
        fill: rgba(70, 130, 180, 0.2);
      }
      .label {
        fill: #fffff0;
        font: bold 15px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .sublabel {
        fill: #c2a65d;
        font: 11px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .desk {
        fill: #3a2318;
        stroke: #c2a65d;
        stroke-width: 2;
      }
      .seat {
        fill: #241d19;
        stroke: #7a1820;
        stroke-width: 1.5;
      }
      .carpet {
        fill: #7a1820;
        stroke: #b8923a;
        stroke-width: 2;
      }
      .dais {
        fill: rgba(74, 50, 34, 0.35);
        stroke: #c2a65d;
        stroke-width: 1.5;
      }
      .bar {
        stroke: #c2a65d;
        stroke-width: 3;
        stroke-dasharray: 6 3;
      }
    </style>
  </defs>

  <!-- Title & Chapter attribution -->
  <text x="450" y="36" class="label" font-size="24" fill="#D4AF37">Supreme Court · Tier 1</text>
  <text x="450" y="56" class="sublabel" fill="#888"
    >Pont 1-B · 42 × 28 m · Chapitres 349, 371, 376, 379</text
  >

  <g transform="translate(75, 75)">
    <!-- Courtroom Outer Perimeter Wall (42x28m metric footprint) -->
    <rect width="750" height="500" class="wall" />

    <!-- Ceremonial Red Carpet Runner along the central processional axis -->
    <rect class="carpet" x="20" y="222" width="620" height="56" rx="2" />
    {#each [60, 140, 220, 300, 380, 460, 540, 620] as gx (gx)}
      <line x1={gx} y1="222" x2={gx} y2="278" stroke="#d4af37" stroke-width="1" />
    {/each}

    <!-- Stepped Dais Platform for the Supreme Magistrate (x = 640 to 740) -->
    <rect class="dais" x="620" y="90" width="125" height="320" rx="3" />
    <rect class="dais" x="650" y="120" width="95" height="260" rx="3" />
    <rect class="dais" x="680" y="145" width="65" height="210" rx="3" />

    <!-- Ceremonial Dais Stairs -->
    {#each [620, 630, 640] as sx (sx)}
      <line x1={sx} y1="220" x2={sx} y2="280" stroke="#d4af37" stroke-width="2" />
    {/each}

    <!-- Grand Sceau de la Cour Suprême on East Wall (ch. 371) -->
    <circle cx="745" cy="250" r="34" fill="#1b3554" stroke="#d4af37" stroke-width="3" />
    <circle
      cx="745"
      cy="250"
      r="28"
      fill="none"
      stroke="#d4af37"
      stroke-width="1.5"
      stroke-dasharray="4 2"
    />
    <!-- Scales of justice silhouette on seal -->
    <line x1="745" y1="230" x2="745" y2="265" stroke="#d4af37" stroke-width="2" />
    <line x1="732" y1="238" x2="758" y2="238" stroke="#d4af37" stroke-width="2" />
    <circle cx="732" cy="248" r="4" fill="#d4af37" />
    <circle cx="758" cy="248" r="4" fill="#d4af37" />

    <!-- Supreme Magistrate's Bench (Cleapatro) -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the Supreme Magistrate Bench"
      class="zone"
      x="675"
      y="150"
      width="60"
      height="200"
      onclick={() => inspect('magistrate-bench')}
      onkeydown={(event) => inspectWithKeyboard(event, 'magistrate-bench')}
    />
    <rect x="680" y="155" width="40" height="190" class="desk" rx="2" />
    <rect x="690" y="235" width="20" height="30" fill="#1f3427" stroke="#d4af37" stroke-width="1" />
    <text x="700" y="142" class="sublabel" font-size="10">Magistrate Bench</text>
    <!-- High-backed Judicial Throne Chair -->
    <rect x="724" y="238" width="10" height="24" class="seat" rx="2" />

    <!-- Clerk Desks Left & Right -->
    <rect x="625" y="140" width="35" height="70" class="desk" rx="2" />
    <rect x="625" y="290" width="35" height="70" class="desk" rx="2" />
    <text x="642" y="132" class="sublabel" font-size="9">Clerk Left</text>
    <text x="642" y="375" class="sublabel" font-size="9">Clerk Right</text>
    <circle cx="642" cy="175" r="5" class="seat" />
    <circle cx="642" cy="325" r="5" class="seat" />

    <!-- Speaker Podium / Witness Stand (ch. 376) -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the Speaker Podium"
      class="zone"
      x="500"
      y="225"
      width="45"
      height="50"
      onclick={() => inspect('speaker-podium')}
      onkeydown={(event) => inspectWithKeyboard(event, 'speaker-podium')}
    />
    <rect x="505" y="232" width="28" height="36" class="desk" rx="2" />
    <circle cx="519" cy="250" r="3" fill="#d4af37" />
    <text x="519" y="222" class="sublabel" font-size="9">Podium / Witness</text>
    <!-- Prosecution Table (Benjamin's Counsel) -->
    <rect x="385" y="140" width="36" height="110" class="desk" rx="2" />
    <text x="403" y="132" class="sublabel">Prosecution</text>
    {#each [160, 195, 230] as cy (cy)}
      <circle cx="365" {cy} r="4.5" class="seat" />
    {/each}

    <!-- Defence Table (Camilla's Counsel) -->
    <rect x="385" y="250" width="36" height="110" class="desk" rx="2" />
    <text x="403" y="375" class="sublabel">Defence</text>
    {#each [270, 305, 340] as cy (cy)}
      <circle cx="365" {cy} r="4.5" class="seat" />
    {/each}

    <!-- Court Bar (La Barre du Tribunal) -->
    <line x1="260" y1="50" x2="260" y2="215" class="bar" />
    <line x1="260" y1="285" x2="260" y2="450" class="bar" />
    <circle cx="260" cy="215" r="4" fill="#d4af37" />
    <circle cx="260" cy="285" r="4" fill="#d4af37" />
    <text x="260" y="42" class="sublabel" font-size="9">Court Bar</text>

    <!-- South Tiered Benches (20.9m length, x = 270 to 650) -->
    <rect class="seat" x="270" y="35" width="380" height="22" rx="2" />
    <rect class="seat" x="270" y="65" width="380" height="22" rx="2" />
    <text x="460" y="25" class="sublabel" font-size="9"
      >South Delegation Benches (Prince Benjamin's Camp)</text
    >

    <!-- North Tiered Benches (20.9m length, x = 270 to 650) -->
    <rect class="seat" x="270" y="415" width="380" height="22" rx="2" />
    <rect class="seat" x="270" y="445" width="380" height="22" rx="2" />
    <text x="460" y="482" class="sublabel" font-size="9"
      >North Delegation Benches (Princess Camilla's Camp)</text
    >

    <!-- West Ceremonial Double Doors -->
    <rect x="-3" y="215" width="8" height="70" fill="#3a2318" stroke="#d4af37" stroke-width="2" />
    <line x1="1" y1="250" x2="20" y2="250" stroke="#d4af37" stroke-width="2" />
    <text x="35" y="210" class="sublabel" font-size="9">Entrance</text>
  </g>
</svg>
