<script lang="ts">
  import { onMount } from 'svelte'
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import type { FighterId } from '$lib/fighting/types'
  import type { RankingCredential } from '$lib/fighting/career/ranking'
  import type { OnlineView, OnlineQueue } from '$lib/fighting/online/types'
  import type { OnlineCommand } from '$lib/fighting/online/protocol'
  import type { PvpSession } from '$lib/fighting/pvp/types'
  import { onlineRequest, onlineError } from '$lib/fighting/online/client'
  import FightOnlineIdentity from './FightOnlineIdentity.svelte'
  import FightOnlineTournaments from './FightOnlineTournaments.svelte'
  export let endpoint: string
  export let profileEndpoint: string
  export let base: string
  export let language: 'fr' | 'en'
  export let onPlay: (session: PvpSession) => void
  let credential: RankingCredential | null = null,
    view: OnlineView | null = null
  let fighter: FighterId = 'kurapika',
    queue: OnlineQueue = 'casual',
    maxRtt = 300
  let error = '',
    busy = false,
    polling = false,
    mounted = false,
    lastProbe = 0,
    reported = ''
  let reason: 'conduct' | 'connection' | 'suspected-cheating' = 'conduct'
  let revision = 0
  $: fr = language === 'fr'
  $: active = view?.series?.status === 'active'
  const fighterName = (id: FighterId) => FIGHTING_ROSTER.find((f) => f.id === id)?.name ?? id
  function setCredential(value: RankingCredential) {
    revision++
    credential = value
    view = null
    void refresh()
  }
  function isCurrent(token: string, stamp: number) {
    return mounted && credential?.token === token && revision === stamp
  }
  async function refresh() {
    if (!credential || busy || polling) return
    polling = true
    const token = credential.token
    const stamp = revision
    try {
      let value = await onlineRequest<OnlineView>({ endpoint, token })
      if (value.ticket && Date.now() - lastProbe > 20000) {
        const { nonce } = await onlineRequest<{ nonce: string }>({
          endpoint,
          token,
          command: { kind: 'probe' },
        })
        value = await onlineRequest<OnlineView>({
          endpoint,
          token,
          command: { kind: 'refresh', nonce },
        })
        lastProbe = Date.now()
      }
      if (isCurrent(token, stamp)) {
        view = value
        error = ''
      }
    } catch (failure) {
      if (isCurrent(token, stamp)) error = onlineError(failure, language)
    } finally {
      polling = false
    }
  }
  async function execute(command: OnlineCommand): Promise<unknown> {
    if (!credential || busy) return
    busy = true
    error = ''
    const token = credential.token,
      stamp = ++revision
    try {
      const result = await onlineRequest<unknown>({ endpoint, token, command })
      if (!isCurrent(token, stamp)) return undefined
      if (result && typeof result === 'object' && 'profile' in result) view = result as OnlineView
      else if (command.kind === 'report') reported = command.series
      return result
    } catch (failure) {
      if (isCurrent(token, stamp)) error = onlineError(failure, language)
      return undefined
    } finally {
      busy = false
      void refresh()
    }
  }
  async function search() {
    if (!credential || busy) return
    busy = true
    error = ''
    const token = credential.token,
      stamp = ++revision
    try {
      const { nonce } = await onlineRequest<{ nonce: string }>({
        endpoint,
        token,
        command: { kind: 'probe' },
      })
      const result = await onlineRequest<OnlineView>({
        endpoint,
        token,
        command: { kind: 'queue', nonce, fighter, queue, maxRtt },
      })
      if (isCurrent(token, stamp)) view = result
      lastProbe = Date.now()
    } catch (failure) {
      if (isCurrent(token, stamp)) error = onlineError(failure, language)
    } finally {
      busy = false
    }
  }
  onMount(() => {
    mounted = true
    void refresh()
    const timer = setInterval(() => void refresh(), 3000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  })
</script>

<div class="online-service">
  <FightOnlineIdentity {endpoint} {profileEndpoint} {language} onCredential={setCredential} />
  {#if credential}
    <p>
      {fr
        ? 'Deux matchs gagnés remportent la série. Chaque match garde ses manches ordinaires. Aucun bonus de progression ne change les pouvoirs.'
        : 'Win two matches to take the series. Each match keeps its normal rounds. Progression bonuses never change powers.'}
    </p>
    {#if !active && !view?.ticket}<form
        onsubmit={(event) => {
          event.preventDefault()
          void search()
        }}
      >
        <label
          >{fr ? 'Personnage' : 'Fighter'}<select
            aria-label={fr ? 'Personnage' : 'Fighter'}
            bind:value={fighter}
            >{#each FIGHTING_ROSTER as entry (entry.id)}<option value={entry.id}
                >{entry.name}</option
              >{/each}</select
          ></label
        >
        <label
          >{fr ? 'File' : 'Queue'}<select aria-label={fr ? 'File' : 'Queue'} bind:value={queue}
            ><option value="casual">{fr ? 'Non classé' : 'Casual'}</option><option value="ranked"
              >{fr ? 'Classé' : 'Ranked'}</option
            ></select
          ></label
        >
        <label
          >{fr ? 'Tolérance de connexion estimée' : 'Estimated connection tolerance'}<select
            bind:value={maxRtt}
            >{#each [100, 200, 300, 500] as rtt (rtt)}<option value={rtt}>{rtt} ms</option
              >{/each}</select
          ></label
        >
        <button disabled={busy || !view}
          >{fr ? 'Chercher un adversaire' : 'Find an opponent'}</button
        >
      </form>{/if}
    <p class="hint">
      {fr
        ? 'Terrain commun : Tour Céleste sans interactions. La recherche utilise une mesure aller-retour avec ce serveur et une tolérance commune ; elle ne garantit pas la latence entre deux machines. Les préparations et conditions du Nen restent celles du duel ordinaire.'
        : 'Shared stage: Heavens Arena without interactions. Search uses a server round-trip measurement and a shared tolerance; it does not guarantee latency between two machines. Nen preparations and conditions remain those of an ordinary duel.'}
    </p>
    {#if view?.ticket}<section aria-label={fr ? 'Recherche en cours' : 'Searching'}>
        <p role="status">
          {fr ? 'Recherche en cours' : 'Searching'} · {view.ticket.queue === 'ranked'
            ? fr
              ? 'Classé'
              : 'Ranked'
            : fr
              ? 'Non classé'
              : 'Casual'} · {view.ticket.rtt} ms
        </p>
        <button type="button" disabled={busy} onclick={() => execute({ kind: 'cancel' })}
          >{fr ? 'Annuler la recherche' : 'Cancel search'}</button
        >
      </section>{/if}
    {#if view?.series}
      {@const series = view.series}
      <section aria-label={fr ? 'Série en ligne' : 'Online series'}>
        <h2>{series.players[0].name} / {series.players[1].name}</h2>
        <p class="score">{series.score[0]} : {series.score[1]}</p>
        <p>{fighterName(series.players[0].fighter)} / {fighterName(series.players[1].fighter)}</p>
        {#if series.status === 'complete'}<p role="status">
            {fr ? 'Série terminée' : 'Series complete'} · {series.players.find(
              (p) => p.id === series.winner,
            )?.name}{series.games.at(-1)?.reason === 'forfeit'
              ? fr
                ? ' · forfait'
                : ' · forfeit'
              : ''}
          </p>
          {#if series.queue === 'ranked'}<p>
              {series.counted
                ? fr
                  ? 'Résultat classé enregistré.'
                  : 'Ranked result recorded.'
                : fr
                  ? 'Enregistrement du classement en attente.'
                  : 'Ranking write pending.'}
            </p>{/if}
        {:else if series.status === 'withdrawn'}<p>
            {fr ? 'Série interrompue sans vainqueur.' : 'Series interrupted without a winner.'}
          </p>
        {:else}
          {#if series.games.at(-1)?.reason === 'restart'}<p>
              {fr
                ? 'Match interrompu par le serveur. Le score validé de la série est conservé.'
                : 'Match interrupted by the server. The verified series score is retained.'}
            </p>{/if}
          {#if view.session}<button
              type="button"
              onclick={() => view?.session && onPlay(view.session)}
              >{fr ? 'Jouer le match' : 'Play match'}</button
            >{:else}<button
              type="button"
              disabled={busy}
              onclick={() => execute({ kind: 'continue' })}
              >{fr ? 'Préparer le match suivant' : 'Prepare next match'}</button
            >{/if}
          <button type="button" disabled={busy} onclick={() => execute({ kind: 'withdraw' })}
            >{fr ? 'Abandonner la série' : 'Forfeit series'}</button
          >
        {/if}
        <details>
          <summary>{fr ? 'Signaler un problème' : 'Report a problem'}</summary>
          <label
            >{fr ? 'Motif' : 'Reason'}<select
              aria-label={fr ? 'Motif' : 'Reason'}
              bind:value={reason}
              ><option value="conduct">{fr ? 'Comportement' : 'Conduct'}</option><option
                value="connection">{fr ? 'Connexion' : 'Connection'}</option
              ><option value="suspected-cheating"
                >{fr ? 'Suspicion de triche' : 'Suspected cheating'}</option
              ></select
            ></label
          >
          <button
            type="button"
            disabled={busy || reported === series.id}
            onclick={() => execute({ kind: 'report', series: series.id, reason })}
            >{fr ? 'Enregistrer le signalement' : 'Record report'}</button
          >
          {#if reported === series.id}<p role="status">
              {fr
                ? 'Signalement enregistré. Il ne change pas le résultat.'
                : 'Report recorded. It does not change the result.'}
            </p>{/if}
        </details>
      </section>
    {/if}
    {#if view}
      <details>
        <summary
          >{fr ? 'Historique serveur et statistiques' : 'Server history and statistics'}</summary
        >
        <p>
          {fr
            ? 'Les 100 dernières séries de cette identité. Les statistiques comptent les matchs réellement terminés ; les forfaits sont séparés.'
            : 'The latest 100 series for this identity. Statistics count actual completed matches; forfeits are separate.'}
        </p>
        <div class="table">
          <table>
            <thead
              ><tr
                ><th>{fr ? 'Personnage' : 'Fighter'}</th><th>{fr ? 'Matchs' : 'Matches'}</th><th
                  >V / D</th
                ><th>{fr ? 'Forfaits' : 'Forfeits'}</th></tr
              ></thead
            ><tbody
              >{#each view.statistics as row (row.fighter)}<tr
                  ><td>{fighterName(row.fighter)}</td><td>{row.games}</td><td
                    >{row.wins} / {row.losses}</td
                  ><td>{row.forfeits}</td></tr
                >{/each}</tbody
            >
          </table>
        </div>
        <ul>
          {#each view.history as entry (entry.id)}<li>
              {entry.players.map((p) => p.name).join(' / ')} · {entry.score.join(' : ')} · {entry.queue ===
              'ranked'
                ? fr
                  ? 'Classé'
                  : 'Ranked'
                : fr
                  ? 'Non classé'
                  : 'Casual'} · {entry.games.at(-1)?.reason === 'forfeit'
                ? fr
                  ? 'Forfait'
                  : 'Forfeit'
                : entry.status === 'complete'
                  ? fr
                    ? 'Terminé'
                    : 'Complete'
                  : fr
                    ? 'En cours ou interrompu'
                    : 'Active or interrupted'}
            </li>{/each}
        </ul>
      </details>
      <FightOnlineTournaments {view} {language} {fighter} {base} {execute} />
    {/if}
  {/if}
  {#if error}<p role="alert">{error}</p>{/if}
</div>

<style>
  .online-service {
    min-width: 0;
  }
  section,
  details {
    border: 1px solid #526c7b;
    padding: 0.8rem;
    margin: 1rem 0;
    min-width: 0;
  }
  form {
    display: flex;
    gap: 0.7rem;
    flex-wrap: wrap;
    align-items: end;
  }
  label {
    display: grid;
    gap: 0.4rem;
    min-width: 0;
  }
  select,
  button {
    font: inherit;
    max-width: 100%;
    min-height: 44px;
    box-sizing: border-box;
    background: #162e40;
    color: #eef5fa;
    border: 1px solid #829dab;
    padding: 0.5rem;
  }
  button {
    cursor: pointer;
    margin: 0.4rem 0.4rem 0.4rem 0;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  p,
  li {
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .score {
    font-size: 2rem;
    font-weight: bold;
  }
  .hint {
    color: #bbcdd7;
  }
  summary {
    cursor: pointer;
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
  ul {
    padding-left: 1.2rem;
  }
  :focus-visible {
    outline: 2px solid #f5d25c;
    outline-offset: 2px;
  }
</style>
