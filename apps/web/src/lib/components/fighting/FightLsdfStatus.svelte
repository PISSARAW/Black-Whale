<script lang="ts">
  import { ownsLsdf } from '$lib/fighting/lsdf'
  import { lsdfHint } from '$lib/fighting/lsdfPresentation'
  import type { FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'

  $: sides = (['player', 'opponent'] as const).filter((side) => ownsLsdf(state[side]))
</script>

{#if sides.length}
  <aside aria-live="polite">
    {#if state.environment.stageId === 'heilly-hideout'}
      <small
        >{language === 'fr' ? 'Morena' : 'Morena'} · {state.environment.morenaPresent
          ? language === 'fr'
            ? 'présente'
            : 'present'
          : language === 'fr'
            ? 'absente'
            : 'absent'}</small
      >
    {/if}
    {#each sides as side (side)}
      <span>{side === 'player' ? 'P1' : 'P2'} · {lsdfHint(state, side, language)}</span>
    {/each}
    {#if state.expulsion}
      <strong
        >{language === 'fr'
          ? 'Intrus expulsé · aucun dégât'
          : 'Intruder expelled · no damage'}</strong
      >
    {/if}
  </aside>
{/if}

<style>
  aside {
    position: absolute;
    z-index: 22;
    top: 8rem;
    left: 50%;
    display: grid;
    gap: 0.2rem;
    width: min(90%, 27rem);
    padding: 0.5rem 0.7rem;
    border: 1px solid #655a39;
    background: rgb(7 12 15 / 88%);
    color: #eee4bf;
    font: 600 0.6rem/1.4 var(--font-mono);
    text-align: center;
    transform: translateX(-50%);
    pointer-events: none;
  }
  small {
    color: #a8bac5;
  }
  strong {
    color: #f1d36d;
  }
  @media (max-width: 600px) {
    aside {
      top: 6.5rem;
    }
  }
</style>
