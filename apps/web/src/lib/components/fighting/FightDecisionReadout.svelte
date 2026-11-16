<script lang="ts">
  import { visibleCommandFeedback } from '$lib/fighting/commandFeedback'
  import { commandFeedbackText } from '$lib/fighting/commandFeedbackText'
  import { fightCommitments } from '$lib/fighting/fightCommitments'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  let side: FightSide = 'player'
  $: if (state.mode === 'versus-ai') side = 'player'
  $: feedback = visibleCommandFeedback(state, side)
  $: rows = fightCommitments(state, side)
  $: index = language === 'fr' ? 0 : 1
</script>

<div class="decision-readout" data-fight-scroll>
  {#if feedback && feedback.outcome !== 'started'}
    <p role="status" aria-live="polite">
      {side === 'player' ? 'P1' : 'P2'} · {commandFeedbackText(feedback, language)}
    </p>
  {/if}
  <details>
    <summary
      >{language === 'fr' ? 'Mes commandes et engagements' : 'My commands and commitments'}</summary
    >
    {#if state.mode !== 'versus-ai'}
      <label
        >{language === 'fr' ? 'Commandes du joueur' : 'Player commands'}
        <select bind:value={side}
          ><option value="player">P1</option><option value="opponent">P2</option></select
        >
      </label>
    {/if}
    {#if feedback && feedback.outcome === 'started'}<p>
        {commandFeedbackText(feedback, language)}
      </p>{/if}
    {#if rows.length}<ul>
        {#each rows as row (row.label[0])}<li>
            {row.label[index]}{#if row.frames !== undefined}
              · {row.frames}f{#if row.frames > 0}
                ({(row.frames / 60).toFixed(2)}s){/if}{:else if row.count !== undefined}
              · {row.count}{/if}
          </li>{/each}
      </ul>
    {:else}<p>{language === 'fr' ? 'Aucun engagement suivi.' : 'No tracked commitment.'}</p>{/if}
    <small
      >{language === 'fr'
        ? 'Frames de simulation à 60 Hz ; elles restent figées en pause et pendant le hitstop.'
        : 'Simulation frames at 60 Hz; paused and frozen during hitstop.'}</small
    >
  </details>
</div>

<style>
  .decision-readout {
    padding: 0.5rem 0.8rem;
    color: #dce5ea;
    background: #0a141c;
    border-top: 1px solid #405562;
    font: 0.8rem/1.5 var(--font-mono);
  }
  p {
    margin: 0.4rem 0;
  }
  [role='status'] {
    border-left: 2px solid #f5d25c;
    padding-left: 0.6rem;
  }
  summary {
    cursor: pointer;
    color: #f5d25c;
    min-height: 32px;
  }
  label {
    display: flex;
    gap: 0.6rem;
    align-items: center;
  }
  select {
    min-height: 44px;
    background: #172732;
    color: white;
  }
  small {
    color: #acbfcc;
  }
  ul {
    padding-left: 1.2rem;
  }
</style>
