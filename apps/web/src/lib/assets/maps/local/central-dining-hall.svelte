<script lang="ts">
  /**
   * The Tier 5 refectory, drawn from `data/ship/blueprint.json`.
   *
   * It used to draw a toll being collected and the thugs collecting it. Who is
   * in the room is the marker layer's answer and it changes with the chapter;
   * what the room *is* is what ch. 377 draws — long low tables in rows, diners
   * seated directly on the deck, the raised platform among them, and the long service counter
   * under its menu boards with a line of fixed stools. The Buor toll of ch. 358
   * happens at the passage, which is where the label now sits instead.
   *
   * Every fixture is placed by the coordinates the blueprint gives it.
   */
  import { locale } from '$lib/i18n'
  import {
    diningHallRooms,
    diningHallFixtures,
    diningHallDoors,
    diningHallColumns,
    diningHallPolygon,
    diningHallPoint,
    DINING_HALL_VIEWBOX,
  } from '$lib/components/map/projection/diningHallPlan'

  const french = $derived($locale === 'fr')

  // Fixed stools along the customer-facing side of the service counter
  const stoolXs = Array.from({ length: 12 }, (_, index) => 18.1 + index * 2.1)
  const stoolPoints = stoolXs.map((sx) => diningHallPoint([sx, 16.0]))
</script>

<svg
  viewBox="0 0 {DINING_HALL_VIEWBOX.width} {DINING_HALL_VIEWBOX.height}"
  role="img"
  aria-label={french
    ? 'Plan du réfectoire central du niveau 5'
    : 'Central dining hall plan, Tier 5'}
  class="w-full h-full rounded-lg border border-[#333] bg-[#050505] text-[#fffff0]"
>
  <defs>
    <style>
      .room {
        fill: rgba(255, 255, 240, 0.03);
        stroke: #fffff0;
        stroke-width: 2.5;
      }
      .table {
        fill: rgba(217, 164, 65, 0.22);
        stroke: #d9a441;
        stroke-width: 1.5;
      }
      .platform {
        fill: rgba(255, 215, 0, 0.16);
        stroke: #ffd700;
        stroke-width: 2;
      }
      .counter {
        fill: rgba(157, 111, 70, 0.28);
        stroke: #c79a6b;
        stroke-width: 2;
      }
      .stool {
        fill: rgba(200, 200, 200, 0.22);
        stroke: #aaa;
        stroke-width: 1.5;
      }
      .menu {
        fill: rgba(255, 255, 240, 0.12);
        stroke: #d7d7c9;
        stroke-width: 1;
      }
      .vending {
        fill: rgba(200, 220, 255, 0.18);
        stroke: #8fb8e6;
        stroke-width: 1.5;
      }
      .seat {
        fill: rgba(180, 150, 120, 0.22);
        stroke: #a67c52;
        stroke-width: 1.2;
      }
      .duct {
        fill: rgba(80, 85, 92, 0.3);
        stroke: #686d75;
        stroke-width: 1.2;
      }
      .pillar {
        fill: #26282b;
        stroke: #5a5c60;
        stroke-width: 1.8;
      }
      .door {
        stroke: #ffd700;
        stroke-width: 4.5;
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        text-anchor: middle;
      }
      .sublabel {
        fill: #ffd700;
        font-family: sans-serif;
        font-size: 11px;
        text-anchor: middle;
      }
    </style>
  </defs>

  <text x="500" y="34" class="label" font-size="22" font-weight="bold" fill="#FFD700">
    {french ? 'Réfectoire central — Niveau 5' : 'Central Dining Hall — Tier 5'}
  </text>
  <text x="500" y="56" class="label" font-size="11" opacity="0.6">
    {french
      ? '31,5 m × 31,5 m · Chap. 377 : comptoir de service, tabourets et longues tables communes'
      : '31.5 m × 31.5 m · ch. 377: long service counter, menu boards, stools and communal tables'}
  </text>

  <!-- Room perimeter footprint -->
  {#each diningHallRooms as room (room.id)}
    <polygon points={diningHallPolygon(room.footprint)} class="room" />
  {/each}

  <!-- Structural pillars -->
  {#each diningHallColumns as col, index (index)}
    <rect x={col.x - 16} y={col.y - 16} width="32" height="32" class="pillar">
      <title>{french ? 'Pilier porteur' : 'Structural column'}</title>
    </rect>
  {/each}

  <!-- Shared blueprint fixtures -->
  {#each diningHallFixtures as fixture (fixture.id)}
    {@const isCounter = fixture.kind === 'counter'}
    {@const isMenu = fixture.id.includes('menu-board')}
    {@const isTable = fixture.kind === 'table'}
    {@const isSeat = fixture.kind === 'seat'}
    {@const isPlatform = fixture.kind === 'platform' || fixture.id.includes('-platform-')}
    {@const isVending = fixture.kind === 'cabinet' || fixture.id.includes('vending')}
    {@const isDuct = fixture.kind === 'duct'}
    <polygon
      points={fixture.polygon}
      class={isCounter
        ? 'counter'
        : isMenu
          ? 'menu'
          : isPlatform
            ? 'platform'
            : isVending
              ? 'vending'
              : isTable
                ? 'table'
                : isSeat
                  ? 'seat'
                  : isDuct
                    ? 'duct'
                    : 'table'}
    >
      <title>{french ? fixture.nameFr : fixture.name}</title>
    </polygon>
  {/each}

  <!-- Fixed counter stools along customer aisle -->
  {#each stoolPoints as stool, index (index)}
    <circle cx={stool.x} cy={stool.y} r={9} class="stool">
      <title>{french ? 'Tabouret fixe' : 'Fixed stool'}</title>
    </circle>
  {/each}

  <!-- Doorways connecting to corridors and passages -->
  {#each diningHallDoors as door, index (index)}
    <line x1={door.from.x} y1={door.from.y} x2={door.to.x} y2={door.to.y} class="door">
      <title>{french ? 'Accès couloir' : 'Passage doorway'}</title>
    </line>
  {/each}

  <!-- Annotated canon zones -->
  <text x="500" y="72" class="sublabel">
    {french
      ? 'Passage — le péage Buor est prélevé ici, chap. 358'
      : 'Passage — the Buor take their toll here, ch. 358'}
  </text>
  <text x="500" y="475" class="sublabel">
    {french
      ? 'Estrade centrale · rassemblement de la Brigade fantôme (chap. 377)'
      : 'Raised platform · Phantom Troupe gathering (ch. 377)'}
  </text>
  <text x="210" y="675" class="sublabel">
    {french
      ? 'Table isolée de Franklin · chap. 379–380'
      : 'Franklin’s isolated table · ch. 379–380'}
  </text>
  <text x="500" y="930" class="label" font-size="11">
    {french
      ? 'Six rangées de tables · les convives s’assoient au ras du pont'
      : 'Six low boards · diners sit directly on the deck'}
  </text>
</svg>
