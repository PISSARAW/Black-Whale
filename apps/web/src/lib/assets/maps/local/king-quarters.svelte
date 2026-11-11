<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    salonRooms,
    salonFixtures,
    salonDoors,
    salonPolygon,
  } from '$lib/components/map/projection/royalSalonPlan'
  const french = $derived($locale === 'fr')
</script>

<svg
  viewBox="0 0 900 650"
  role="img"
  aria-label={french ? 'Plan du salon du roi Nasubi' : 'King Nasubi’s salon plan'}
  class="w-full h-full rounded-lg border border-[#333] bg-[#050505] text-[#fffff0]"
>
  <defs>
    <pattern id="royal-floor" width="76.8" height="76.8" patternUnits="userSpaceOnUse">
      <path d="M0 38.4 38.4 0 76.8 38.4 38.4 76.8Z" fill="none" stroke="#75684c" stroke-width="1" />
    </pattern>
  </defs>
  <text x="450" y="30" text-anchor="middle" fill="currentColor" font-size="22">
    {french ? 'Le salon du roi Nasubi' : 'King Nasubi’s Salon'}
  </text>
  <text x="450" y="51" text-anchor="middle" fill="#b1a58d" font-size="12">
    {french
      ? 'Chap. 382 · Panneau paysager et manteau sur deux murs distincts'
      : 'Ch. 382 · Landscape panel and mantel on separate walls'}
  </text>
  {#each salonRooms as room (room.id)}
    <polygon
      points={salonPolygon(room.footprint)}
      fill={room.id.endsWith('-living') ? 'url(#royal-floor)' : '#191919'}
      stroke="#ccc6b7"
      stroke-width="2"
    />
  {/each}
  {#each salonFixtures as fixture (fixture.id)}
    <polygon
      points={fixture.polygon}
      fill={fixture.kind === 'seat'
        ? '#586252'
        : fixture.kind === 'painting'
          ? '#a58e58'
          : '#393329'}
      stroke={fixture.id.endsWith('-royal-chaise') ? '#dfc590' : '#ab9872'}
      stroke-width={fixture.kind === 'painting' ? 2.5 : 1.2}
    >
      <title>{french ? fixture.nameFr : fixture.name}</title>
    </polygon>
  {/each}
  {#each salonDoors as door, index (index)}
    <line
      x1={door.from.x}
      y1={door.from.y}
      x2={door.to.x}
      y2={door.to.y}
      stroke="#c2a767"
      stroke-width="4"
    />
  {/each}
  <text x="450" y="96" text-anchor="middle" fill="#dac28b" font-size="12">
    {french ? 'Panneau paysager' : 'Landscape panel'}
  </text>
  <text
    x="770"
    y="232"
    text-anchor="middle"
    fill="#dac28b"
    font-size="12"
    transform="rotate(90 770 232)"
  >
    {french ? 'Tableau de bataille et manteau' : 'Battle painting and mantel'}
  </text>
  <text x="330" y="324" text-anchor="middle" fill="#dac28b" font-size="11">
    {french ? 'Fauteuil du roi' : 'King’s reclining chair'}
  </text>
  <text x="450" y="554" text-anchor="middle" fill="#b1a58d" font-size="12">
    {french ? 'Vestibule reconstitué' : 'Reconstructed vestibule'}
  </text>
  <text x="450" y="621" text-anchor="middle" fill="#9b9689" font-size="11">
    {french
      ? 'Chap. 382 pp. 3–11 · dimensions et placement reconstitués · vestibule non relevé'
      : 'Ch. 382 pp. 3–11 · reconstructed dimensions and placement · vestibule unmeasured'}
  </text>
</svg>
