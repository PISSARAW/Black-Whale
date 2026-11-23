<script lang="ts">
  import { fightSpecialPresentation } from '$lib/fighting/fightSpecialPresentation'
  import { finisherReady } from '$lib/fighting/movesets'
  import { visibleCommandFeedback } from '$lib/fighting/commandFeedback'
  import { commandFeedbackText } from '$lib/fighting/commandFeedbackText'
  import type { FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  $: special = fightSpecialPresentation(state, language)
  $: ultimate = finisherReady(state, 'player')
  $: feedback = visibleCommandFeedback(state, 'player')
  $: turns = state.player.hatsuEffects.cyclotronTurns
  $: pain = state.player.hatsuEffects.painPacker
</script>

{#if state.phase === 'fighting'}
  <div
    class="essential-status"
    aria-label={language === 'fr' ? 'État du combattant' : 'Fighter status'}
  >
    {#if state.player.id !== 'camilla'}<span class:ready={special.ready}
        >HATSU <b>{special.ready ? '●' : '○'}</b></span
      >{/if}
    {#if ultimate}<span class="ready super-ready"
        >{language === 'fr' ? 'ULTIME PRÊT' : 'SUPER READY'}</span
      >{/if}
    {#if turns > 0}<span>{turns} {language === 'fr' ? 'tours' : 'turns'}</span>{/if}
    {#if state.player.cyclotronWindup}<span>{language === 'fr' ? 'Rotation…' : 'Winding…'}</span
      >{/if}
    {#if pain && pain.injuries > 0 && !pain.sun}<span
        >{language === 'fr' ? 'Douleur' : 'Pain'} · {Math.round(pain.injuries)}</span
      >{/if}
    {#if state.player.tskPoisoned}<span class="poisoned"
        >TSK-17 · {language === 'fr' ? 'Empoisonné' : 'Poisoned'}</span
      >{/if}
  </div>
  {#if feedback && feedback.outcome === 'refused'}<p class="battle-command-toast" role="status">
      {commandFeedbackText(feedback, language)}
    </p>{/if}
{/if}

<style>
  .essential-status {
    position: absolute;
    left: 1.2rem;
    bottom: 1rem;
    z-index: 23;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    pointer-events: none;
  }
  .essential-status span {
    padding: 0.4rem 0.65rem;
    color: #9d8aa9;
    border: 1px solid #6b4e7b80;
    background: #130c1cc9;
    font: 600 0.6rem/1.3 var(--font-mono);
    letter-spacing: 0.08em;
  }
  .essential-status .ready {
    color: #d2b3f6;
    border-color: #b490dc80;
  }
  .essential-status .super-ready {
    color: #ffc095;
    border-color: #ff864b90;
  }
  b {
    margin-left: 0.3rem;
    font-size: 0.55rem;
  }
  .battle-command-toast {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    z-index: 23;
    max-width: min(24rem, 50%);
    margin: 0;
    padding: 0.5rem 0.75rem;
    border-right: 2px solid #ff9e76;
    background: #140b12d9;
    color: #e0bac5;
    font: 0.65rem/1.5 var(--font-mono);
    pointer-events: none;
  }
  @media (max-width: 600px) {
    .essential-status {
      left: 0.6rem;
      bottom: 0.6rem;
      gap: 0.3rem;
    }
    .essential-status span {
      padding: 0.35rem 0.45rem;
      font-size: 0.5rem;
    }
    .battle-command-toast {
      bottom: 2.8rem;
      right: 0.6rem;
      max-width: 80%;
      font-size: 0.6rem;
    }
  }
</style>
