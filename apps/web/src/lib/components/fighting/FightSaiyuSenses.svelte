<script lang="ts">
  import { SAIYU_MONKEYS, senseDeprived } from '$lib/fighting/saiyuSenses'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let viewer: FightSide = 'player'
  const sides: FightSide[] = ['player', 'opponent']
  $: shown = state.mode === 'versus-local' ? viewer : 'player'
  $: blind = senseDeprived(state[shown], 'sight')
  $: affected = state.player.hatsuEffects.senseSeals || state.opponent.hatsuEffects.senseSeals
  const names = {
    sight: ['Vue', 'Sight'],
    hearing: ['Ouïe', 'Hearing'],
    speech: ['Parole', 'Speech'],
  }
</script>

{#if blind}
  <div class="blindness" data-saiyu-blind={shown} role="status">
    <strong>Mizaru</strong>
    <span>{language === 'fr' ? 'Vue scellée' : 'Sight sealed'}</span>
  </div>
{/if}
{#if affected}
  <div
    class="senses"
    aria-label={language === 'fr' ? 'Privations des trois singes' : 'Three Monkeys deprivation'}
  >
    {#if state.mode === 'versus-local'}
      <div class="viewers">
        {#each sides as side, index (side)}
          <button type="button" aria-pressed={viewer === side} onclick={() => (viewer = side)}>
            Perception J{index + 1}
          </button>
        {/each}
      </div>
    {/if}
    {#each sides as side, index (side)}
      {#if state[side].hatsuEffects.senseSeals}
        <div class="seals">
          <b>J{index + 1}</b>
          {#each SAIYU_MONKEYS as monkey (monkey.name)}
            {#if senseDeprived(state[side], monkey.sense)}
              <span>{monkey.name} · {names[monkey.sense][language === 'fr' ? 0 : 1]}</span>
            {/if}
          {/each}
        </div>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .blindness {
    position: absolute;
    inset: 0;
    z-index: 24;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 0.6rem;
    background: #020508;
    color: #c6d0d9;
    pointer-events: none;
    font: 600 1rem/1.4 var(--font-mono);
  }
  .blindness strong {
    font-size: 1.8rem;
  }
  .senses {
    position: absolute;
    z-index: 25;
    bottom: 0.6rem;
    left: 0.6rem;
    right: 0.6rem;
    display: grid;
    gap: 0.3rem;
    pointer-events: none;
    color: #e1d0a1;
    font: 600 0.65rem/1.4 var(--font-mono);
  }
  .seals,
  .viewers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .seals span {
    padding: 0.2rem 0.35rem;
    background: #080f15;
  }
  button {
    pointer-events: auto;
    border: 1px solid #6b7882;
    padding: 0.4rem 0.6rem;
    background: #080f15;
    color: #c6d0d9;
    font: inherit;
  }
  button[aria-pressed='true'] {
    border-color: #c8a65d;
    color: #f5d281;
  }
</style>
