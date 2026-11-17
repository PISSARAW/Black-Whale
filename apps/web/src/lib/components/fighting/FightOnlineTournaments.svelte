<script lang="ts">
  import { onMount } from 'svelte'
  import type { OnlineView } from '$lib/fighting/online/types'
  import type { OnlineCommand } from '$lib/fighting/online/protocol'
  import type { FighterId } from '$lib/fighting/types'
  import FightOnlineBracket from './FightOnlineBracket.svelte'
  export let view: OnlineView
  export let language: 'fr' | 'en'
  export let fighter: FighterId
  export let base: string
  export let execute: (command: OnlineCommand) => Promise<unknown>
  let name = 'Clash Cup',
    id = '',
    secret = '',
    invitation = ''
  $: fr = language === 'fr'
  async function create() {
    const result = (await execute({ kind: 'tournament-create', name, fighter })) as
      { id: string; invitation: string } | undefined
    if (result) invitation = `${location.origin}${base}#${result.id}:${result.invitation}`
  }
  function join() {
    return execute({ kind: 'tournament-join', id, secret, fighter })
  }
  onMount(() => {
    const parts = location.hash.slice(1).split(':')
    if (parts.length === 2 && parts.every((part) => part.length > 0 && part.length <= 100)) {
      ;[id, secret] = parts
      history.replaceState(null, '', location.pathname + location.search)
    }
  })
</script>

<details class="online-tournaments">
  <summary>{fr ? 'Tournois en ligne' : 'Online tournaments'}</summary>
  <p>
    {fr
      ? 'Les participants rejoignent volontairement le tableau public. Les résultats proviennent des matchs serveur, avec les forfaits indiqués séparément.'
      : 'Participants join the public bracket voluntarily. Results come from server matches, with forfeits labelled separately.'}
  </p>
  <form
    onsubmit={(event) => {
      event.preventDefault()
      void create()
    }}
  >
    <label
      >{fr ? 'Nom du tournoi' : 'Tournament name'}<input
        bind:value={name}
        required
        maxlength="40"
      /></label
    ><button>{fr ? 'Créer un tournoi' : 'Create tournament'}</button>
  </form>
  {#if invitation}<p>
      {fr ? 'Invitation à partager' : 'Invitation to share'} :
      <input
        readonly
        value={invitation}
        aria-label={fr ? 'Invitation du tournoi' : 'Tournament invitation'}
      />
    </p>{/if}
  <form
    onsubmit={(event) => {
      event.preventDefault()
      void join()
    }}
  >
    <label
      >{fr ? 'Identifiant du tournoi' : 'Tournament ID'}<input
        bind:value={id}
        required
        maxlength="100"
      /></label
    >
    <label
      >{fr ? 'Code d’invitation' : 'Invitation code'}<input
        bind:value={secret}
        type="password"
        required
        maxlength="100"
      /></label
    >
    <button>{fr ? 'Rejoindre le tournoi' : 'Join tournament'}</button>
  </form>
  {#each view.tournaments as tournament (tournament.id)}
    <FightOnlineBracket {tournament} {language} />
    <a href={`${base}/tournament/${encodeURIComponent(tournament.id)}`}
      >{fr ? 'Tableau public pour la diffusion' : 'Public broadcast bracket'}</a
    >
    {#if !tournament.bracket && tournament.owner === view.profile.id}
      <button
        type="button"
        onclick={() => execute({ kind: 'tournament-start', id: tournament.id })}
        disabled={tournament.players.length < 2}
        >{fr ? 'Démarrer le tableau' : 'Start bracket'}</button
      >
      <button
        type="button"
        onclick={() => execute({ kind: 'tournament-cancel', id: tournament.id })}
        >{fr ? 'Annuler les inscriptions' : 'Cancel registration'}</button
      >
    {:else if tournament.bracket && !tournament.bracket.champion}
      <button type="button" onclick={() => execute({ kind: 'tournament-play', id: tournament.id })}
        >{fr ? 'Préparer ma rencontre' : 'Prepare my encounter'}</button
      >
    {/if}
  {/each}
</details>

<style>
  details {
    min-width: 0;
    margin: 1rem 0;
    border: 1px solid #526c7b;
    padding: 0.8rem;
  }
  summary {
    cursor: pointer;
    font-weight: bold;
  }
  form {
    display: flex;
    align-items: end;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin: 1rem 0;
  }
  label {
    display: grid;
    gap: 0.4rem;
    min-width: 0;
  }
  input,
  button {
    max-width: 100%;
    box-sizing: border-box;
    min-height: 44px;
    font: inherit;
    padding: 0.5rem;
    background: #162e40;
    color: #eef5fa;
    border: 1px solid #829dab;
  }
  button {
    cursor: pointer;
    margin: 0.4rem 0;
  }
  a {
    display: block;
    color: #b7d9f2;
    overflow-wrap: anywhere;
  }
  p {
    line-height: 1.5;
  }
</style>
