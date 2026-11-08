<script lang="ts">
  import { locale } from '$lib/i18n'

  const french = $derived($locale === 'fr')

  /**
   * Chapter 359: Tier 2 Screening Room & Grand Theatre.
   * A monumental proscenium stage under its draped velvet curtain, flanking piers,
   * elevated private boxes suspended along side walls, raked stalls in 6 blocks,
   * axial carpet runner, chandeliers, and projection booth.
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

  /** Ten pixels to the metre, in the coordinates of the Tier 2 plan. */
  const SCALE = 10
  const x = (metres: number) => (metres + 87.5) * SCALE + 60
  const y = (metres: number) => (metres - 7) * SCALE + 75

  const room = { x0: -87.5, x1: 0, y0: 7, y1: 52.5 }
</script>

<svg
  viewBox="0 0 1000 580"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .room-wall {
        fill: rgba(255, 255, 240, 0.02);
        stroke: #fffff0;
        stroke-width: 5;
      }
      .stage-floor {
        fill: #2b1d16;
        stroke: #c2a65d;
        stroke-width: 2;
        cursor: pointer;
        transition: fill 0.2s;
      }
      .stage-floor:hover {
        fill: #442a20;
      }
      .pier {
        fill: #35221b;
        stroke: #d4af37;
        stroke-width: 2.5;
        cursor: pointer;
      }
      .curtain {
        fill: #6d1323;
        stroke: #d4af37;
        stroke-width: 2;
        cursor: pointer;
      }
      .screen {
        fill: #f0f0eb;
        stroke: #121316;
        stroke-width: 2.5;
        cursor: pointer;
      }
      .box-gallery {
        fill: rgba(212, 175, 55, 0.12);
        stroke: #d4af37;
        stroke-width: 2;
        stroke-dasharray: 6 3;
        cursor: pointer;
        transition: fill 0.2s;
      }
      .box-gallery:hover {
        fill: rgba(212, 175, 55, 0.25);
      }
      .stalls-block {
        fill: rgba(117, 22, 39, 0.22);
        stroke: #751627;
        stroke-width: 1.5;
        cursor: pointer;
        transition: fill 0.2s;
      }
      .stalls-block:hover {
        fill: rgba(117, 22, 39, 0.45);
      }
      .runner {
        fill: #751627;
        stroke: #d4af37;
        stroke-width: 1.2;
      }
      .door-marker {
        stroke: #ffd700;
        stroke-width: 5;
        cursor: pointer;
      }
      .booth {
        fill: #22252a;
        stroke: #667080;
        stroke-width: 2;
        cursor: pointer;
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 13px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #ffd700;
        font-family: sans-serif;
        font-size: 11px;
        pointer-events: none;
        text-anchor: middle;
      }
      .micro {
        fill: #bbb;
        font-family: sans-serif;
        font-size: 9px;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <!-- Title & Chapter attribution -->
  <text x="500" y="28" class="label" font-size="20" fill="#FFD700">
    {french ? 'Salle de projection · Niveau 2' : 'Screening Room · Tier 2'}
  </text>
  <text x="500" y="46" class="micro" fill="#aaa">
    {french
      ? '87,5 m × 45,5 m · Plafond à 10 m · Théâtre d’honneur du paquebot (Chapitre 359)'
      : '87.5 m × 45.5 m · 10 m deckhead · Royal liner briefing theatre (Chapter 359)'}
  </text>

  <!-- Room Outer Bulkhead -->
  <rect
    x={x(room.x0)}
    y={y(room.y0)}
    width={(room.x1 - room.x0) * SCALE}
    height={(room.y1 - room.y0) * SCALE}
    class="room-wall"
  />

  <!-- Ceremonial Carpet Runners (Axial & Cross-Aisle) -->
  <!-- Central axial runner (X: -73.2 to -13.5, Z: 29.75) -->
  <rect x={x(-73.2)} y={y(28.75)} width={59.7 * SCALE} height={2.0 * SCALE} class="runner" />
  <!-- Cross-aisle runner connecting doors (at X = -43.75, Z: 7.2 to 52.3) -->
  <rect x={x(-45.0)} y={y(7.2)} width={2.5 * SCALE} height={45.1 * SCALE} class="runner" />
  <!-- Front orchestra cross runner -->
  <rect x={x(-75.2)} y={y(10.7)} width={2.0 * SCALE} height={38.1 * SCALE} class="runner" />
  <!-- Rear promenade cross runner -->
  <rect x={x(-13.4)} y={y(10.7)} width={2.4 * SCALE} height={38.1 * SCALE} class="runner" />

  <!-- 6 Stalls Seating Blocks on Raked Risers -->
  {#each [-70, -60, -49.25, -38.25, -27.25, -16.25] as cx, idx (cx)}
    <g
      role="button"
      tabindex="0"
      aria-label="Stalls block"
      onclick={() => inspect('stalls')}
      onkeydown={(e) => inspectWithKeyboard(e, 'stalls')}
    >
      <rect
        x={x(cx - 2.5)}
        y={y(14.75)}
        width={5.0 * SCALE}
        height={30.0 * SCALE}
        class="stalls-block"
      />
      <!-- Row divider markings -->
      {#each [1, 2, 3] as r (r)}
        <line
          x1={x(cx - 2.5 + r * 1.6)}
          y1={y(14.75)}
          x2={x(cx - 2.5 + r * 1.6)}
          y2={y(44.75)}
          stroke="#44101a"
          stroke-width="1"
        />
      {/each}
      <text x={x(cx)} y={y(29.75)} class="micro" fill="#d4af37">B{idx + 1}</text>
    </g>
  {/each}

  <!-- 4 Elevated Private VIP Boxes (hung at 4.4m on corbels) -->
  {#each [{ id: 'box-port-fwd', x: -62, z: 8, l: 26, w: 1.2 }, { id: 'box-port-aft', x: -27, z: 8, l: 26, w: 1.2 }, { id: 'box-starboard-fwd', x: -62, z: 51.5, l: 26, w: 1.2 }, { id: 'box-starboard-aft', x: -27, z: 51.5, l: 26, w: 1.2 }] as box (box.id)}
    <g
      role="button"
      tabindex="0"
      aria-label="VIP Box"
      onclick={() => inspect('boxes')}
      onkeydown={(e) => inspectWithKeyboard(e, 'boxes')}
    >
      <rect
        x={x(box.x - box.l / 2)}
        y={y(box.z - box.w / 2)}
        width={box.l * SCALE}
        height={box.w * SCALE}
        class="box-gallery"
      />
      <!-- Balustrade railing markers -->
      <line
        x1={x(box.x - box.l / 2)}
        y1={y(box.z + (box.z < 30 ? box.w / 2 : -box.w / 2))}
        x2={x(box.x + box.l / 2)}
        y2={y(box.z + (box.z < 30 ? box.w / 2 : -box.w / 2))}
        stroke="#ffd700"
        stroke-width="2"
      />
    </g>
  {/each}

  <!-- Raised Proscenium Stage (+1.1m) with Oak Parquet & Stairs -->
  <g
    role="button"
    tabindex="0"
    aria-label="Stage"
    onclick={() => inspect('stage')}
    onkeydown={(e) => inspectWithKeyboard(e, 'stage')}
  >
    <rect x={x(-85.0)} y={y(12.75)} width={6.8 * SCALE} height={34.0 * SCALE} class="stage-floor" />
    <!-- Parquet planks -->
    {#each Array.from({ length: 16 }, (_, i) => i) as idx (idx)}
      <line
        x1={x(-85.0)}
        y1={y(13.75 + idx * 2.0)}
        x2={x(-78.2)}
        y2={y(13.75 + idx * 2.0)}
        stroke="#3a251c"
        stroke-width="1"
      />
    {/each}
    <!-- Stage footlight strip along apron -->
    <line
      x1={x(-78.3)}
      y1={y(14.0)}
      x2={x(-78.3)}
      y2={y(45.5)}
      stroke="#ffd899"
      stroke-width="2"
      stroke-dasharray="3 2"
    />
  </g>

  <!-- Flanking Proscenium Monumental Piers (10m high) -->
  <g
    role="button"
    tabindex="0"
    aria-label="Proscenium pier"
    onclick={() => inspect('proscenium')}
    onkeydown={(e) => inspectWithKeyboard(e, 'proscenium')}
  >
    <rect x={x(-77.2)} y={y(10.0)} width={2.4 * SCALE} height={4.0 * SCALE} class="pier" />
    <rect x={x(-77.2)} y={y(45.5)} width={2.4 * SCALE} height={4.0 * SCALE} class="pier" />
  </g>

  <!-- Grand Velvet Curtain & Festooned Valance -->
  <g
    role="button"
    tabindex="0"
    aria-label="Curtain"
    onclick={() => inspect('curtain')}
    onkeydown={(e) => inspectWithKeyboard(e, 'curtain')}
  >
    <rect x={x(-78.1)} y={y(16.25)} width={1.0 * SCALE} height={27.0 * SCALE} class="curtain" />
    {#each Array.from({ length: 9 }, (_, i) => i) as i (i)}
      <circle cx={x(-77.6)} cy={y(17.75 + i * 3.0)} r="7" fill="#4a0d18" stroke="#d4af37" />
    {/each}
  </g>

  <!-- Wide Projection Screen standing on stage -->
  <g
    role="button"
    tabindex="0"
    aria-label="Projection screen"
    onclick={() => inspect('screen')}
    onkeydown={(e) => inspectWithKeyboard(e, 'screen')}
  >
    <rect x={x(-84.8)} y={y(18.75)} width={0.4 * SCALE} height={10.5 * SCALE} class="screen" />
  </g>

  <!-- Official Briefing Podium on Stage -->
  <g
    role="button"
    tabindex="0"
    aria-label="Lectern"
    onclick={() => inspect('stage')}
    onkeydown={(e) => inspectWithKeyboard(e, 'stage')}
  >
    <rect
      x={x(-79.6)}
      y={y(16.0)}
      width={0.8 * SCALE}
      height={1.0 * SCALE}
      fill="#35221b"
      stroke="#ffd700"
      stroke-width="1.5"
    />
    <circle cx={x(-79.2)} cy={y(16.5)} r="2" fill="#be9c48" />
  </g>

  <!-- Projection Booth on East Wall (X = 0, Z = 29.75) -->
  <g
    role="button"
    tabindex="0"
    aria-label="Projection booth"
    onclick={() => inspect('booth')}
    onkeydown={(e) => inspectWithKeyboard(e, 'booth')}
  >
    <rect x={x(-0.7)} y={y(23.75)} width={0.7 * SCALE} height={12.0 * SCALE} class="booth" />
    <!-- Projection beam cones -->
    <polygon
      points="{x(-0.7)},{y(27.35)} {x(-75)},{y(20)} {x(-75)},{y(39.5)} {x(-0.7)},{y(32.15)}"
      fill="rgba(255, 235, 180, 0.05)"
    />
    <circle cx={x(-0.7)} cy={y(27.35)} r="3" fill="#5a6d7a" stroke="#ffd899" />
    <circle cx={x(-0.7)} cy={y(32.15)} r="3" fill="#5a6d7a" stroke="#ffd899" />
  </g>

  <!-- 3 Emergency Exit Doors with Green Illuminated BAES Markers -->
  <!-- North door (Z = 7) -->
  <line x1={x(-45.25)} y1={y(7)} x2={x(-42.25)} y2={y(7)} class="door-marker" />
  <rect x={x(-44.25)} y={y(7) - 4} width="20" height="4" fill="#33cc44" />
  <!-- South door (Z = 52.5) -->
  <line x1={x(-45.25)} y1={y(52.5)} x2={x(-42.25)} y2={y(52.5)} class="door-marker" />
  <rect x={x(-44.25)} y={y(52.5)} width="20" height="4" fill="#33cc44" />
  <!-- Port promenade door (X = -87.5) -->
  <line x1={x(-87.5)} y1={y(28.25)} x2={x(-87.5)} y2={y(31.25)} class="door-marker" />
  <rect x={x(-87.5) - 4} y={y(29.25)} width="4" height="20" fill="#33cc44" />

  <!-- 5 Suspended Chandeliers along Central Axis -->
  {#each [-60, -48, -36, -24, -12] as cx (cx)}
    <circle cx={x(cx)} cy={y(29.75)} r="9" fill="none" stroke="#d4af37" stroke-width="1.5" />
    <circle cx={x(cx)} cy={y(29.75)} r="4" fill="#ffd899" />
  {/each}

  <!-- Text Labels -->
  <text x={x(-81.6)} y={y(29.75)} class="label" transform="rotate(-90 {x(-81.6)} {y(29.75)})">
    {french ? 'Scène (+1,1 m)' : 'Stage (+1.1 m)'}
  </text>
  <text x={x(-84.8)} y={y(17.5)} class="micro" fill="#fff">
    {french ? 'Écran' : 'Screen'}
  </text>
  <text x={x(-77.8)} y={y(15.0)} class="micro" fill="#d4af37">
    {french ? 'Rideau' : 'Curtain'}
  </text>
  <text x={x(-44.5)} y={y(10.2)} class="sublabel">
    {french ? 'Loges d’honneur bâbord (4,4 m)' : 'Port VIP Boxes (4.4 m)'}
  </text>
  <text x={x(-44.5)} y={y(49.8)} class="sublabel">
    {french ? 'Loges d’honneur tribord (4,4 m)' : 'Starboard VIP Boxes (4.4 m)'}
  </text>
  <text x={x(-43.5)} y={y(28.0)} class="label">
    {french ? 'Parterre · 6 blocs de gradins' : 'Stalls · 6 raked blocks'}
  </text>
  <text x={x(-0.7)} y={y(21.5)} class="micro" fill="#9dc4e0">
    {french ? 'Cabine de projection' : 'Projection booth'}
  </text>

  <!-- Interactive Inspection Drawer / Card -->
  {#if activeArea}
    <g transform="translate(180, 480)">
      <rect width="640" height="85" rx="5" fill="#121418" stroke="#d4af37" stroke-width="1.5" />
      {#if activeArea === 'stage'}
        <text x="20" y="24" class="label" fill="#ffd700" text-anchor="start">
          {french ? 'Scène d’honneur & Pupitre officiel' : 'Main Stage & Briefing Lectern'}
        </text>
        <text x="20" y="44" class="micro" fill="#eee" text-anchor="start">
          {french
            ? '6,8 × 34 m surélevée de 1,1 m en parquet de chêne sombre avec feux de rampe ambrés et pupitre à col-de-cygne.'
            : '6.8 × 34 m raised by 1.1 m with dark oak parquet, amber footlights, and official briefing lectern.'}
        </text>
        <text x="20" y="64" class="micro" fill="#aaa" text-anchor="start">
          {french
            ? 'Source : Chapitre 359 — estrade du théâtre du Niveau 2.'
            : 'Source: Chapter 359 — Tier 2 theatre stage.'}
        </text>
      {:else if activeArea === 'curtain'}
        <text x="20" y="24" class="label" fill="#ffd700" text-anchor="start">
          {french ? 'Grand rideau de velours carmin' : 'Grand Crimson Velvet Drape'}
        </text>
        <text x="20" y="44" class="micro" fill="#eee" text-anchor="start">
          {french
            ? 'Largeur 27 m · Drapé en plis verticaux généreux avec embrasses à pompons dorés et lambrequin festonné.'
            : '27 m span · Generous vertical folds with golden tassel tiebacks and festooned valance.'}
        </text>
        <text x="20" y="64" class="micro" fill="#aaa" text-anchor="start">
          {french
            ? 'Source : Chapitre 359 — rideau d’avant-scène.'
            : 'Source: Chapter 359 — proscenium curtain.'}
        </text>
      {:else if activeArea === 'screen'}
        <text x="20" y="24" class="label" fill="#ffd700" text-anchor="start">
          {french ? 'Écran de projection panoramique' : 'Panoramic Projection Screen'}
        </text>
        <text x="20" y="44" class="micro" fill="#eee" text-anchor="start">
          {french
            ? 'Toile blanc mat 10,5 × 5,8 m bordée de velours noir absorbant et structure arrière en acier tubulaire.'
            : 'Matte white 10.5 × 5.8 m canvas with black velvet masking and rear tubular steel frame.'}
        </text>
        <text x="20" y="64" class="micro" fill="#aaa" text-anchor="start">
          {french
            ? 'Source : Chapitre 359 — écran dressé sur la scène.'
            : 'Source: Chapter 359 — screen standing on stage.'}
        </text>
      {:else if activeArea === 'boxes'}
        <text x="20" y="24" class="label" fill="#ffd700" text-anchor="start">
          {french ? 'Loges d’honneur suspendues' : 'Elevated Private VIP Boxes'}
        </text>
        <text x="20" y="44" class="micro" fill="#eee" text-anchor="start">
          {french
            ? '4 galeries de 26 m suspendues à 4,4 m sur corbeaux à volutes, balustrades dorées, fauteuils club et guéridons.'
            : '4 galleries of 26 m hung at 4.4 m on scrolled corbels, gold balustrades, club armchairs and cocktail tables.'}
        </text>
        <text x="20" y="64" class="micro" fill="#aaa" text-anchor="start">
          {french
            ? 'Source : Chapitre 359 — loges le long des parois latérales.'
            : 'Source: Chapter 359 — lateral wall boxes.'}
        </text>
      {:else if activeArea === 'stalls'}
        <text x="20" y="24" class="label" fill="#ffd700" text-anchor="start">
          {french ? 'Parterre & Gradins étagés' : 'Stalls & Raked Sightline Risers'}
        </text>
        <text x="20" y="44" class="micro" fill="#eee" text-anchor="start">
          {french
            ? '6 blocs de sièges rabattables en velours carmin sur gradins (+0,18 m/bloc), grand tapis central et lampes de nez de rangée.'
            : '6 blocks of folding crimson velvet seats on risers (+0.18 m/block), axial carpet runner and step courtesy lights.'}
        </text>
        <text x="20" y="64" class="micro" fill="#aaa" text-anchor="start">
          {french
            ? 'Source : Chapitre 359 — parterre du théâtre.'
            : 'Source: Chapter 359 — stalls auditorium.'}
        </text>
      {:else if activeArea === 'booth'}
        <text x="20" y="24" class="label" fill="#ffd700" text-anchor="start">
          {french ? 'Cabine de projection & Régie' : 'Projection Booth & Control Room'}
        </text>
        <text x="20" y="44" class="micro" fill="#eee" text-anchor="start">
          {french
            ? 'Régie en fond de salle au mur Est avec double hublot optique de projection et fenêtre panoramique d’observation.'
            : 'East wall projection suite with dual optical projector ports and operator observation window.'}
        </text>
        <text x="20" y="64" class="micro" fill="#aaa" text-anchor="start">
          {french
            ? 'Source : Chapitre 359 — régie cinéma du pont public.'
            : 'Source: Chapter 359 — cinema projection booth.'}
        </text>
      {:else}
        <text x="20" y="24" class="label" fill="#ffd700" text-anchor="start">
          {french ? 'Cadre & Piles de proscénium' : 'Proscenium Piers & Arch'}
        </text>
        <text x="20" y="44" class="micro" fill="#eee" text-anchor="start">
          {french
            ? 'Piles de 2,4 × 4 m montant jusqu’à 10 m, cannelures dorées, grand arc de 35,5 m orné d’un cartouche sculpté.'
            : '2.4 × 4 m piers reaching 10 m, gilded fluting, grand 35.5 m arch crowned with a carved cartouche.'}
        </text>
        <text x="20" y="64" class="micro" fill="#aaa" text-anchor="start">
          {french
            ? 'Source : Chapitre 359 — avant-scène du théâtre.'
            : 'Source: Chapter 359 — proscenium framing.'}
        </text>
      {/if}
      <text
        x="620"
        y="24"
        class="micro"
        fill="#ff6666"
        cursor="pointer"
        onclick={() => (activeArea = null)}
      >
        ✕
      </text>
    </g>
  {/if}
</svg>
