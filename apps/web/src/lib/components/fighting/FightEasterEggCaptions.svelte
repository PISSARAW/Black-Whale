<script lang="ts">
  import { easterEggCaption } from '$lib/fighting/easterEggCaptions'
  import type { FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  const sides = ['player', 'opponent'] as const
</script>

<div class="egg-captions" aria-live="polite" aria-atomic="true">
  {#each sides as side (side)}
    {#if state[side].easterEgg}
      <div class="egg-caption" class:opponent={side === 'opponent'}>
        <span>{language === 'fr' ? 'Clin d’œil' : 'Easter Egg'}</span>
        <p>{easterEggCaption(state[side], language)}</p>
      </div>
    {/if}
  {/each}
</div>

<style>
  .egg-captions {
    position: absolute;
    inset: auto 12px 16px;
    z-index: 8;
    display: flex;
    justify-content: space-between;
    gap: 10px;
    pointer-events: none;
  }
  .egg-caption {
    width: min(42%, 310px);
    padding: 8px 12px;
    border-left: 2px solid #d5b67b;
    background: #09121eeb;
    color: #f4e5c8;
    font-size: 0.85rem;
  }
  .opponent {
    margin-left: auto;
    border-left: 0;
    border-right: 2px solid #d5b67b;
    text-align: right;
  }
  span {
    color: #c1a16b;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  p {
    margin: 3px 0 0;
    overflow-wrap: anywhere;
  }
  @media (max-width: 480px) {
    .egg-caption {
      padding: 6px;
      font-size: 0.7rem;
    }
  }
</style>
