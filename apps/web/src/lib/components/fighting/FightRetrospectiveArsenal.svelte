<script lang="ts">
  import { phoneGuidance } from '$lib/fighting/retrospectivePresentation'
  import { arsenalOptions } from '$lib/fighting/retrospectiveArsenal'
  import type { ArsenalCommand } from '$lib/fighting/retrospectiveTypes'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused = false
  export let onUse: (side: FightSide, command: ArsenalCommand) => void
  $: sides =
    state.mode === 'versus-local' || state.mode === 'training'
      ? (['player', 'opponent'] as const)
      : (['player'] as const)
</script>

{#each sides as side (side)}
  {@const options = arsenalOptions(state, side)}
  {#if options.length}
    <section
      class="arsenal"
      aria-label={language === 'fr' ? 'Arsenal rétrospectif' : 'Retrospective arsenal'}
    >
      <strong
        >{side === 'player' ? 'P1' : 'P2'} · {language === 'fr'
          ? 'Techniques et préparations'
          : 'Techniques and preparation'}</strong
      >
      {#each options as option (`${option.command.action}:${option.command.target ?? ''}`)}
        <button
          type="button"
          disabled={paused || !option.ready}
          title={language === 'fr' ? option.conditionFr : option.conditionEn}
          onclick={() => onUse(side, option.command)}
        >
          {language === 'fr' ? option.labelFr : option.labelEn}
        </button>
        <small>{language === 'fr' ? option.conditionFr : option.conditionEn}</small>
      {/each}
      {#if state[side].chrolloHistorical?.phone}<span>{phoneGuidance(state, side, language)}</span
        >{/if}
      {#if state[side].gumCatch?.projectile}<span
          >{language === 'fr'
            ? 'Objet réel retenu par Bungee Gum'
            : 'Real object held by Bungee Gum'}</span
        >{/if}
      {#if state[side].cookie}
        <span
          >Cookie · {Math.floor(state[side].cookie!.frames / 60)} s
          {#if state[side].cookie!.mode === 'piano'}
            / 1 800 s{/if}</span
        >
      {/if}
    </section>
  {/if}
{/each}

<style>
  .arsenal {
    display: grid;
    gap: 0.4rem;
    padding: 0.75rem;
    border: 1px solid #715887;
    background: #17101e;
    color: #e5dcef;
  }
  button {
    min-height: 44px;
    padding: 0.5rem;
    color: inherit;
    background: #30213c;
    border: 1px solid #856a9a;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  button:focus-visible {
    outline: 2px solid #ecd17b;
    outline-offset: 2px;
  }
  small {
    color: #c2b6cc;
  }
</style>
