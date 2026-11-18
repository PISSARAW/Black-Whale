<script lang="ts">
  import { MUSSE_ARCHIVE, benjaminCanRewindMusse } from '$lib/fighting/benjaminMusseArchive'
  import { WINDOW_ACTION_LABELS } from '$lib/fighting/secretWindowLabels'
  import { WINDOW_OBSERVATION_CACHE } from '$lib/fighting/benjaminMusseRecording'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: archive = state[side].hatsuEffects.baton?.musseArchive
  $: cursor = archive?.cursor
  $: frame = cursor === undefined ? undefined : MUSSE_ARCHIVE[cursor]
  $: recorded = archive?.observedCursor
    ? archive.observed?.find((entry) => entry.id === archive?.observedCursor)
    : undefined
  $: visible = side === 'player' || state.mode === 'versus-local'
</script>

{#if visible && (frame || recorded) && benjaminCanRewindMusse(state, side)}
  <p class="musse-archive" role="status">
    {#if frame}
      <strong
        >Secret Window · {language === 'fr'
          ? 'Archive de Musse — Camilla'
          : 'Musse archive — Camilla'}</strong
      >
      <span>{language === 'fr' ? frame.fr : frame.en}</span>
      <small
        >{language === 'fr'
          ? 'Dernières observations de Musse ; le flux reçu ensuite par Benjamin reste distinct.'
          : 'Musse’s final observations; Benjamin’s subsequent received feed remains distinct.'}</small
      >
    {:else if recorded}
      <strong
        >Secret Window · {language === 'fr'
          ? 'Vue reçue par Benjamin — Camilla'
          : 'View received by Benjamin — Camilla'}</strong
      >
      <span
        >{language === 'fr' ? 'Manche' : 'Round'}
        {recorded.round} · {(recorded.frame / 60).toFixed(1)} s · {WINDOW_ACTION_LABELS[
          recorded.action
        ][language === 'fr' ? 0 : 1]}</span
      >
      {#if recorded.words}<span>« {recorded.words.text} »</span>{/if}
    {/if}
    {#if (archive?.observedOrdinal ?? 0) > WINDOW_OBSERVATION_CACHE}
      <small
        >{language === 'fr'
          ? 'L’interface conserve les dernières vues du scénario.'
          : 'The interface keeps the latest scenario views.'}
        {WINDOW_OBSERVATION_CACHE}</small
      >
    {/if}
  </p>
{/if}

<style>
  .musse-archive {
    display: grid;
    gap: 0.25rem;
    padding: 0.5rem;
    border: 1px solid #a89c77;
    color: #ece2c5;
    overflow-wrap: anywhere;
  }
  small {
    color: #c3b79d;
  }
</style>
