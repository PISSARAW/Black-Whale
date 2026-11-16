<script lang="ts">
  import { onMount } from 'svelte'
  import { link, locale } from '$lib/i18n'
  import FightSpectator from '$lib/components/fighting/FightSpectator.svelte'
  import type { PageData } from './$types'
  import '../../pvp.css'
  export let data: PageData
  let token: string | null = null
  onMount(() => {
    token = location.hash.slice(1)
  })
</script>

<svelte:head><title>Clash · Spectateur</title><meta name="robots" content="noindex" /></svelte:head>
<main class="pvp-page">
  <a href={$link('/fighting')}>{$locale === 'fr' ? 'Retour à Clash' : 'Back to Clash'}</a>
  <h1>Clash · {$locale === 'fr' ? 'Spectateur' : 'Spectator'}</h1>
  {#if token !== null}<FightSpectator
      language={$locale === 'fr' ? 'fr' : 'en'}
      {token}
      endpoint={$link(`/fighting/pvp/api/matches/${data.matchId}?watch=1`)}
    />{/if}
</main>
