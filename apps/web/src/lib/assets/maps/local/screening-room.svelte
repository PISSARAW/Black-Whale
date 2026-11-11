<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    screeningPoint,
    screeningFixtures,
    screeningDoors,
    screeningRoom,
  } from '$lib/components/map/projection/screeningRoomPlan'
  const french = $derived($locale === 'fr')
  const outline = screeningRoom.footprint
    .map((p) => {
      const v = screeningPoint(p)
      return `${v.x},${v.y}`
    })
    .join(' ')
  const screen = screeningFixtures.find((s) => s.id.endsWith('-screen'))!
</script>

<svg
  viewBox="0 0 1000 560"
  role="img"
  aria-label={french
    ? 'Théâtre du Tier 2 : scène, rideau, loges et parterre'
    : 'Tier 2 theatre: stage, curtain, boxes and stalls'}
  class="w-full h-full rounded-lg bg-[#050505] text-[#fffff0]"
>
  <text x="500" y="28" text-anchor="middle" fill="currentColor" font-size="20"
    >{french ? 'Théâtre — Salle de projection' : 'Theatre — Screening Room'}</text
  >
  <text x="500" y="49" text-anchor="middle" fill="#ada184" font-size="12"
    >{french
      ? 'Tier 2 · Chapitre 359 · Plan reconstitué'
      : 'Tier 2 · Chapter 359 · Reconstructed plan'}</text
  >
  <polygon points={outline} fill="#1d1b1c" stroke="#cec8b7" stroke-width="2" />
  {#each screeningFixtures as fixture (fixture.id)}
    {@const gallery = fixture.base > 2}
    <polygon
      points={fixture.polygon}
      fill={fixture.kind === 'seat'
        ? '#5b3c43'
        : fixture.id.endsWith('-curtain')
          ? '#6d1323'
          : fixture.id.endsWith('-screen')
            ? '#ddd8ca'
            : '#6e675b'}
      fill-opacity={gallery ? 0.4 : 0.8}
      stroke="#c8bea5"
      stroke-width="0.8"
      stroke-dasharray={gallery ? '4 3' : undefined}
    >
      <title>{french ? fixture.nameFr : fixture.name}</title>
    </polygon>
  {/each}
  {#each screeningDoors as door, i (i)}
    <line
      x1={door.from.x}
      y1={door.from.y}
      x2={door.to.x}
      y2={door.to.y}
      stroke="#d1b16d"
      stroke-width="4"
    />
  {/each}
  <text x={screen.point.x + 15} y={screen.point.y + 4} fill="#efe9d6" font-size="11"
    >{french ? 'Écran' : 'Screen'}</text
  >
  <text
    x="520"
    y={screeningPoint([-40, 29.75]).y + 4}
    text-anchor="middle"
    fill="#cec8b7"
    font-size="11">{french ? 'Allée centrale libre' : 'Clear central aisle'}</text
  >
  <text x="500" y="550" text-anchor="middle" fill="#9d9788" font-size="11"
    >{french
      ? 'Dimensions et nombre de sièges estimés. Le plan et la visite partagent les mêmes structures.'
      : 'Estimated dimensions and seat count. The map and tour share the same fixtures.'}</text
  >
</svg>
