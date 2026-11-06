<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    PRISON_SCALE,
    prisonPoint,
    prisonPolygon,
    prisonRooms,
    prisonFixtures,
    prisonEntrance,
  } from '$lib/components/map/projection/prisonPlan'
  const french = $derived($locale === 'fr')
  const frontStart = prisonPoint(prisonRooms[0].footprint[1])
  const frontEnd = prisonPoint(prisonRooms[0].footprint[2])
  const entrance = prisonPoint(prisonEntrance.atTo!)
</script>

<svg
  viewBox="0 0 800 600"
  role="img"
  aria-label={french
    ? 'Cellule de Beyond et poste des Zodiaques'
    : 'Beyond’s cell and Zodiac watch post'}
  class="w-full h-full rounded-lg bg-[#050505] text-[#fffff0]"
>
  <text x="400" y="35" text-anchor="middle" fill="currentColor" font-size="22">
    {french ? 'La prison de Beyond Netero' : 'Beyond Netero’s prison'}
  </text>
  <text x="400" y="58" text-anchor="middle" fill="#b1a58d" font-size="13">
    {french ? 'Niveau 1 · Chap. 359' : 'Tier 1 · Ch. 359'}
  </text>
  {#each prisonRooms as room (room.id)}
    <polygon
      points={prisonPolygon(room.footprint)}
      fill="#141719"
      stroke="#a6aaab"
      stroke-width="3"
    />
  {/each}
  <!-- The entire common front is open to sight; only the actual grille stands in it. -->
  <line
    x1={frontStart.x}
    y1={frontStart.y + 2}
    x2={frontEnd.x}
    y2={frontEnd.y - 2}
    stroke="#141719"
    stroke-width="7"
  />
  {#each prisonFixtures as fixture (fixture.id)}
    <g>
      <title>{french ? fixture.nameFr : fixture.name}</title>
      {#if fixture.kind === 'bars'}
        {#each fixture.bars as bar, index (index)}
          <polygon points={bar} fill="#bcc1c1" />
        {/each}
      {:else}
        <polygon
          points={fixture.polygon}
          fill={fixture.kind === 'bed' ? '#66665f' : '#343a3c'}
          stroke={fixture.kind === 'manacle' ? '#d4bc85' : '#9b9f9d'}
          stroke-width="1.5"
          stroke-dasharray={fixture.provenance === 'map' ? '3 3' : undefined}
        />
        {#if fixture.kind === 'bed'}
          <rect
            x={fixture.point.x - (fixture.size[0] * PRISON_SCALE) / 2 + 5}
            y={fixture.point.y - (fixture.size[1] * PRISON_SCALE) / 2 + 3}
            width="22"
            height={fixture.size[1] * PRISON_SCALE - 6}
            rx="5"
            fill="#d4d1c6"
          />
        {/if}
      {/if}
    </g>
  {/each}
  <text x="210" y="465" text-anchor="middle" fill="#c7c6bf" font-size="14">
    {french ? 'Cellule · couchette et entrave' : 'Cell · bunk and wall restraint'}
  </text>
  <text x="525" y="465" text-anchor="middle" fill="#c7c6bf" font-size="14">
    {french ? 'Veille des Zodiaques' : 'Zodiac watch'}
  </text>
  <circle cx={entrance.x} cy={entrance.y} r="5" fill="#d4bc85" />
  <text x={entrance.x} y={entrance.y + 25} text-anchor="middle" fill="#d4bc85" font-size="12">
    {french ? 'Vers le couloir' : 'To corridor'}
  </text>
  <text x="400" y="548" text-anchor="middle" fill="#a6aaab" font-size="12">
    {french
      ? 'Même plan que la visite · dimensions et implantations estimées'
      : 'Shared with the tour · estimated dimensions and placements'}
  </text>
  <text x="400" y="570" text-anchor="middle" fill="#908b80" font-size="11">
    {french
      ? 'Pointillés : urinoir hérité de la carte, non confirmé par la case consultée.'
      : 'Dashed: urinal from the earlier map, unconfirmed in the consulted panel.'}
  </text>
</svg>
