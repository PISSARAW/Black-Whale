<script lang="ts">
  import FightCeremony from './FightCeremony.svelte'
  import FightResults from './FightResults.svelte'
  import FightRivalryRules from './FightRivalryRules.svelte'
  import type { FightState } from '$lib/fighting/types'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { fightingCopy } from '../../../routes/fighting/fightingCopy'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let replay = false
  export let startFight: () => void
  export let rematch: () => void
  export let continueMatch: () => void
  export let chooseAgain: () => void
  export let quitFight: () => void
  $: copy = fightingCopy(language)
</script>

{#if state.phase === 'ready' && !replay}
  <div class="match-overlay ready-overlay">
    <FightCeremony {state} {language} />
    <p>
      {fighterDefinition(state.player.id).name} <span>VS</span>
      {fighterDefinition(state.opponent.id).name}
    </p>
    <h2>{copy.ready}</h2>
    <FightRivalryRules {state} {language} />
    <button type="button" onclick={startFight}>{copy.fight}</button>
  </div>
{:else if state.phase === 'finished' && !replay}
  <FightResults
    {state}
    {language}
    onRematch={rematch}
    onContinue={continueMatch}
    onChoose={chooseAgain}
    onQuit={quitFight}
  />
{/if}
