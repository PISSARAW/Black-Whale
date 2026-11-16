<script lang="ts">
  import FightCeremony from './FightCeremony.svelte'
  import type { FightState } from '$lib/fighting/types'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { winnerLabel, finishLabel } from '../../../routes/fighting/fightingPageHelpers'
  import { fightingCopy } from '../../../routes/fighting/fightingCopy'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let paused: boolean
  export let replay = false
  export let togglePause: () => void
  export let startFight: () => void
  export let rematch: () => void
  export let continueMatch: () => void
  export let chooseAgain: () => void
  $: copy = fightingCopy(language)
</script>

{#if paused && state.phase === 'fighting' && state.mode !== 'training'}
  <div class="match-overlay pause-overlay">
    <p>{language === 'fr' ? 'COMBAT EN PAUSE' : 'FIGHT PAUSED'}</p>
    <h2>{language === 'fr' ? 'PAUSE' : 'PAUSED'}</h2>
    <button type="button" onclick={togglePause}>
      {language === 'fr' ? 'Reprendre' : 'Resume'}
    </button>
  </div>
{/if}

{#if state.phase === 'ready' && !replay}
  <div class="match-overlay ready-overlay">
    <FightCeremony {state} {language} />
    <p>
      {fighterDefinition(state.player.id).name} <span>VS</span>
      {fighterDefinition(state.opponent.id).name}
    </p>
    <h2>{copy.ready}</h2>
    <button type="button" onclick={startFight}>{copy.fight}</button>
  </div>
{:else if state.phase === 'finished' && !replay}
  <div class="match-overlay result-overlay">
    <FightCeremony {state} {language} />
    <p>{finishLabel(state, language)}</p>
    <h2>{winnerLabel(state, copy)}</h2>
    <p>{state.roundsWon.player} — {state.roundsWon.opponent}</p>
    <div>
      {#if state.matchWinner}
        <button type="button" onclick={rematch}>{copy.rematch}</button>
      {:else}
        <button type="button" onclick={continueMatch}>
          {language === 'fr' ? 'Manche suivante' : 'Next round'}
        </button>
      {/if}
      <button type="button" class="secondary" onclick={chooseAgain}>{copy.roster}</button>
    </div>
  </div>
{/if}
