<script lang="ts">
  import { onMount } from 'svelte'
  import { link, locale } from '$lib/i18n'
  import { createPvpClient, type PvpClient } from '$lib/fighting/pvp/client'
  import { pvpSessionKey } from '$lib/fighting/pvp/types'
  import PvpDuel from '../PvpDuel.svelte'
  import type { PageData } from './$types'
  import '../pvp.css'
  export let data: PageData
  let client: PvpClient | null = null
  let watchInvite = '',
    invite = '',
    autoConnect = false
  onMount(() => {
    let storage: Storage | undefined
    try {
      storage = sessionStorage
      autoConnect = Boolean(storage.getItem(pvpSessionKey(data.matchId)))
      const watch = storage.getItem(`clash:watch:${data.matchId}`)
      if (watch) watchInvite = location.origin + $link(watch)
    } catch {
      /* storage is optional */
    }
    const endpoint = $link(`/fighting/pvp/api/matches/${data.matchId}`)
    const invitation = location.hash.slice(1)
    invite =
      location.origin +
      $link(`/fighting/pvp/${data.matchId}`) +
      (invitation ? `#${invitation}` : '')
    client = createPvpClient({ matchId: data.matchId, endpoint, invitation, fetch, storage })
  })
</script>

<svelte:head><title>Clash · PvP privé</title><meta name="robots" content="noindex" /></svelte:head>
<main class="pvp-page">
  <a href={$link('/fighting')}>{$locale === 'fr' ? 'Retour à Clash' : 'Back to Clash'}</a>
  <h1>Clash · {$locale === 'fr' ? 'Duel privé' : 'Private duel'}</h1>
  {#if client}<PvpDuel
      {client}
      language={$locale === 'fr' ? 'fr' : 'en'}
      {invite}
      {watchInvite}
      {autoConnect}
    />{/if}
</main>
