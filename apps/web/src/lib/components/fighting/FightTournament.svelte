<script lang="ts">
  import { onMount } from 'svelte'
  import {
    createTournament,
    readTournament,
    tournamentWinner,
    type ClashTournament,
  } from '$lib/fighting/career/tournament'
  export let language: 'fr' | 'en'
  let tournament: ClashTournament | null = null,
    draft = 'Hunter 1\nHunter 2\nHunter 3\nHunter 4',
    title = 'Clash Cup',
    error = ''
  $: fr = language === 'fr'
  const key = 'black-whale:clash:tournament:1'
  function save(next: ClashTournament) {
    tournament = next
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      /* session still works */
    }
  }
  function create() {
    try {
      save(
        createTournament(
          draft.split('\n').filter((line) => line.trim()),
          title,
        ),
      )
      error = ''
    } catch {
      error = fr
        ? 'Saisis de 2 à 16 noms distincts, de 24 caractères maximum.'
        : 'Enter 2–16 distinct names, up to 24 characters each.'
    }
  }
  function winner(id: string, name: string) {
    if (tournament) save(tournamentWinner(tournament, id, name))
  }
  const name = (id: string | null) =>
    tournament?.players.find((player) => player.id === id)?.name ?? '—'
  onMount(() => {
    try {
      tournament = readTournament(localStorage.getItem(key) ?? '')
    } catch {
      /* optional */
    }
  })
</script>

<section class="tournament-panel">
  <h2>{fr ? 'Organiser un tournoi' : 'Organize a tournament'}</h2>
  <p>
    {fr
      ? 'Tableau local à élimination directe. L’organisateur saisit les vainqueurs ; ces résultats manuels ne modifient pas le classement PvP.'
      : 'Local single-elimination bracket. The organizer enters winners; these manual results do not change PvP standings.'}
  </p>
  <details open={!tournament}>
    <summary>{fr ? 'Préparer ou remplacer le tableau' : 'Prepare or replace the bracket'}</summary>
    <label
      >{fr ? 'Nom du tournoi' : 'Tournament name'}<input bind:value={title} maxlength="40" /></label
    >
    <label
      >{fr ? 'Participants · un nom par ligne' : 'Participants · one name per line'}<textarea
        bind:value={draft}
        rows="6"
        maxlength="400"></textarea></label
    >
    <button type="button" onclick={create}>{fr ? 'Créer le tableau' : 'Create bracket'}</button>
  </details>
  {#if error}<p role="alert">{error}</p>{/if}
  {#if tournament}<h3>{tournament.name}</h3>
    {#if tournament.champion}<p role="status">
        {fr ? 'Champion' : 'Champion'} : {name(tournament.champion)}
      </p>{/if}
    <div class="bracket">
      {#each tournament.bouts as bout (bout.id)}<article>
          <strong>{fr ? 'Tour' : 'Round'} {bout.round + 1} · {bout.index + 1}</strong>
          <p>{name(bout.seats[0])} / {name(bout.seats[1])}</p>
          {#if bout.winner}<b
              >{name(bout.winner)}{bout.automatic ? (fr ? ' · exempté' : ' · bye') : ''}</b
            >
          {:else if bout.seats[0] && bout.seats[1]}{#each bout.seats as id (id)}<button
                type="button"
                onclick={() => winner(bout.id, id!)}>{name(id)} · {fr ? 'gagne' : 'wins'}</button
              >{/each}{/if}
        </article>{/each}
    </div>
  {/if}
</section>

<style>
  .tournament-panel {
    padding: 1rem;
    border: 1px solid #63798a;
    background: #102130;
    margin: 1rem 0;
  }
  label {
    display: grid;
    gap: 0.4rem;
    margin: 0.7rem 0;
  }
  input,
  textarea,
  button {
    box-sizing: border-box;
    min-width: 0;
    max-width: 100%;
    padding: 0.6rem;
    min-height: 44px;
    color: white;
    background: #203a4e;
    border: 1px solid #91a6b6;
  }
  .bracket {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr));
    gap: 0.8rem;
  }
  article {
    border: 1px solid #5a7183;
    padding: 0.8rem;
  }
  button {
    margin: 0.4rem 0.4rem 0 0;
  }
  p {
    line-height: 1.6;
  }
  summary {
    min-height: 44px;
    cursor: pointer;
  }
  :focus-visible {
    outline: 2px solid #f5d25c;
    outline-offset: 2px;
  }
</style>
