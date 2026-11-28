<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    CASINO_SCALE,
    CASINO_MAP_WIDTH,
    CASINO_MAP_HEIGHT,
    casinoPolygon,
    casinoRoom,
    casinoStairRoom,
    casinoGamingSurfaces,
    casinoFurnishings,
    casinoColumns,
    casinoDoors,
    casinoSpiral,
    casinoLowerRooms,
    casinoLowerFixtures,
    casinoLowerDoors,
    casinoLowerArrival,
  } from '$lib/components/map/projection/casinoPlan'
  const french = $derived($locale === 'fr')
  const swamp = casinoFurnishings.find(({ id }) => id.endsWith('-swamp-ball'))!
</script>

<svg
  viewBox={`0 0 ${CASINO_MAP_WIDTH} ${CASINO_MAP_HEIGHT}`}
  role="img"
  aria-label={french
    ? 'Paliers du casino VIP et hall de secours'
    : 'VIP casino terraces and lower hall'}
  class="w-full h-full rounded-lg bg-[#100e14] text-[#fff4df]"
>
  <text x="80" y="30" fill="currentColor" font-size="22" font-weight="600">
    {french ? 'Casino VIP' : 'VIP Casino'}
  </text>
  <text x="920" y="30" text-anchor="end" fill="#c2b59d" font-size="13">
    {french ? 'Niveau 1 · Chapitre 420' : 'Tier 1 · Chapter 420'}
  </text>
  <polygon
    points={casinoPolygon(casinoRoom.footprint)}
    fill="#241c27"
    stroke="#ccc6b7"
    stroke-width="1.6"
  />
  <polygon
    points={casinoPolygon(casinoStairRoom.footprint)}
    fill="#383037"
    stroke="#d59a88"
    stroke-width="1.6"
  />
  {#each casinoGamingSurfaces as surface (surface.id)}
    <polygon
      points={surface.polygon}
      fill={surface.id.includes('-stair-') ? '#947e9a' : '#685471'}
      stroke="#bb9db8"
      stroke-width="0.8"
    >
      <title>{french ? surface.nameFr : surface.name} · +{surface.height} m</title>
    </polygon>
    {#if surface.id.includes('-gaming-terrace-')}
      <text
        x={surface.point.x}
        y={surface.point.y - 19}
        text-anchor="middle"
        fill="#f0dedb"
        font-size="10"
      >
        +{french ? surface.height.toFixed(1).replace('.', ',') : surface.height.toFixed(1)} m
      </text>
    {/if}
  {/each}
  {#each casinoFurnishings as fixture (fixture.id)}
    {@const gallery = fixture.base >= 4.2}
    {@const island = fixture.id.includes('-machine-island-')}
    {@const machine = fixture.id.includes('-gaming-table-')}
    <polygon
      points={fixture.polygon}
      fill={gallery ? '#a29478' : island ? '#b0784c' : machine ? '#375b56' : '#544638'}
      fill-opacity={gallery ? 0.2 : 0.92}
      stroke={gallery ? '#bca16b' : island ? '#f4ca80' : '#b7b09e'}
      stroke-width={gallery ? 0.8 : 1.2}
      stroke-dasharray={gallery ? '4 3' : undefined}
    >
      <title>{french ? fixture.nameFr : fixture.name}</title>
    </polygon>
    {#if island}
      <circle cx={fixture.point.x} cy={fixture.point.y} r="7" fill="#382f32" stroke="#f4ca80" />
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
      stroke="#e4c483"
      stroke-width="4"
    />
  {/each}
  <text
    x={swamp.point.x}
    y={swamp.point.y + 4}
    text-anchor="middle"
    fill="#f8e1ac"
    font-size="10"
    font-weight="600">SWAMP BALL</text
  >
  <circle
    cx={casinoSpiral.point.x}
    cy={casinoSpiral.point.y}
    r={casinoSpiral.radius}
    fill="#21191e"
    stroke="#efa797"
    stroke-width="1.4"
  />
  <line
    x1={casinoSpiral.entry.x}
    y1={casinoSpiral.entry.y}
    x2={casinoSpiral.entry.x}
    y2={casinoSpiral.point.y}
    stroke="#efa797"
    stroke-width="1.4"
  />
  <path
    d={`M ${casinoSpiral.point.x + 10} ${casinoSpiral.point.y} a 10 10 0 1 1 -10 -10 a 6 6 0 1 1 -6 6`}
    fill="none"
    stroke="#efa797"
    stroke-width="1.2"
  />
  <text x="80" y="374" fill="#dbcaaf" font-size="13">
    {french
      ? 'Entrée  ·  Paliers de jeu  ·  Îlots et rangées de machines'
      : 'Entrance  ·  Gaming terraces  ·  Machine islands and banks'}
  </text>
  <text x="920" y="374" text-anchor="end" fill="#efa797" font-size="13">
    {french ? 'Local du colimaçon' : 'Spiral stair room'}
  </text>

  <line x1="80" y1="399" x2="920" y2="399" stroke="#534755" />
  <text x="80" y="446" fill="currentColor" font-size="20">
    {french ? 'Hall inférieur' : 'Lower hall'}
  </text>
  <text x="80" y="472" fill="#c2b59d" font-size="13">
    {french ? 'Arrivée depuis le colimaçon' : 'Arrival from the spiral stair'}
  </text>
  <path d="M 277 468 H 344 L 374 515" fill="none" stroke="#efa797" stroke-dasharray="4 4" />
  {#each casinoLowerRooms as room (room.id)}
    <polygon points={room.polygon} fill="#493e3e" stroke="#c3a990" stroke-width="1.6">
      <title>{french ? room.nameFr : room.name}</title>
    </polygon>
  {/each}
  {#each casinoLowerFixtures as fixture (fixture.id)}
    <polygon
      points={fixture.polygon}
      fill={fixture.kind === 'pillar' ? '#e0d0b4' : '#a48574'}
      stroke="#6b5260"
      stroke-width="0.8"
    >
      <title>{french ? fixture.nameFr : fixture.name}</title>
    </polygon>
  {/each}
  {#each casinoLowerDoors as door, index (index)}
    <line
      x1={door.from.x}
      y1={door.from.y}
      x2={door.to.x}
      y2={door.to.y}
      stroke="#edc688"
      stroke-width="3"
    />
  {/each}
  <circle cx={casinoLowerArrival.x} cy={casinoLowerArrival.y} r="4" fill="#efa797" />
  <path d="M 493 515 H 527 l -6 -5 m 6 5 l -6 5" fill="none" stroke="#edc688" />
  <text x="540" y="520" fill="#e2c59f" font-size="13">
    {french ? 'Vers le pont extérieur' : 'Toward the exterior deck'}
  </text>
  <text x="920" y="625" text-anchor="end" fill="#bfb1a0" font-size="12">
    {french
      ? 'Dimensions et raccords reconstitués · Schémas à des échelles différentes'
      : 'Reconstructed dimensions and connections · Drawings at different scales'}
  </text>
</svg>
