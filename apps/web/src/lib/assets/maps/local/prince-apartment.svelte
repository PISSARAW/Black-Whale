<script lang="ts">
  import { locale } from '$lib/i18n'
  import { mapState } from '$lib/state/mapState.svelte'
  import { princeApartmentPlan } from '$lib/components/map/projection/princeApartmentPlan'

  let roomNumber = $derived(
    Number(mapState.selectedLocationId?.match(/10(?:0[1-9]|1[0-4])/)?.[0] ?? 1001),
  )
  let plan = $derived(princeApartmentPlan(roomNumber))
</script>

<svg
  viewBox="0 0 800 800"
  class="w-full h-full bg-[#050505] rounded-lg border border-[#333]"
  aria-label={`Apartment ${roomNumber} — shared ship and tour plan`}
>
  <text x="400" y="42" class="title">{roomNumber}</text>
  <text x="400" y="70" class="source">
    {$locale === 'fr'
      ? 'Transcription non cotée du chap. 363 · plan commun à Ship et Tour'
      : 'Unmeasured ch. 363 transcription · shared by Ship and Tour'}
  </text>
  <rect x="50" y="100" width="700" height="600" class="outline" />
  {#if plan}
    {#each plan.walls as wall (wall.id)}
      <line x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2} class="wall" />
    {/each}
    {#each plan.fixtures as fixture (fixture.id)}
      <polygon points={fixture.polygon} class="fixture">
        <title>{$locale === 'fr' ? fixture.nameFr : fixture.name}</title>
      </polygon>
    {/each}
    {#each plan.labels as label (label.id)}
      <text x={label.x} y={label.y} class="label">
        {$locale === 'fr' ? label.nameFr : label.name}
      </text>
    {/each}
  {/if}
  <text x="400" y="746" class="source">
    {$locale === 'fr'
      ? 'Cloisons relatives relevées sur la perspective ; dimensions métriques reconstituées'
      : 'Relative partitions traced from the perspective; metric dimensions reconstructed'}
  </text>
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
