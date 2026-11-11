<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    wobleApartmentFixtures,
    wobleApartmentWalls,
    wobleApartmentLabels,
  } from '$lib/components/map/projection/wobleApartmentPlan'
</script>

<svg
  viewBox="0 0 800 800"
  class="w-full h-full bg-[#050505] rounded-lg border border-[#333]"
  aria-label="Apartment 1014 — reconstructed walked layout"
>
  <text x="400" y="42" class="title">1014 · Woble</text>
  <text x="400" y="70" class="source"
    >{$locale === 'fr'
      ? 'Implantation de visite reconstituée · coupe non cotée du chap. 368'
      : 'Reconstructed walked layout · unmeasured ch. 368 cutaway'}</text
  >
  <rect x="50" y="100" width="700" height="600" class="outline" />
  {#each wobleApartmentWalls as wall (wall.id)}
    <line x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2} class="wall" />
  {/each}
  {#each wobleApartmentFixtures as fixture (fixture.id)}
    <polygon points={fixture.polygon} class="fixture"
      ><title>{$locale === 'fr' ? fixture.nameFr : fixture.name}</title></polygon
    >
  {/each}
  {#each wobleApartmentLabels as label (label.id)}
    <text x={label.x} y={label.y} class="label">{$locale === 'fr' ? label.nameFr : label.name}</text
    >
  {/each}
  <text x="400" y="742" class="source"
    >{$locale === 'fr'
      ? 'Mobilier : chap. 359 p. 8, 360, 367 p. 1, 371 pp. 4–5'
      : 'Furniture: ch. 359 p. 8, 360, 367 p. 1, 371 pp. 4–5'}</text
  >
  <text x="400" y="766" class="source"
    >{$locale === 'fr'
      ? 'Autres pièces et positions métriques reconstituées'
      : 'Other rooms and metric placements reconstructed'}</text
  >
</svg>

<style>
  .title {
    fill: #ffd700;
    font: 28px sans-serif;
    text-anchor: middle;
  }
  .source {
    fill: #aaa;
    font: 12px sans-serif;
    text-anchor: middle;
  }
  .outline {
    fill: rgba(255, 215, 0, 0.025);
    stroke: #aaa;
    stroke-width: 2;
  }
  .wall {
    stroke: #fffff0;
    stroke-width: 4;
  }
  .fixture {
    fill: rgba(255, 215, 0, 0.12);
    stroke: #ffd700;
    stroke-width: 1.5;
  }
  .label {
    fill: #fffff0;
    font: 12px sans-serif;
    text-anchor: middle;
    paint-order: stroke;
    stroke: #050505;
    stroke-width: 3;
  }
</style>
