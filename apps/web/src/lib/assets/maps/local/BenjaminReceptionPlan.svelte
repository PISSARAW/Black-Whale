<script lang="ts">
  import { locale } from '$lib/i18n'
  import { benjaminFixtures } from '$lib/components/map/projection/benjaminRoomPlan'
</script>

<!-- Parent apartment group starts at (50,82); fixtures use the shared full-viewbox projection. -->
<g transform="translate(-50,-82)" aria-label="Réception de Benjamin, chapitres 363 et 366">
  {#each benjaminFixtures as fixture (fixture.id)}
    <polygon points={fixture.polygon} class="fixed">
      <title>{$locale === 'fr' ? fixture.nameFr : fixture.name}</title>
    </polygon>
  {/each}
  <text x="207" y="572" class="sublabel"
    >{$locale === 'fr' ? 'Table de réunion' : 'Briefing table'} · ch. 363</text
  >
  <text x="213" y="368" class="sublabel"
    >{$locale === 'fr' ? 'Paysage encadré' : 'Framed landscape'}</text
  >
  <text x="515" y="368" class="sublabel"
    >{$locale === 'fr' ? 'Téléphone mural' : 'Wall telephone'} · ch. 366</text
  >
</g>

<style>
  .fixed {
    stroke: #ffd700;
    stroke-width: 2;
    fill: rgba(255, 215, 0, 0.09);
    pointer-events: none;
  }
  .sublabel {
    fill: #ffd700;
    font: 12px sans-serif;
    text-anchor: middle;
    pointer-events: none;
  }
</style>
