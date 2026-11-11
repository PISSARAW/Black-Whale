<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    COURTHOUSE_SCALE,
    courthouseRoom,
    courthouseFixtures,
    courthousePolygon,
    courthouseEntry,
  } from '$lib/components/map/projection/centralCourthousePlan'

  const french = $derived($locale === 'fr')
  const seat = courthouseFixtures.find(({ id }) => id.endsWith('-seat'))!
  const gavel = courthouseFixtures.find(({ id }) => id.endsWith('-gavel'))!
  const curtain = courthouseFixtures.find(({ id }) => id.endsWith('-curtain'))!
  const desks = courthouseFixtures.filter(({ id }) => id.endsWith('-desk'))
</script>

<svg
  viewBox="0 0 800 700"
  role="img"
  aria-label={french
    ? 'Plan du Tribunal central du niveau 3 : siège dégagé, maillet et deux pupitres à droite'
    : 'Tier 3 Central Courthouse plan: exposed seat, gavel and two desks on the right'}
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <pattern id="central-courthouse-grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#393b3b" stroke-width="0.75" />
    </pattern>
    <style>
      .wall {
        fill: url(#central-courthouse-grid);
        stroke: #d1cdc1;
        stroke-width: 4;
      }
      .fixture {
        fill: #4b4338;
        stroke: #c7b79b;
        stroke-width: 2;
      }
      .seat {
        fill: #65594a;
        stroke: #e4d7bd;
        stroke-width: 2;
      }
      .drapery {
        fill: #8a867b;
        stroke: #e0d9c8;
        stroke-width: 2;
      }
      .label {
        fill: #fffff0;
        font: 600 14px sans-serif;
        text-anchor: middle;
      }
      .sub {
        fill: #c2bcae;
        font: 12px sans-serif;
        text-anchor: middle;
      }
      .note {
        fill: #9ca6ad;
        font: 11px sans-serif;
        text-anchor: middle;
      }
      .construction {
        fill: none;
        stroke: #8597a4;
        stroke-width: 1.5;
        stroke-dasharray: 5 4;
      }
    </style>
  </defs>

  <text x="400" y="36" class="label" style="font-size: 24px">
    {french ? 'Tribunal central · Niveau 3' : 'Central Courthouse · Tier 3'}
  </text>
  <text x="400" y="61" class="sub">
    {french
      ? 'Chapitre 359 · Tome 34 · audience de Botobai'
      : 'Chapter 359 · Volume 34 · Botobai’s hearing'}
  </text>
  <text x="400" y="83" class="note">
    {french
      ? '12 × 10 m · plafond 4,2 m · dimensions estimées'
      : '12 × 10 m · 4.2 m ceiling · estimated dimensions'}
  </text>

  <!-- The footprint and every solid below are projected from the shared blueprint. -->
  <polygon points={courthousePolygon(courthouseRoom.footprint)} class="wall" />

  <polygon points={curtain.polygon} class="drapery" />
  <text x={curtain.point.x} y={curtain.point.y + 27} class="sub">
    {french ? curtain.nameFr : curtain.name}
  </text>

  {#each desks as desk (desk.id)}
    <polygon points={desk.polygon} class="fixture" />
    <line
      x1={desk.point.x - (desk.size[0] * COURTHOUSE_SCALE) / 2 + 4}
      y1={desk.point.y + (desk.size[1] * COURTHOUSE_SCALE) / 2 - 5}
      x2={desk.point.x + (desk.size[0] * COURTHOUSE_SCALE) / 2 - 4}
      y2={desk.point.y + (desk.size[1] * COURTHOUSE_SCALE) / 2 - 5}
      stroke="#e0cfac"
      stroke-width="2"
    />
    <text x={desk.point.x} y={desk.point.y + 4} class="sub">
      {french ? desk.nameFr : desk.name}
    </text>
  {/each}

  <!-- Open-legged seat, not a desk or a raised judicial platform. -->
  <polygon points={seat.polygon} class="seat" />
  <text x={seat.point.x} y={seat.point.y + 56} class="sub">
    {french ? seat.nameFr : seat.name}
  </text>
  <polygon points={gavel.polygon} class="fixture" />
  <circle cx={gavel.point.x} cy={gavel.point.y} r="4" fill="#ded1b7" />
  <text x={gavel.point.x - 53} y={gavel.point.y + 4} class="sub">
    {french ? 'Maillet' : 'Gavel'}
  </text>

  <!-- The people in the panel belong to event projection, never to fixed room furniture. -->
  <text x="400" y="451" class="sub">
    {french ? 'Espace d’audience dégagé' : 'Open hearing floor'}
  </text>
  <text x="400" y="473" class="note">
    {french ? 'Présences selon l’événement sélectionné' : 'Occupants follow the selected event'}
  </text>

  <!-- Navigation anchor is inferred; it does not claim a visible doorway in the panel. -->
  <circle cx={courthouseEntry.x} cy={courthouseEntry.y} r="10" class="construction" />
  <path d={`M ${courthouseEntry.x} ${courthouseEntry.y + 12} v 17`} class="construction" />
  <text x="400" y="638" class="note">
    {french
      ? 'Accès hors champ · position reconstruite'
      : 'Off-frame access · reconstructed position'}
  </text>
  <text x="400" y="665" class="note">
    {french
      ? 'Pupitres à droite · lambris, frise, tentures et plafond quadrillé dans la visite'
      : 'Desks to the right · wall panels, frieze, drapery and ceiling grid in the tour'}
  </text>
</svg>
