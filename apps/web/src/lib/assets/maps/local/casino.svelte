<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    CASINO_SCALE,
    casinoPoint,
    casinoPolygon,
    casinoRoom,
    casinoFixtures,
    casinoColumns,
    casinoDoors,
    casinoEmergency,
  } from '$lib/components/map/projection/casinoPlan'
  const french = $derived($locale === 'fr')
  const swamp = casinoFixtures.find(({ id }) => id.endsWith('-swamp-ball'))!
  const lounge = casinoPoint([-49, 30])
</script>

<svg
  viewBox="0 0 1000 400"
  role="img"
  aria-label={french ? 'Plan du casino VIP et de SWAMP BALL' : 'VIP casino and SWAMP BALL plan'}
  class="w-full h-full rounded-lg bg-[#050505] text-[#fffff0]"
>
  <text x="500" y="27" text-anchor="middle" fill="currentColor" font-size="20"
    >{french ? 'Casino VIP' : 'VIP Casino'}</text
  >
  <text x="500" y="48" text-anchor="middle" fill="#b1a58d" font-size="12"
    >{french
      ? 'Pont 1-C reconstitué · Chap. 405 et 420'
      : 'Reconstructed Tier 1-C · Ch. 405 and 420'}</text
  >
  <polygon
    points={casinoPolygon(casinoRoom.footprint)}
    fill="#21191e"
    stroke="#ccc6b7"
    stroke-width="2"
  />
  {#each casinoFixtures as fixture (fixture.id)}
    {@const gallery = fixture.kind === 'platform' || fixture.base > 0}
    {@const machine = fixture.id.includes('-gaming-table-')}
    <polygon
      points={fixture.polygon}
      fill={gallery ? '#7e7562' : machine ? '#37534f' : '#544638'}
      fill-opacity={gallery ? 0.22 : 0.8}
      stroke={gallery ? '#bca16b' : '#b7b09e'}
      stroke-width={gallery ? 0.8 : 1.2}
      stroke-dasharray={gallery ? '4 3' : undefined}
    >
      <title>{french ? fixture.nameFr : fixture.name}</title>
    </polygon>
    {#if machine}
      <circle cx={fixture.point.x} cy={fixture.point.y} r="3" fill="#cdbb83" />
    {/if}
  {/each}
  {#each casinoColumns as column, index (index)}
    <circle cx={column.x} cy={column.y} r={0.45 * CASINO_SCALE} fill="#c9c5b5" />
  {/each}
  {#each casinoDoors as door, index (index)}
    <line
      x1={door.from.x}
      y1={door.from.y}
      x2={door.to.x}
      y2={door.to.y}
      stroke="#c2a767"
      stroke-width="4"
    />
  {/each}
  <text x={swamp.point.x} y={swamp.point.y + 4} text-anchor="middle" fill="#f2dfb4" font-size="8"
    >SWAMP BALL</text
  >
  <text x={lounge.x} y={lounge.y - 38} text-anchor="middle" fill="#b1a58d" font-size="10"
    >{french ? 'Salon' : 'Lounge'}</text
  >
  <circle
    cx={casinoEmergency.x}
    cy={casinoEmergency.y}
    r="15"
    fill="none"
    stroke="#bb8175"
    stroke-width="1.5"
    stroke-dasharray="4 3"
  />
  <text x={casinoEmergency.x} y="375" text-anchor="middle" fill="#bb8175" font-size="10"
    >{french ? 'Escalier de secours' : 'Emergency stair'}</text
  >
  <text x="500" y="391" text-anchor="middle" fill="#9b9689" font-size="11"
    >{french
      ? 'Dimensions, nombre et placement des bornes estimés ; plan et visite partagent la même géométrie.'
      : 'Estimated dimensions, machine count and placement; the map and tour share the same geometry.'}</text
  >
</svg>
