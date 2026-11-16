<script lang="ts">
  import { onMount } from 'svelte'
  import { RANKING_STORAGE, rankingCredential } from '$lib/fighting/career/ranking'
  export let language: 'fr' | 'en'
  export let endpoint: string
  let credential: ReturnType<typeof rankingCredential> = null
  let season = '',
    entries: { id: string; name: string; rating: number; wins: number; losses: number }[] = []
  let name = '',
    error = '',
    busy = false
  $: fr = language === 'fr'
  async function refresh() {
    try {
      const response = await fetch(endpoint)
      if (!response.ok) throw Error('SEASON_UNAVAILABLE')
      const value = await response.json()
      season = value.season
      entries = value.entries
    } catch {
      error = fr ? 'Saison momentanément indisponible.' : 'Season temporarily unavailable.'
    }
  }
  async function register() {
    busy = true
    error = ''
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) throw Error('REGISTER_FAILED')
      credential = await response.json()
      localStorage.setItem(RANKING_STORAGE, JSON.stringify(credential))
    } catch {
      error = fr ? 'Inscription impossible.' : 'Could not register.'
    } finally {
      busy = false
    }
  }
  onMount(() => {
    try {
      credential = rankingCredential(localStorage)
    } catch {
      /* local profile optional */
    }
    void refresh()
  })
</script>

<section class="season-panel" aria-label={fr ? 'Saison PvP' : 'PvP season'}>
  <h2>{fr ? 'Saison PvP' : 'PvP season'} · {season}</h2>
  <p>
    {fr
      ? 'Classement partagé de cette instance. Les matchs terminés entre deux profils inscrits comptent une seule fois. Chaque mois UTC ouvre une saison à 1 200 points.'
      : 'Shared standings for this instance. Finished matches between two registered profiles count once. Each UTC month starts a season at 1,200 points.'}
  </p>
  <p>
    {fr
      ? 'Le serveur conserve ce classement jusqu’à son redémarrage. Ton historique local reste dans ce navigateur.'
      : 'The server keeps these standings until restart. Your local history stays in this browser.'}
  </p>
  {#if credential}<p>{fr ? 'Profil inscrit' : 'Registered profile'} : {credential.name}</p>{/if}
  <form
    onsubmit={(event) => {
      event.preventDefault()
      void register()
    }}
  >
    <label
      >{fr ? 'Pseudo de saison' : 'Season name'}<input
        bind:value={name}
        maxlength="24"
        required
      /></label
    >
    <button type="submit" disabled={busy}
      >{credential
        ? fr
          ? 'Créer une nouvelle identité de saison'
          : 'Create a new season identity'
        : fr
          ? 'Inscrire mon profil PvP'
          : 'Register my PvP profile'}</button
    >
  </form>
  <button type="button" onclick={refresh}
    >{fr ? 'Actualiser le classement' : 'Refresh standings'}</button
  >
  {#if error}<p role="alert">{error}</p>{/if}
  <div class="table-wrap">
    <table>
      <thead
        ><tr><th>#</th><th>{fr ? 'Joueur' : 'Player'}</th><th>Points</th><th>V / D</th></tr></thead
      ><tbody
        >{#each entries as entry, index (entry.id)}<tr
            ><td>{index + 1}</td><td>{entry.name}</td><td>{entry.rating}</td><td
              >{entry.wins} / {entry.losses}</td
            ></tr
          >{/each}</tbody
      >
    </table>
  </div>
</section>

<style>
  .season-panel {
    margin: 1rem 0;
    padding: 1rem;
    border: 1px solid #63798a;
    background: #102130;
  }
  form {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 0.7rem;
  }
  label {
    display: grid;
    gap: 0.5rem;
    min-width: 0;
  }
  input,
  button {
    min-height: 44px;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0.5rem;
    border: 1px solid #91a6b6;
    color: white;
    background: #203a4e;
  }
  button {
    margin: 0.6rem 0;
  }
  .table-wrap {
    overflow-x: auto;
  }
  table {
    width: 100%;
    text-align: left;
    border-collapse: collapse;
  }
  th,
  td {
    padding: 0.6rem 0.3rem;
    border-bottom: 1px solid #576c7c;
  }
  p {
    line-height: 1.6;
  }
  :focus-visible {
    outline: 2px solid #f5d25c;
    outline-offset: 2px;
  }
</style>
