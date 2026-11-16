<script lang="ts">
  import { catsNamePhase, CATS_NAME_FRAMES } from '$lib/fighting/camillaCat'
  import type { FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  const phases = {
    fr: {
      summon: 'Le chat apparaît',
      capture: 'Capture du meurtrier',
      absorb: 'Absorption de sa vie',
      revive: 'Résurrection de Camilla',
    },
    en: {
      summon: 'The cat appears',
      capture: 'Capturing the killer',
      absorb: 'Absorbing their life',
      revive: 'Camilla’s resurrection',
    },
  }
  $: sequence = state.catsName
</script>

{#if sequence}
  <div class="cats-name" role="status" aria-live="polite">
    <strong>CAT’S NAME</strong>
    <span>{phases[language][catsNamePhase(sequence.frame)]}</span>
    <div class="progress" aria-hidden="true">
      <i style={`width:${(sequence.frame / CATS_NAME_FRAMES) * 100}%`}></i>
    </div>
    <small
      >{language === 'fr'
        ? 'Nen posthume · le combat est suspendu'
        : 'Post-mortem Nen · combat suspended'}</small
    >
  </div>
{/if}

<style>
  .cats-name {
    position: absolute;
    z-index: 35;
    left: 50%;
    bottom: 1rem;
    transform: translateX(-50%);
    width: min(26rem, 88%);
    box-sizing: border-box;
    padding: 0.7rem 1rem;
    border: 1px solid #cfaf65;
    background: #11101bec;
    color: #f2e1af;
    text-align: center;
    pointer-events: none;
    display: grid;
    gap: 0.3rem;
    font: 600 0.8rem/1.3 var(--font-mono);
  }
  strong {
    letter-spacing: 0.15em;
    font-size: 1.1rem;
  }
  small {
    color: #b9b2c6;
    font-size: 0.65rem;
  }
  .progress {
    height: 3px;
    background: #3c3447;
  }
  i {
    display: block;
    height: 100%;
    background: #ffe694;
  }
</style>
