<script lang="ts">
  import type { OnlineTournament, OnlineSeries } from '$lib/fighting/online/types'
  export let tournament: Omit<OnlineTournament, 'joinHash'>
  export let results: Pick<
    OnlineSeries,
    'id' | 'tournament' | 'score' | 'status' | 'winner' | 'games'
  >[] = []
  export let language: 'fr' | 'en'
  $: fr = language === 'fr'
  const name = (id: string | null) => tournament.players.find((p) => p.id === id)?.name ?? '—'
</script>

<section class="online-bracket" aria-label={fr ? 'Tableau vérifié' : 'Verified bracket'}>
  <h3>{tournament.name}</h3>
  <p>
    {tournament.players.length}/16 · {fr
      ? 'Séries au premier à deux matchs gagnés'
      : 'First-to-two match series'}
  </p>
  {#if tournament.bracket}
    {#if tournament.bracket.champion}<p>
        <strong>{fr ? 'Vainqueur' : 'Winner'} : {name(tournament.bracket.champion)}</strong>
      </p>{/if}
    <div class="table">
      <table>
        <thead
          ><tr
            ><th>{fr ? 'Tour' : 'Round'}</th><th>{fr ? 'Rencontre' : 'Encounter'}</th><th
              >{fr ? 'Résultat' : 'Result'}</th
            ></tr
          ></thead
        ><tbody>
          {#each tournament.bracket.bouts as bout (bout.id)}
            {@const result = results.find(
              (s) => s.tournament?.bout === bout.id && s.status === 'complete',
            )}
            <tr
              ><td>{bout.round + 1}</td><td>{name(bout.seats[0])} / {name(bout.seats[1])}</td><td
                >{bout.winner ? name(bout.winner) : '—'}
                {#if bout.automatic}<small>{fr ? 'Exemption' : 'Bye'}</small>{:else if result}<small
                    >{result.score.join(' : ')}{result.games.at(-1)?.reason === 'forfeit'
                      ? fr
                        ? ' · forfait'
                        : ' · forfeit'
                      : ''}</small
                  >{/if}
              </td></tr
            >
          {/each}
        </tbody>
      </table>
    </div>
  {:else}<p>
      {fr
        ? 'Inscriptions ouvertes. Le propriétaire peut démarrer à partir de deux participants.'
        : 'Registration open. The owner can start with at least two participants.'}
    </p>{/if}
</section>

<style>
  section {
    min-width: 0;
    border: 1px solid #526c7b;
    padding: 0.8rem;
    margin: 1rem 0;
  }
  p {
    line-height: 1.5;
  }
  .table {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }
  th,
  td {
    padding: 0.5rem 0.3rem;
    border-bottom: 1px solid #526c7b;
    overflow-wrap: anywhere;
  }
  small {
    display: block;
  }
</style>
