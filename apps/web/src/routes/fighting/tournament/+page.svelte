<script lang="ts">
  import { link, locale } from '$lib/i18n'
  import FightTournament from '$lib/components/fighting/FightTournament.svelte'
  import '../pvp/pvp.css'
</script>

<svelte:head><title>Clash · Tournoi</title></svelte:head>
<main class="pvp-page">
  <a href={$link('/fighting')}>{$locale === 'fr' ? 'Retour à Clash' : 'Back to Clash'}</a>
  <h1>Clash Cup</h1>
  <a href={$link('/fighting/pvp/online')}
    >{$locale === 'fr'
      ? 'Tournois en ligne avec résultats serveur'
      : 'Online tournaments with server results'}</a
  >
  <FightTournament language={$locale === 'fr' ? 'fr' : 'en'} />
</main>
