<script lang="ts">
  import { onDestroy } from 'svelte'
  import { fighterSelectionLine, previewSelectionVoice } from '$lib/fighting/audio/selectionVoice'
  import type { FighterId } from '$lib/fighting/types'
  import { rivalExchange } from '$lib/fighting/presentation/rivals'
  import { fighterDefinition } from '$lib/fighting/roster'

  export let fighter: FighterId
  export let other: FighterId
  export let language: 'fr' | 'en'

  let cancel: (() => void) | undefined
  $: quote = fighterSelectionLine(fighter, language)
  $: exchange = rivalExchange(fighter, other)
  $: index = language === 'fr' ? 0 : 1
  $: if (language) stop()

  export function play(id: FighterId, against = other) {
    cancel = previewSelectionVoice(id, language, against)
  }

  export function stop() {
    cancel?.()
    cancel = undefined
  }

  onDestroy(stop)
</script>

{#if exchange}
  <div class="selection-voice exchange">
    {#each exchange.pair as speaker, position (speaker)}
      <div>
        <strong>{fighterDefinition(speaker).name}</strong>
        <q>{exchange.lines[position * 2 + index]}</q>
      </div>
    {/each}
    <button type="button" onclick={() => play(fighter)}>
      {language === 'fr' ? 'Écouter l’échange' : 'Play exchange'}
    </button>
  </div>
{:else if quote}
  <div class="selection-voice">
    <q>{quote}</q>
    <button type="button" onclick={() => play(fighter)}>
      {language === 'fr' ? 'Écouter la voix' : 'Play voice'}
    </button>
  </div>
{/if}

<style>
  .selection-voice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem 0.8rem;
    margin: 0.75rem 0;
  }
  q {
    color: #f3d7a8;
    font-size: 0.8rem;
    font-style: italic;
  }
  .exchange {
    display: grid;
    justify-items: start;
    font-size: 0.75rem;
  }
  strong {
    margin-inline-end: 0.35rem;
  }
  button {
    min-height: 32px;
    padding: 0.25rem 0.55rem;
    border: 1px solid #78648b;
    color: #eee1f6;
    background: #261d30;
    font: 600 0.67rem var(--font-mono);
    cursor: pointer;
  }
  button:focus-visible {
    outline: 2px solid #ff9a64;
    outline-offset: 2px;
  }
</style>
