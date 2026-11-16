<script lang="ts">
  import { onMount } from 'svelte'
  import PvpDuel from '../../src/routes/fighting/pvp/PvpDuel.svelte'
  import { createPvpClient, type PvpClient } from '$lib/fighting/pvp/client'
  import { PVP_RULESET, pvpSessionKey } from '$lib/fighting/pvp/types'
  import { createFightEnvironment } from '$lib/fighting/fightEnvironment'
  import '../../src/routes/fighting/pvp/pvp.css'
  let client: PvpClient | null = null
  let autoConnect = false,
    invite = ''
  const id = new URLSearchParams(location.search).get('match')
  async function create() {
    const response = await fetch('/__pvp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ruleset: PVP_RULESET,
        setup: {
          player: 'basho',
          opponent: 'hisoka',
          formatId: 'knockout',
          environment: createFightEnvironment(),
        },
      }),
    })
    const session = await response.json()
    sessionStorage.setItem(pvpSessionKey(session.matchId), session.token)
    location.href = `${location.pathname}?match=${session.matchId}`
  }
  onMount(() => {
    if (!id) return
    autoConnect = Boolean(sessionStorage.getItem(pvpSessionKey(id)))
    invite = location.href
    client = createPvpClient({
      matchId: id,
      endpoint: `/__pvp/${id}`,
      fetch,
      storage: sessionStorage,
    })
  })
</script>

<main class="pvp-page">
  <h1>Clash · Duel privé</h1>
  {#if client}<PvpDuel {client} {autoConnect} {invite} language="fr" />{:else}<button
      type="button"
      onclick={create}>Créer une invitation</button
    >{/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #07111a;
    color: white;
  }
</style>
