<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    justiceRooms,
    justiceFixtures,
    justiceDoors,
    justicePolygon,
    justicePoint,
  } from '$lib/components/map/projection/justiceBureauPlan'

  const french = $derived($locale === 'fr')

  // Area inspection is not wired up yet; the keyboard and click affordances
  // stay so the behaviour can be attached in one place when it exists.
  function inspect(_area: string) {}
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') inspect(area)
  }

  // Key architectural fixtures for SVG overlays
  const lobbyDesk = justiceFixtures.find(({ id }) => id.endsWith('-lobby-desk'))
  const magistrateDesk = justiceFixtures.find(({ id }) => id.endsWith('-deputy-desk'))
  const rearBookcase = justiceFixtures.find(({ id }) => id.endsWith('-bookcases'))
  const sideBookcase = justiceFixtures.find(({ id }) => id.endsWith('-deputy-side-bookcase'))
  const visitorChair1 = justiceFixtures.find(({ id }) => id.endsWith('-deputy-visitor-chair-01'))
  const visitorChair2 = justiceFixtures.find(({ id }) => id.endsWith('-deputy-visitor-chair-02'))
  const visitationPartition = justiceFixtures.find(({ id }) => id.endsWith('-visitation-partition'))
</script>

<svg
  viewBox="0 0 1000 700"
  role="img"
  aria-label={french
    ? 'Plan du Ministère de la Justice : hall, bureau 1010, parloir et protection VIP'
    : 'Ministry of Justice plan: lobby, office 1010, visitation and VIP protection'}
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        fill: none;
        stroke: #fffff0;
        stroke-width: 4;
      }
      .zone {
        fill: rgba(72, 118, 145, 0.08);
        stroke: #506775;
        stroke-width: 1.5;
        cursor: pointer;
        transition: fill 0.2s;
      }
      .zone:hover {
        fill: rgba(72, 118, 145, 0.22);
      }
      .safe {
        fill: rgba(50, 155, 100, 0.08);
        stroke: #4e9d72;
        stroke-width: 2;
      }
      .safe:hover {
        fill: rgba(50, 155, 100, 0.18);
      }
      .corridor {
        fill: rgba(140, 130, 115, 0.1);
        stroke: #827b70;
        stroke-width: 1.5;
      }
      .fixture {
        fill: #262420;
        stroke: #8c8272;
        stroke-width: 1.2;
      }
      .bookcase {
        fill: #332b22;
        stroke: #b59f6d;
        stroke-width: 1.5;
      }
      .desk-top {
        fill: #453426;
        stroke: #c2a767;
        stroke-width: 1.5;
      }
      .leather-seat {
        fill: #26332a;
        stroke: #6b8270;
        stroke-width: 1.2;
      }
      .glass-wall {
        fill: rgba(136, 181, 196, 0.15);
        stroke: #88b5c4;
        stroke-width: 3.5;
      }
      .transfer-drawer {
        fill: #3d4247;
        stroke: #a2adb5;
        stroke-width: 2;
      }
      .door-line {
        stroke: #c2a767;
        stroke-width: 3.5;
      }
      .label {
        fill: #fffff0;
        font: bold 14px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .sub {
        fill: #c8a956;
        font: 11px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .dim {
        fill: #9b9689;
        font: 10px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
    </style>
  </defs>

  <!-- Title & Chapter attribution -->
  <text x="500" y="34" class="label" font-size="22" fill="#ffd700">
    {french ? 'Ministère de la Justice · Niveau 2' : 'Justice Bureau · Tier 2'}
  </text>
  <text x="500" y="54" class="sub">
    {french
      ? 'Chap. 400 : Bureau 1010, parloir vitré et suite VIP · Agencement schématique officiel'
      : 'Ch. 400: signed room 1010 + VIP suite details · five-story layout remains schematic'}
  </text>

  <!-- Render all rooms based on canonical hull & spaces -->
  {#each justiceRooms as room (room.id)}
    {@const isSafe = room.id.includes('witness-protection')}
    {@const isHall = room.id.includes('-hall')}
    {@const area = room.id.replace('tier-2-ministry-of-justice-', '')}
    <polygon
      role="button"
      tabindex="0"
      aria-label={`Inspect ${room.name}`}
      class={isSafe ? 'zone safe' : isHall ? 'corridor' : 'zone'}
      points={justicePolygon(room.footprint)}
      onclick={() => inspect(area)}
      onkeydown={(event) => inspectWithKeyboard(event, area)}
    />
  {/each}

  <!-- Outer perimeter wall -->
  <polygon points="60,90 940,90 940,640 60,640" class="wall" />

  <!-- Internal doorways from blueprint -->
  {#each justiceDoors as door, index (index)}
    <line x1={door.from.x} y1={door.from.y} x2={door.to.x} y2={door.to.y} class="door-line" />
  {/each}

  <!-- 1. HALL D'ACCUEIL (LOBBY) -->
  {#if lobbyDesk}
    <!-- Reception counter -->
    <polygon points={lobbyDesk.polygon} class="desk-top" />
    <!-- Guard/Clerk terminal and register -->
    <rect
      x={lobbyDesk.point.x - 40}
      y={lobbyDesk.point.y - 7}
      width="22"
      height="14"
      fill="#181818"
      stroke="#777"
    />
    <rect
      x={lobbyDesk.point.x + 10}
      y={lobbyDesk.point.y - 8}
      width="26"
      height="16"
      rx="2"
      fill="#d8d2c2"
      stroke="#555"
    />
    <!-- Security arch / turnstile into corridor -->
    <rect
      x={justicePoint([-16, -3]).x - 18}
      y={justicePoint([-16, -3]).y - 6}
      width="36"
      height="12"
      fill="#333"
      stroke="#aaa"
    />
    <!-- Waiting benches -->
    <rect
      x={justicePoint([-20, -8]).x}
      y={justicePoint([-20, -8]).y - 30}
      width="16"
      height="60"
      rx="3"
      class="fixture"
    />
  {/if}
  <text x={justicePoint([-14.5, -6.5]).x} y={justicePoint([-14.5, -6.5]).y} class="label">
    {french ? 'Hall d’accueil' : 'Lobby'}
  </text>
  <text x={justicePoint([-14.5, -5.2]).x} y={justicePoint([-14.5, -5.2]).y} class="dim">
    {french ? 'Comptoir d’enregistrement & filtrage' : 'Registration counter & security arch'}
  </text>

  <!-- 2. BUREAU JUDICIAIRE / SALLE D'INTERROGATOIRE 1010 -->
  <!-- Full-height legal bookcases on rear and side walls -->
  {#if rearBookcase}
    <polygon points={rearBookcase.polygon} class="bookcase" />
    {#each [0, 1, 2, 3, 4, 5, 6, 7] as section (section)}
      <line
        x1={rearBookcase.point.x - 70 + section * 20}
        y1={rearBookcase.point.y - 5}
        x2={rearBookcase.point.x - 70 + section * 20}
        y2={rearBookcase.point.y + 5}
        stroke="#b59f6d"
        stroke-width="1.2"
      />
    {/each}
  {/if}
  {#if sideBookcase}
    <polygon points={sideBookcase.polygon} class="bookcase" />
    {#each [0, 1, 2, 3, 4] as shelf (shelf)}
      <line
        x1={sideBookcase.point.x - 5}
        y1={sideBookcase.point.y - 50 + shelf * 25}
        x2={sideBookcase.point.x + 5}
        y2={sideBookcase.point.y - 50 + shelf * 25}
        stroke="#b59f6d"
        stroke-width="1.2"
      />
    {/each}
  {/if}

  <!-- Magistrate desk (Bureau de travail) -->
  {#if magistrateDesk}
    <polygon points={magistrateDesk.polygon} class="desk-top" />
    <!-- Desk accessories: Leather blotter, banker lamp, files -->
    <rect
      x={magistrateDesk.point.x - 18}
      y={magistrateDesk.point.y - 8}
      width="36"
      height="16"
      fill="#1b241c"
      stroke="#5a705e"
    />
    <circle cx={magistrateDesk.point.x - 16} cy={magistrateDesk.point.y + 4} r="3" fill="#c2a767" />
    <rect
      x={magistrateDesk.point.x + 10}
      y={magistrateDesk.point.y - 6}
      width="12"
      height="14"
      fill="#d8d2c2"
      stroke="#888"
    />
    <!-- Magistrate leather armchair -->
    <rect
      x={magistrateDesk.point.x - 12}
      y={magistrateDesk.point.y - 24}
      width="24"
      height="14"
      rx="4"
      class="leather-seat"
    />
  {/if}

  <!-- Visitor chairs facing the desk -->
  {#if visitorChair1}
    <circle cx={visitorChair1.point.x} cy={visitorChair1.point.y} r="8" class="leather-seat" />
  {/if}
  {#if visitorChair2}
    <circle cx={visitorChair2.point.x} cy={visitorChair2.point.y} r="8" class="leather-seat" />
  {/if}

  <!-- Door 1010 plaque on corridor -->
  <rect
    x={justicePoint([-0.5, -3]).x - 15}
    y={justicePoint([-0.5, -3]).y - 4}
    width="30"
    height="8"
    fill="#111"
    stroke="#ffd700"
    stroke-width="1.5"
  />
  <text
    x={justicePoint([-0.5, -3]).x}
    y={justicePoint([-0.5, -3]).y + 2}
    text-anchor="middle"
    fill="#ffd700"
    font-size="7"
    font-weight="bold">1010</text
  >

  <!-- Room 1010 labels (exact strings retained for tests) -->
  <text x={justicePoint([-0.5, -9.2]).x} y={justicePoint([-0.5, -9.2]).y} class="label">
    {french ? 'Bureau du vice-ministre' : "Deputy Minister's Office"}
  </text>
  <text x={justicePoint([-0.5, -8.3]).x} y={justicePoint([-0.5, -8.3]).y} class="sub">
    Room 1010 · judicial interrogation office
  </text>
  <text x={justicePoint([-0.5, -4.5]).x} y={justicePoint([-0.5, -4.5]).y} class="dim">
    {french
      ? 'Bureau formel · chaises visiteurs · bibliothèques murales'
      : 'Formal desk · visitor chairs · wall bookcases'}
  </text>

  <!-- 3. SALLES D'INTERROGATOIRE SECONDAIRES -->
  <text x={justicePoint([14, -8]).x} y={justicePoint([14, -8]).y - 12} class="label">
    {french ? "Salles d'interrogatoire" : 'Interrogation Rooms'}
  </text>
  {#each justiceFixtures.filter(({ id }) => id.includes('interrogation-table')) as table (table.id)}
    <polygon points={table.polygon} class="fixture" />
    <circle cx={table.point.x - 22} cy={table.point.y} r="6" class="fixture" />
    <circle cx={table.point.x + 22} cy={table.point.y} r="6" class="fixture" />
  {/each}

  <!-- 4. PARLOIR D'ENREGISTREMENT (VISITATION ROOM) -->
  {#if visitationPartition}
    <!-- Full glass partition separating visitor and detainee zones -->
    <line
      x1={justicePoint([0.5, 5.5]).x}
      y1={justicePoint([0.5, 5.5]).y}
      x2={justicePoint([20.75, 5.5]).x}
      y2={justicePoint([20.75, 5.5]).y}
      class="glass-wall"
    />
    <!-- Acoustical divider panels forming consultation cubicles -->
    {#each [3, 7, 11, 15, 19] as boothX (boothX)}
      <line
        x1={justicePoint([boothX, 4]).x}
        y1={justicePoint([boothX, 4]).y}
        x2={justicePoint([boothX, 7]).x}
        y2={justicePoint([boothX, 7]).y}
        stroke="#5a6872"
        stroke-width="1.5"
      />
      <!-- Communication interphone handset -->
      <circle
        cx={justicePoint([boothX, 5.5]).x - 4}
        cy={justicePoint([boothX, 5.5]).y}
        r="3"
        fill="#c2a767"
      />
      <!-- Visitor seat (North side) -->
      <circle
        cx={justicePoint([boothX - 2, 3.8]).x}
        cy={justicePoint([boothX - 2, 3.8]).y}
        r="7"
        class="leather-seat"
      />
      <!-- Protected/Detainee seat (South side) -->
      <circle
        cx={justicePoint([boothX - 2, 7.2]).x}
        cy={justicePoint([boothX - 2, 7.2]).y}
        r="7"
        class="leather-seat"
      />
    {/each}

    <!-- Central sliding transfer drawer (tiroir de transfert métallique) -->
    <rect
      x={visitationPartition.point.x - 25}
      y={visitationPartition.point.y - 12}
      width="50"
      height="24"
      rx="3"
      class="transfer-drawer"
    />
    <rect
      x={visitationPartition.point.x - 18}
      y={visitationPartition.point.y - 8}
      width="36"
      height="16"
      fill="#222"
      stroke="#7a8894"
      stroke-dasharray="3 2"
    />
    <!-- Drawer handle -->
    <line
      x1={visitationPartition.point.x - 10}
      y1={visitationPartition.point.y - 10}
      x2={visitationPartition.point.x + 10}
      y2={visitationPartition.point.y - 10}
      stroke="#c2a767"
      stroke-width="2.5"
    />
  {/if}

  <text x={justicePoint([10.6, 1.2]).x} y={justicePoint([10.6, 1.2]).y} class="label">
    {french ? 'Parloir d’enregistrement' : 'Visitation Room'}
  </text>
  <text x={justicePoint([10.6, 2.8]).x} y={justicePoint([10.6, 2.8]).y} class="sub">
    {french ? 'Zone visiteurs' : 'Visitor'}
  </text>
  <text x={justicePoint([10.6, 9.8]).x} y={justicePoint([10.6, 9.8]).y} class="sub">
    {french ? 'Personne protégée / Détenu' : 'Protected person'}
  </text>
  <text x={justicePoint([10.6, 11.4]).x} y={justicePoint([10.6, 11.4]).y} class="dim">
    Glass barrier · recorded 10-minute visits · transfer drawer
  </text>

  <!-- 5. ZONE DE PROTECTION DES TÉMOINS VIP -->
  <text x={justicePoint([-11, 1]).x} y={justicePoint([-11, 1]).y} class="label">
    {french ? 'Zone de protection des témoins VIP' : 'VIP Witness Protection Area'}
  </text>
  <text x={justicePoint([-11, 2.2]).x} y={justicePoint([-11, 2.2]).y} class="dim">
    {french
      ? 'Plafond à caissons · lustre · miroir ovale'
      : 'Coffered ceiling · moulded walls · chandelier · oval mirror'}
  </text>
  <!-- Bed, dining set, armchairs -->
  {#each justiceFixtures.filter( ({ spaceId }) => spaceId.includes('witness-protection') ) as fixture (fixture.id)}
    <polygon
      points={fixture.polygon}
      class={fixture.kind === 'seat' ? 'leather-seat' : 'fixture'}
    />
  {/each}

  <!-- 6. COULOIR DU BUREAU (HALL) -->
  <text x={justicePoint([0, -2]).x} y={justicePoint([0, -2]).y + 4} class="dim" font-size="9">
    {french ? 'Couloir du bureau judiciaire · Accès contrôlé' : 'Bureau Hall · Controlled Access'}
  </text>
</svg>
