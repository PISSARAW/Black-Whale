<script lang="ts">
  import { fightFigureVisible } from '$lib/fighting/fightFigureVisibility'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let enabled = true
  $: sides = (['player', 'opponent'] as const).filter(
    (side) => enabled && !fightFigureVisible(state, side),
  )
</script>

{#if sides.length}
  <div class="tracking-markers" data-combatant-tracking>
    {#each sides as side (side)}
      <span data-tracked-side={side}>
        {fighterDefinition(state[side].id).name} · {language === 'fr'
          ? 'Silhouette de suivi'
          : 'Tracking silhouette'} —
        {state.catsNameConsumed === side
          ? language === 'fr'
            ? 'Corps absorbé'
            : 'Body absorbed'
          : language === 'fr'
            ? 'Expulsé'
            : 'Expelled'}
      </span>
    {/each}
  </div>
{/if}

<style>
  .tracking-markers {
    position: absolute;
    left: 2%;
    top: clamp(118px, 20%, 160px);
    max-width: 60%;
    display: grid;
    gap: 0.25rem;
    pointer-events: none;
    z-index: 2;
  }
  span {
    padding: 0.4rem 0.55rem;
    border: 1px solid #87b4d6;
    background: #0c1729e6;
    color: #d2e9fa;
    font: 600 clamp(0.6rem, 0.8vw, 0.8rem)/1.35 var(--font-mono, monospace);
  }
  @media (max-width: 600px) {
    .tracking-markers {
      max-width: 48%;
    }
  }
</style>
