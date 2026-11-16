<script lang="ts">
  import type { PvpClient } from '$lib/fighting/pvp/client'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { PvpStatus } from '$lib/fighting/pvp/types'
  export let client: PvpClient
  export let language: 'fr' | 'en'
  export let invite = ''
  export let watchInvite = ''
  const labels: Record<PvpStatus, [string, string]> = {
    waiting: ['En attente du second joueur', 'Waiting for the second player'],
    ready: ['Confirmer le duel ou la manche suivante', 'Confirm the duel or next round'],
    playing: ['Combat en cours', 'Fight in progress'],
    interrupted: [
      'Duel suspendu · reconnexion possible pendant 30 secondes',
      'Duel suspended · reconnect within 30 seconds',
    ],
    finished: ['Match terminé · verdict du serveur', 'Match finished · server verdict'],
    abandoned: [
      'Duel interrompu définitivement · aucun K.-O. attribué',
      'Duel ended by disconnection · no KO awarded',
    ],
  }
  $: view = $client.view
  $: index = language === 'fr' ? 0 : 1
  $: winner = $client.state?.matchWinner ?? $client.state?.winner
  const connections = {
    connecting: ['Connexion', 'Connecting'],
    connected: ['Connecté', 'Connected'],
    reconnecting: ['Reconnexion', 'Reconnecting'],
    diverged: ['Resynchronisation', 'Resynchronizing'],
    error: ['Connexion impossible', 'Connection failed'],
    version: ['Version incompatible', 'Incompatible version'],
  }
</script>

<section
  class="network-status"
  aria-label={language === 'fr' ? 'Connexion au duel' : 'Duel connection'}
>
  <p role="status" aria-live="polite">
    {view ? labels[view.status][index] : language === 'fr' ? 'Connexion…' : 'Connecting…'}
    · {connections[$client.connection][index]}
    {#if $client.ping !== null}· {$client.ping} ms{/if}
  </p>
  {#if view}
    <p>
      {fighterDefinition(view.setup.player).name} — {fighterDefinition(view.setup.opponent).name} · {view
        .setup.environment.stageId} · {view.setup.formatId}
    </p>
    <p>
      {language === 'fr' ? 'Ta place' : 'Your seat'} : {view.side === 'player' ? 'P1' : 'P2'} · {language ===
      'fr'
        ? 'Commandes P1 sur cet écran'
        : 'P1 controls on this screen'}
    </p>
    <small>{view.ruleset} · {view.configHash} · tick {view.tick} · {view.authorityHash}</small>
    {#if ['waiting', 'ready'].includes(view.status)}
      <button
        type="button"
        onclick={() => client.ready()}
        disabled={view.ready[view.side] || $client.connection !== 'connected'}
      >
        {view.ready[view.side]
          ? language === 'fr'
            ? 'Confirmation envoyée'
            : 'Confirmed'
          : language === 'fr'
            ? 'Confirmer cette configuration'
            : 'Confirm this setup'}
      </button>
    {/if}
    {#if winner && ['ready', 'finished'].includes(view.status)}<p>
        {winner === 'draw'
          ? language === 'fr'
            ? 'Égalité'
            : 'Draw'
          : fighterDefinition($client.state![winner].id).name}
        · {$client.state?.roundsWon.player} — {$client.state?.roundsWon.opponent}
      </p>{/if}
    {#if !['finished', 'abandoned'].includes(view.status)}<button
        type="button"
        onclick={() => client.leave()}
        >{language === 'fr' ? 'Quitter le duel' : 'Leave duel'}</button
      >{/if}
  {/if}
  {#if invite}<label
      >{language === 'fr' ? 'Invitation à transmettre' : 'Invite to share'}<input
        readonly
        value={invite}
        onfocus={(event) => event.currentTarget.select()}
      /></label
    >{/if}
  {#if watchInvite}<label
      >{language === 'fr' ? 'Invitation spectateur' : 'Spectator invite'}<input
        readonly
        value={watchInvite}
        onfocus={(event) => event.currentTarget.select()}
      /></label
    >{/if}
  {#if $client.error}<p role="alert">
      {$client.connection === 'diverged'
        ? language === 'fr'
          ? 'État reçu incohérent. Commandes suspendues ; resynchronisation…'
          : 'State mismatch. Inputs suspended; resynchronizing…'
        : $client.error === 'INVITATION'
          ? language === 'fr'
            ? 'Invitation de joueur invalide ou expirée.'
            : 'Player invitation is invalid or expired.'
          : $client.error}
    </p>{/if}
  {#if view?.ranking === 'pending'}<p role="status">
      {language === 'fr'
        ? 'Verdict conservé dans ce salon. Écriture du classement en attente ; recharge le salon pour réessayer.'
        : 'Verdict kept in this lobby. Ranking storage pending; reload the lobby to retry.'}
    </p>{/if}
</section>

<style>
  .network-status {
    border: 1px solid #596e7c;
    padding: 1rem;
    margin-bottom: 1rem;
    background: #0c1923;
    overflow-wrap: anywhere;
  }
  p {
    margin: 0.5rem 0;
  }
  small {
    display: block;
    color: #b7c9d6;
  }
  label {
    display: grid;
    gap: 0.4rem;
    margin-top: 0.8rem;
  }
  input {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 0.6rem;
    background: #102534;
    color: white;
    border: 1px solid #697e8c;
  }
  button {
    min-height: 44px;
    margin: 0.7rem 0.5rem 0 0;
    padding: 0.5rem 0.8rem;
    border: 1px solid #899caa;
    background: #233e50;
    color: white;
  }
  button:disabled {
    opacity: 0.5;
  }
  button:focus-visible,
  input:focus-visible {
    outline: 2px solid #f5d25c;
    outline-offset: 2px;
  }
</style>
