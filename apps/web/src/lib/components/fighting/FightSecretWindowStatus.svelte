<script lang="ts">
  import FightMusseArchive from './FightMusseArchive.svelte'
  import type { FightSide, FightState } from '$lib/fighting/types'
  import { WINDOW_ACTION_LABELS } from '$lib/fighting/secretWindowLabels'
  import { secretWindowNenActive } from '$lib/fighting/secretWindow'

  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'

  $: feed = state[side].secretWindow
  $: listening = state[side].secretWindowListening
  $: visible = side === 'player' || state.mode === 'versus-local'
  $: action = feed ? WINDOW_ACTION_LABELS[feed.observation.action][language === 'fr' ? 0 : 1] : ''
</script>

<FightMusseArchive {state} {side} {language} />

{#if visible && feed && secretWindowNenActive(state[side])}
  <div class="secret-window-status">
    Secret Window · {action}
    {#if feed.heard}<span>« {feed.heard.text} »</span>{/if}
  </div>
{/if}
{#if visible && listening && secretWindowNenActive(state[side])}
  <div class="secret-window-status">
    Secret Window · {language === 'fr' ? 'Hibou d’épaule : écoute' : 'Shoulder owl: listening'}
    {#if listening.heard}<span>{listening.heard.text}</span>{/if}
  </div>
{/if}

<style>
  .secret-window-status {
    color: #e5d9bc;
    margin-top: 0.3rem;
    font: 600 0.6rem/1.4 var(--font-mono);
  }
  span {
    display: block;
    overflow-wrap: anywhere;
  }
</style>
