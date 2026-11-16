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
    grid-column: 1 / -1;
    display: grid;
    gap: 0.3rem;
    padding: 0.55rem 0.7rem;
    border-left: 2px solid #c7ab64;
    background: #151c22;
    color: #eee4bf;
    font: inherit;
    overflow-wrap: anywhere;
  }
  small {
    color: #c2cbd2;
    font-size: inherit;
  }
  strong {
    color: #f1d36d;
  }
</style>
