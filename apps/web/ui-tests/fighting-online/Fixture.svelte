<script lang="ts">
  import { tick } from 'svelte'
  import FightOnline from '$lib/components/fighting/FightOnline.svelte'
  import FightOnlineReturn from '$lib/components/fighting/FightOnlineReturn.svelte'
  import FightOnlineBracket from '$lib/components/fighting/FightOnlineBracket.svelte'
  import { rememberOnlineSession } from '$lib/fighting/online/client'
  import type { PvpSession } from '$lib/fighting/pvp/types'
  import type { OnlineTournament, OnlineSeries } from '$lib/fighting/online/types'
  let language: 'fr' | 'en' = 'fr',
    selected = ''
  let tournament:
    | (Omit<OnlineTournament, 'joinHash'> & {
        results: Pick<OnlineSeries, 'id' | 'tournament' | 'score' | 'status' | 'winner' | 'games'>[]
      })
    | null = null
  function play(session: PvpSession) {
    rememberOnlineSession(session)
    selected = session.matchId
  }
  export async function english() {
    language = 'en'
    await tick()
  }
  export async function showTournament(id: string) {
    tournament = await (await fetch(`/__online?tournament=${encodeURIComponent(id)}`)).json()
    await tick()
  }
  export function selectedMatch() {
    return selected
  }
</script>

<main>
  <h1>Clash · {language === 'fr' ? 'Jeu en ligne' : 'Online play'}</h1>
  <FightOnline
    endpoint="/__online"
    profileEndpoint="/__profile"
    base="/ui-tests/fighting-online/"
    {language}
    onPlay={play}
  />
  {#if selected}<p data-selected>{selected}</p>
    <FightOnlineReturn
      endpoint="/__online"
      href="/ui-tests/fighting-online/"
      matchId={selected}
      {language}
    />{/if}
  {#if tournament}<FightOnlineBracket {tournament} results={tournament.results} {language} />{/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #071522;
    color: #edf4f8;
    font:
      15px/1.5 system-ui,
      sans-serif;
  }
  main {
    max-width: 1050px;
    margin: auto;
    padding: 1rem;
    min-width: 0;
  }
  h1 {
    font-size: 1.5rem;
  }
</style>
