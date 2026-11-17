<script lang="ts">
  import { link, locale } from '$lib/i18n'
  import FightPersonalization from '$lib/components/fighting/FightPersonalization.svelte'
  import FightCareer from '$lib/components/fighting/FightCareer.svelte'
  import FightSeason from '$lib/components/fighting/FightSeason.svelte'
  import '../pvp/pvp.css'
</script>

<svelte:head><title>Clash · Profil et saison</title></svelte:head>
<main class="pvp-page">
  <a href={$link('/fighting')}>{$locale === 'fr' ? 'Retour à Clash' : 'Back to Clash'}</a>
  <h1>{$locale === 'fr' ? 'Profil et saison' : 'Profile and season'}</h1>
  <a href={$link('/fighting/profile/solo')}
    >{$locale === 'fr' ? 'Parcours et défis solo' : 'Solo routes and challenges'}</a
  >
  <a href={$link('/fighting/pvp/online')}
    >{$locale === 'fr'
      ? 'Jeu en ligne et récupération d’identité'
      : 'Online play and identity recovery'}</a
  >
  <a href={$link('/fighting/teams')}
    >{$locale === 'fr' ? 'Équipes et relais' : 'Teams and relays'}</a
  >
  <a href={$link('/fighting/tournament')}
    >{$locale === 'fr' ? 'Organiser un tournoi' : 'Organize a tournament'}</a
  >
  <FightPersonalization language={$locale === 'fr' ? 'fr' : 'en'} />
  <FightCareer language={$locale === 'fr' ? 'fr' : 'en'} /><FightSeason
    language={$locale === 'fr' ? 'fr' : 'en'}
    endpoint={$link('/fighting/profile/api')}
  />
</main>
