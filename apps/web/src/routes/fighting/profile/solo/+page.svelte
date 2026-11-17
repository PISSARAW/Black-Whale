<script lang="ts">
  import { link, locale } from '$lib/i18n'
  import FightSolo from '$lib/components/fighting/FightSolo.svelte'
  import '../../pvp/pvp.css'
</script>

<svelte:head
  ><title
    >Clash · {$locale === 'fr' ? 'Parcours et défis solo' : 'Solo routes and challenges'}</title
  ><meta
    name="description"
    content="Parcours solo Clash : perception, préparation, protection, survie, temps et score, avec les règles de Nen du duel."
  /></svelte:head
>
<main class="pvp-page">
  <a href={$link('/fighting')}>{$locale === 'fr' ? 'Retour à Clash' : 'Back to Clash'}</a>
  <h1>{$locale === 'fr' ? 'Parcours et défis solo' : 'Solo routes and challenges'}</h1>
  <FightSolo language={$locale === 'fr' ? 'fr' : 'en'} />
</main>
