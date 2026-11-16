<script lang="ts">
  import { ceremonyText, winnerForCeremony } from '$lib/fighting/career/presentation'
  import { clashCareer } from '$lib/fighting/career/profile'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  $: winner = winnerForCeremony(state)
  $: appearance = $clashCareer.appearance
  $: ready = state.phase === 'ready'
</script>

{#if (ready && appearance.intro !== 'off') || winner}
  <div class="ceremony" data-theme={appearance.theme} class:brief={appearance.intro !== 'full'}>
    {#if ready}<div class="lineup">
        {#each ['player', 'opponent'] as const as side (side)}<div>
            <strong>{fighterDefinition(state[side].id).name}</strong
            >{#if appearance.intro === 'full'}<p>{ceremonyText(state, language, side)}</p>{/if}
          </div>{/each}
      </div>
    {:else if winner}<strong>{fighterDefinition(state[winner].id).name}</strong>
      <p>{ceremonyText(state, language, winner)}</p>{/if}
    <small
      >{language === 'fr' ? 'Dialogues originaux pour Clash' : 'Original dialogue for Clash'}</small
    >
  </div>
{/if}

<style>
  .ceremony {
    --accent: #f5d25c;
    border: 1px solid var(--accent);
    padding: 0.8rem;
    margin: 0.7rem 0;
    background: linear-gradient(120deg, #101b25, #263d52);
    text-align: center;
    animation: arrival 0.65s ease-out both;
  }
  .ceremony[data-theme='heavens'] {
    --accent: #a6e5ff;
    background: linear-gradient(120deg, #122c43, #214964);
  }
  .ceremony[data-theme='nocturne'] {
    --accent: #d3a9ff;
    background: linear-gradient(120deg, #20172d, #35244b);
  }
  .lineup {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
  }
  strong {
    color: var(--accent);
  }
  p {
    margin: 0.5rem 0;
    font-size: 0.8rem;
  }
  small {
    display: block;
    font-size: 0.65rem;
    color: #c6d5df;
  }
  .brief {
    animation: none;
  }
  @keyframes arrival {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ceremony {
      animation: none;
    }
  }
</style>
