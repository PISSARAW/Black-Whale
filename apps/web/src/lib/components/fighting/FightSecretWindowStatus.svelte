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
    'audio-only': ['Écoute à travers les obstacles', 'Listening through obstacles'],
  }
  $: feed = state[side].secretWindow
  $: visible = side === 'player' || state.mode === 'versus-local'
  $: action = feed ? ACTIONS[feed.observation.action][language === 'fr' ? 0 : 1] : ''
</script>

{#if visible && feed && secretWindowNenActive(state[side])}
  <div class="secret-window-status">
    Secret Window · {action}
    {#if feed.words}<p>« {feed.words.text} »</p>{/if}
    {#if feed.history?.length || feed.recordings?.length}
      <details>
        <summary
          >{language === 'fr'
            ? 'Consulter les observations reçues'
            : 'Review received observations'}</summary
        >
        {#each feed.history ?? [] as entry, index (index)}
          <p>
            {(entry.frame / 60).toFixed(1)} s · {ACTIONS[entry.action][language === 'fr' ? 0 : 1]}
          </p>
        {/each}
        {#each feed.recordings ?? [] as entry, index (index)}
          <p>{(entry.frame / 60).toFixed(1)} s · « {entry.text} »</p>
        {/each}
      </details>
    {/if}
  </div>
{/if}

<style>
  .secret-window-status {
    color: #e5d9bc;
    margin-top: 0.3rem;
    font: 600 0.6rem/1.4 var(--font-mono);
  }
</style>
