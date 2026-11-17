<script lang="ts">
  import { GUARD_LABELS } from '$lib/fighting/combatProperties'
  import { attackData, attackPhase } from '$lib/fighting/frameData'
  import { moveById } from '$lib/fighting/movesets'
  import type { FightState } from '$lib/fighting/types'
  import FightComboChoices from './FightComboChoices.svelte'

  export let state: FightState
  export let language: 'fr' | 'en'

  $: measurement = state.training?.measurement
  $: data = state.player.attack ? attackData(state.player.attack.kind, state.player) : null
  $: move = moveById(state.player.attack?.moveId)
</script>

<div class="training-frame-data">
  <strong
    >{move
      ? language === 'fr'
        ? move.nameFr
        : move.nameEn
      : (state.player.attack?.kind ?? 'NEUTRAL')}</strong
  >
  {#if data}
    <span>F{state.player.attack?.frame} · {attackPhase(state.player)?.toUpperCase()}</span>
    <span>S {data.startup} · A {data.active} · R {data.recovery}</span>
    <span>{GUARD_LABELS[data.guard][language === 'fr' ? 0 : 1]}</span>
  {:else}
    <span>—</span>
  {/if}
  <span
    >{language === 'fr' ? 'AVANTAGE MESURÉ' : 'MEASURED ADVANTAGE'}
    {#if measurement}
      · {measurement.attacker === 'player' ? 'P1' : 'P2'} · {measurement.blocked
        ? language === 'fr'
          ? 'GARDE'
          : 'BLOCK'
        : 'HIT'}
      {#if measurement.status === 'complete'}
        {measurement.advantage! >= 0 ? '+' : ''}{measurement.advantage}f
      {:else if measurement.status === 'pending'}
        · {language === 'fr' ? 'Récupération…' : 'Recovering…'}
      {:else}
        · {language === 'fr' ? 'Interrompu' : 'Interrupted'}{/if}
    {:else}
      · —{/if}
  </span>
  <span>COMBO {state.opponent.comboHits} · {state.opponent.comboDamage} DMG</span>
  <span>JUGGLE {state.opponent.juggleCount}/3</span>
  <FightComboChoices {state} {language} />
  <span class="collision-legend"
    >{language === 'fr'
      ? 'Corps : cyan / violet · frappe : rouge · projectile : orange'
      : 'Body: cyan / purple · strike: red · projectile: orange'}</span
  >
</div>

<style>
  .training-frame-data {
    position: relative;
    z-index: 25;
    display: grid;
    box-sizing: border-box;
    width: fit-content;
    max-width: calc(100% - 2rem);
    margin: 0.75rem 1rem 0;
    gap: 0.16rem;
    border-left: 3px solid #f5d25c;
    padding: 0.55rem 0.7rem;
    background: rgb(2 7 10 / 82%);
    color: #d8e5eb;
    font: 700 var(--hud-font, 0.75rem)/1.35 var(--font-mono);
    overflow-wrap: anywhere;
    text-transform: uppercase;
    pointer-events: none;
  }
  .collision-legend {
    max-width: 22rem;
    font-size: 0.65rem;
    text-transform: none;
    color: #c4cfda;
  }
  .training-frame-data strong {
    color: #f5d25c;
  }
</style>
