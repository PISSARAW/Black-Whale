<script lang="ts">
  import type { FightSide, FightState } from '$lib/fighting/types'
  import type { SecretWindowObservation } from '$lib/fighting/secretWindow'
  import { secretWindowNenActive } from '$lib/fighting/secretWindow'

  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'

  const ACTIONS: Record<SecretWindowObservation['action'], readonly [string, string]> = {
    idle: ['Attente', 'Idle'],
    walk: ['Déplacement', 'Movement'],
    jump: ['Saut', 'Jump'],
    guard: ['Garde', 'Guard'],
    light: ['Frappe légère', 'Light strike'],
    heavy: ['Frappe lourde', 'Heavy strike'],
    special: ['Geste technique', 'Technique gesture'],
    ranged: ['Tir', 'Shot'],
    hit: ['Impact reçu', 'Hit received'],
    down: ['Au sol', 'Down'],
    wakeup: ['Relevée', 'Getting up'],
    ko: ['Corps inerte', 'Unmoving body'],
    'concealed-gesture': ['Geste observé', 'Observed gesture'],
    'sleeping-body': ['Corps endormi', 'Sleeping body'],
  }
  $: feed = state[side].secretWindow
  $: visible = side === 'player' || state.mode === 'versus-local'
  $: action = feed ? ACTIONS[feed.observation.action][language === 'fr' ? 0 : 1] : ''
</script>

{#if visible && feed && secretWindowNenActive(state[side])}
  <div class="secret-window-status">
    Secret Window · {action}
    {#if feed.heard}<span>« {feed.heard.text} »</span>{/if}
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
