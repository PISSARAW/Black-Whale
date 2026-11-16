<script lang="ts">
  import { ownsPredator } from '$lib/fighting/predator'
  import { predatorStatus } from '$lib/fighting/predatorPresentation'
  import { predatorNenLocked } from '$lib/fighting/predatorSeal'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'

  $: fighter = state[side]
  $: status = predatorStatus(state, side, language)
  $: fr = language === 'fr'
</script>

{#if ownsPredator(fighter) || fighter.predator}
  <div class="predator-status" aria-live="polite">
    <strong>Predator · {status.name}</strong>
    {#if predatorNenLocked(fighter)}
      <span class="sealed"
        >{fr ? 'Sans Nen après prédation' : 'Nen sealed after predation'} · {status.remaining}</span
      >
    {:else if fighter.predator?.hunt}
      <span>{fr ? 'Prédation ciblée en cours' : 'Targeted predation in progress'}</span>
    {:else}
      <progress
        max="100"
        value={status.progress}
        aria-label={fr ? 'Analyse de Predator' : 'Predator analysis'}
      ></progress>
      <span
        >{status.progress} % · {status.ready
          ? fr
            ? 'prédation prête · 40 aura'
            : 'predation ready · 40 aura'
          : fighter.predator?.watching
            ? fr
              ? 'observation personnelle'
              : 'personal observation'
            : fr
              ? 'analyse suspendue'
              : 'analysis paused'}</span
      >
      <small
        >{fr
          ? 'L : analyser · →/← + L : choisir · ↓ + L : abandonner · H : Predator'
          : 'L: study · →/← + L: select · ↓ + L: abandon · H: Predator'}</small
      >
    {/if}
  </div>
{/if}

<style>
  .predator-status {
    display: grid;
    gap: 0.3rem;
    color: #c1d3b7;
    overflow-wrap: anywhere;
  }
  strong {
    color: #d5e7bc;
    font-weight: 650;
  }
  progress {
    width: 100%;
    height: 0.4rem;
    accent-color: #a3bf6b;
  }
  small {
    color: #aab9c4;
    font: inherit;
  }
  .sealed {
    color: #ffc6a7;
  }
</style>
