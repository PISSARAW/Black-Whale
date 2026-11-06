<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    BANQUET_SCALE,
    banquetPoint,
    banquetPolygon,
    banquetRooms,
    banquetFixtures,
    banquetDoors,
  } from '$lib/components/map/projection/banquetPlan'
  const french = $derived($locale === 'fr')
  const throne = banquetFixtures.find(({ id }) => id.endsWith('-throne-dais'))!
  const stage = banquetFixtures.find(({ id }) => id.endsWith('-stage'))!
  const step = banquetPoint([-15, 20.857])
</script>

<svg
  viewBox="0 0 1000 520"
  role="img"
  aria-label={french
    ? 'Plan de la salle du banquet, trône et scène aux extrémités opposées'
    : 'Banquet hall plan, with the throne and stage at opposite ends'}
  class="w-full h-full rounded-lg bg-[#050505] text-[#fffff0]"
>
  <text x="500" y="27" text-anchor="middle" fill="currentColor" font-size="20"
    >{french ? 'Salle du banquet' : 'Banquet Hall'}</text
  >
  <text x="500" y="47" text-anchor="middle" fill="#b1a58d" font-size="12"
    >{french
      ? 'Niveau 1-A · Chap. 359 et 383'
      : 'Tier 1-A · Ch. 359 and 383'}</text
  >
  {#each banquetRooms as room (room.id)}
    <polygon
      points={banquetPolygon(room.footprint)}
      fill={room.id.endsWith('-service-end') ? '#191919' : '#111111'}
      stroke="#ccc6b7"
      stroke-width="1.8"
    />
  {/each}
  {#each banquetFixtures as fixture (fixture.id)}
    {@const royal = fixture.id.includes('-throne-')}
    {@const colour = royal ? '#bca16c' : '#9b9689'}
    {#if fixture.kind === 'table'}
      <circle
        cx={fixture.point.x}
        cy={fixture.point.y}
        r={(fixture.size[0] * BANQUET_SCALE) / 2}
        fill="#393832"
        stroke="#c8c1ae"
        stroke-width="0.8"
      />
    {:else}
      <polygon
        points={fixture.polygon}
        fill={fixture.kind === 'painting' ? '#605a4d' : '#292720'}
        stroke={colour}
        stroke-width={royal ? 1.5 : 1}
      />
    {/if}
  {/each}
  {#each banquetDoors as door, index (index)}
    <line
      x1={door.from.x}
      y1={door.from.y}
      x2={door.to.x}
      y2={door.to.y}
      stroke="#c2a767"
      stroke-width="3"
    />
  {/each}
  <line
    x1={step.x}
    y1={step.y}
    x2={step.x}
    y2={banquetPoint([13, 20.857]).y}
    stroke="#aaa18a"
    stroke-dasharray="4 3"
  />
  <text x={throne.point.x} y="487" text-anchor="middle" fill="#dac28b" font-size="13"
    >{french ? 'Estrade et trône du roi' : 'Royal dais and throne'}</text
  >
  <text x={stage.point.x} y="487" text-anchor="middle" fill="#dac28b" font-size="13"
    >{french ? 'Scène des spectacles' : 'Performance stage'}</text
  >
  <text x="500" y="508" text-anchor="middle" fill="#9b9689" font-size="11"
    >{french
      ? 'Reconstruction : dimensions et placement détaillé estimés.'
      : 'Reconstruction: estimated dimensions and detailed placement.'}</text
  >
</svg>
