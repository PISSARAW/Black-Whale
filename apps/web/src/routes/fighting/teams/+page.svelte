<script lang="ts">
  import FightTeams from '$lib/components/fighting/FightTeams.svelte'
  import { locale, link } from '$lib/i18n'
</script>

<main>
  <a href={$link('/fighting')}>{$locale === 'fr' ? 'Retour à Clash' : 'Back to Clash'}</a
  ><FightTeams language={$locale} />
</main>

<style>
  main {
    padding: clamp(0.5rem, 2vw, 2rem);
    max-width: 1300px;
    margin: auto;
  }
</style>
