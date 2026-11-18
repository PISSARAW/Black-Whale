<script lang="ts">
  import FightHeldButton from './FightHeldButton.svelte'
  import FightKameoCall from './FightKameoCall.svelte'
  import FightNenTactics from './FightNenTactics.svelte'
  import FightHanzoCall from './FightHanzoCall.svelte'
  import type { FightInput, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let onMoves: (() => void) | undefined = undefined
  export let language: 'fr' | 'en'
  export let onControl: (key: keyof FightInput, held: boolean) => void
  export let onEmperor: () => void
  export let onCall: () => void
  let open = false
  $: fr = language === 'fr'
</script>

<div class="touch-tools">
  <FightKameoCall {state} {language} {onControl} />
  {#if onMoves}<button type="button" class="touch-tools-toggle touch-moves" onclick={onMoves}
      >Combos</button
    >{/if}
  <button
    type="button"
    class="touch-tools-toggle"
    aria-expanded={open}
    aria-label={fr ? 'Nen et actions de terrain' : 'Nen and terrain actions'}
    onclick={() => (open = !open)}>{open ? '×' : 'Nen +'}</button
  >
</div>
{#if open}<section class="touch-tools-panel" aria-label={fr ? 'Nen et terrain' : 'Nen and terrain'}>
    <header>
      <strong>{fr ? 'Nen & terrain' : 'Nen & terrain'}</strong>
      <button
        type="button"
        aria-label={fr ? 'Fermer les techniques Nen' : 'Close Nen techniques'}
        onclick={() => (open = false)}>×</button
      >
    </header>
    <FightNenTactics fighter={state.player} {language} {onControl} />
    <div class="touch-context-actions">
      <FightHeldButton
        label={fr ? 'Se couvrir les oreilles' : 'Cover ears'}
        onHold={(active) => onControl('coverEars', active)}
        >{fr ? 'Oreilles' : 'Ears'}</FightHeldButton
      >
      <FightHeldButton
        label={fr ? 'Interagir avec un objet proche' : 'Interact with a nearby object'}
        onHold={(active) => onControl('interact', active)}
        >{fr ? 'Objet' : 'Object'}</FightHeldButton
      >
      {#if state.player.openWounds}<FightHeldButton
          label={fr ? 'Couvrir les plaies' : 'Cover wounds'}
          onHold={(active) => onControl('plugWounds', active)}
          >{fr ? 'Plaies' : 'Wounds'}</FightHeldButton
        >{/if}
      {#if state.arena}<FightHeldButton
          label={fr ? 'Action d’arène' : 'Arena action'}
          onHold={(active) => onControl('arena', active)}>{fr ? 'Arène' : 'Arena'}</FightHeldButton
        >{/if}
      {#if state.player.id === 'kurapika'}<button type="button" onclick={onEmperor}
          >Emperor Time</button
        >{/if}
      <FightHanzoCall {state} {language} {onCall} />
    </div>
  </section>{/if}
