<script lang="ts">
  import type { ResponseDiagnostics } from '$lib/fighting/fightResponseDiagnostics'
  import { responseOutcomeText, responseReasonText } from '$lib/fighting/fightResponseText'
  import { trainingInputLabel } from '$lib/fighting/trainingLabels'
  export let diagnostics: ResponseDiagnostics
  export let language: 'fr' | 'en'
  let side: 'player' | 'opponent' = 'player'
  $: rows = $diagnostics
    .filter((entry) => entry.side === side)
    .slice(-20)
    .reverse()
  $: waits = rows
    .flatMap((entry) => (entry.queueMs === undefined ? [] : [entry.queueMs]))
    .sort((a, b) => a - b)
  $: p95 = waits.length ? waits[Math.ceil(waits.length * 0.95) - 1].toFixed(1) : '—'
</script>

<details class="response-diagnostics" data-fight-scroll>
  <summary>{language === 'fr' ? 'Diagnostic de réactivité' : 'Response diagnostics'}</summary>
  <div class="response-toolbar">
    <label
      >{language === 'fr' ? 'Commandes' : 'Commands'}
      <select bind:value={side}
        ><option value="player">P1</option><option value="opponent">P2</option></select
      >
    </label>
    <span>{language === 'fr' ? 'Attente en file · p95' : 'Queue wait · p95'} : {p95} ms</span>
    <button
      type="button"
      onclick={(event) => {
        diagnostics.reset()
        event.currentTarget.blur()
      }}>{language === 'fr' ? 'Vider l’historique' : 'Clear history'}</button
    >
  </div>
  <p class="explanation">
    {language === 'fr'
      ? 'Mesure depuis la réception par le jeu. Les ticks incluent le hitstop ; la pause ne fait pas avancer le moteur. La latence de la manette, du système et de l’écran n’est pas mesurée.'
      : 'Measured after the game receives the command. Ticks include hitstop; pausing does not advance the engine. Controller, system and display latency are not measured.'}
  </p>
  <ol>
    {#each rows as entry (entry.id)}
      <li class:refused={entry.outcome === 'refused' || entry.outcome === 'expired'}>
        <div class="receipt">
          <strong>{trainingInputLabel(entry.action, language)}</strong><span
            >{responseOutcomeText(entry.outcome, language)}</span
          >
        </div>
        <div>
          M{entry.round} · F{entry.receivedFrame}
          {#if entry.executedFrame !== undefined}
            → F{entry.executedFrame} · {entry.executedFrame - entry.receivedFrame}
            {language === 'fr' ? 'ticks' : 'ticks'}{/if}
          {#if entry.queueMs !== undefined}
            · {language === 'fr' ? 'file' : 'queue'} {entry.queueMs.toFixed(1)} ms{/if}
        </div>
        {#if entry.reason}<p>{responseReasonText(entry, language)}</p>{/if}
      </li>
    {:else}<li>
        {language === 'fr'
          ? 'Effectue une attaque pour observer son traitement.'
          : 'Perform an attack to observe how it is handled.'}
      </li>{/each}
  </ol>
</details>

<style>
  .response-diagnostics {
    color: #e1eaf0;
    background: #101c29;
    padding: 0.7rem 1rem;
    border: 1px solid #50637a;
    border-radius: 0.6rem;
    margin: 0.6rem 0;
    font: 0.8rem/1.5 var(--font-mono, monospace);
  }
  summary {
    color: #f4d27b;
    cursor: pointer;
    font-weight: 700;
  }
  .response-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1rem;
    align-items: center;
    margin-top: 0.7rem;
  }
  label {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }
  select,
  button {
    color: #fff;
    background: #24364e;
    border: 1px solid #7589a5;
    border-radius: 0.3rem;
    padding: 0.4rem 0.6rem;
    font: inherit;
  }
  button {
    cursor: pointer;
  }
  .explanation {
    color: #b6c4d5;
    max-width: 70rem;
  }
  ol {
    margin: 0.5rem 0 0;
    padding: 0;
    list-style: none;
    max-height: 21rem;
    overflow: auto;
  }
  li {
    border-top: 1px solid #40536b;
    padding: 0.5rem 0;
    overflow-wrap: anywhere;
  }
  .receipt {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.3rem 1rem;
  }
  .refused .receipt {
    color: #ffb1a2;
  }
  li p {
    margin: 0.3rem 0 0;
    color: #c2cfe0;
  }
</style>
