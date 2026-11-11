<script lang="ts">
  import { locale } from '$lib/i18n'
  import { benjaminApartmentFixtures } from '$lib/components/map/projection/benjaminRoomPlan'
</script>

<g transform="translate(-50,-82)">
  {#each benjaminApartmentFixtures as fixture (fixture.id)}
    <polygon points={fixture.polygon}>
      <title>{$locale === 'fr' ? fixture.nameFr : fixture.name}</title>
    </polygon>
  {/each}
</g>

<style>
  polygon {
    stroke: #bca46e;
    stroke-width: 2;
    fill: rgba(188, 164, 110, 0.09);
    pointer-events: none;
  }
</style>
