<script lang="ts">
  import FightHeldButton from './FightHeldButton.svelte'
  import FightKameoCall from './FightKameoCall.svelte'
  import FightHanzoCall from './FightHanzoCall.svelte'
  import { useFightBindings } from '$lib/fighting/fightControlHints'
  import { fightSpecialPresentation } from '$lib/fighting/fightSpecialPresentation'
  import { moveForSlot, movesetFor } from '$lib/fighting/movesets'
  import { projectileProfile } from '$lib/fighting/projectiles'
  import type { AttackKind, FightInput, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let onAttack: (kind: AttackKind) => void
  export let onThrow: () => void
  export let onCall: () => void
  export let onFinisher: () => void
  export let onControl: (key: keyof FightInput, held: boolean) => void
  const bindings = useFightBindings()
  const movement: Array<[keyof FightInput, string, string, string]> = [
    ['left', '←', 'Aller à gauche', 'Move left'],
    ['jump', '↑', 'Sauter', 'Jump'],
    ['right', '→', 'Aller à droite', 'Move right'],
    ['down', '↓', 'Se baisser', 'Crouch'],
    ['guard', 'Garde', 'Garde', 'Block'],
    ['coverEars', 'Oreilles', 'Se couvrir les oreilles', 'Cover ears'],
    ['interact', 'Objet', 'Interagir avec un objet proche', 'Interact with a nearby object'],
  ]
  $: special = fightSpecialPresentation(state, language)
  $: shot = projectileProfile(state.player.id)
  $: finisher = moveForSlot(state.player.id, 'finisher')
</script>

<div
  class="touch-controls"
  aria-label={language === 'fr' ? 'Commandes tactiles' : 'Touch controls'}
>
  <div class="touch-group">
    {#each movement as [key, text, fr, en] (key)}
      <FightHeldButton
        label={language === 'fr' ? fr : en}
        onHold={(active) => onControl(key, active)}
        >{language === 'fr' || text.length < 3 ? text : en}</FightHeldButton
      >
    {/each}
    {#if state.player.openWounds}
      <FightHeldButton
        label={language === 'fr' ? 'Couvrir les plaies' : 'Cover wounds'}
        onHold={(active) => onControl('plugWounds', active)}
        >{language === 'fr' ? 'Plaies' : 'Wounds'}</FightHeldButton
      >
    {/if}
  </div>
  <div class="touch-group">
    <FightKameoCall {state} {language} {onControl} />
    <FightHanzoCall {state} {language} {onCall} />
    <button
      type="button"
      aria-label={language === 'fr' ? 'Coup léger' : 'Light attack'}
      onclick={() => onAttack('light')}
      >{$bindings.playerLight} · {language === 'fr' ? 'Léger' : 'Light'}</button
    >
    <button
      type="button"
      aria-label={language === 'fr' ? 'Coup lourd' : 'Heavy attack'}
      onclick={() => onAttack('heavy')}
      >{$bindings.playerHeavy} · {language === 'fr' ? 'Lourd' : 'Heavy'}</button
    >
    <button
      type="button"
      aria-label={language === 'fr' ? 'Projection / déprojection — maintenir Aura pour une super projection' : 'Throw / tech — hold Aura for a super throw'}
      onclick={onThrow}
      >{$bindings.playerThrow} · {language === 'fr' ? 'Projection' : 'Throw'}</button
    >
    <button
      type="button"
      class="ranged-button"
      title={language === 'fr' ? shot.labelFr : shot.labelEn}
      onclick={() => onAttack('ranged')}
      >{$bindings.playerRanged} · {language === 'fr' ? 'Tir' : 'Shot'}</button
    >
    {#if movesetFor(state.player.id) && finisher}
      <button
        type="button"
        class="finisher-button"
        title={language === 'fr' ? finisher.nameFr : finisher.nameEn}
        onclick={onFinisher}
        >{$bindings.playerFinisher} · {language === 'fr' ? 'Ultime' : 'Super'}</button
      >
    {/if}
    {#if state.player.id !== 'camilla'}
      <FightHeldButton
        className="special-button"
        label={special.hint}
        onHold={(active) => onControl('hatsu', active)}
        onCommit={() => onAttack('special')}
        >{$bindings.playerSpecial} · {special.label}</FightHeldButton
      >
    {/if}
  </div>
</div>

<style>
  .touch-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
    padding: 0.65rem;
    border-top: 1px solid #405562;
    background: #080f15;
    color: #dce5ea;
    font: 0.8rem/1.4 var(--font-mono);
  }
  .touch-group {
    display: flex;
    flex-wrap: wrap;
    align-content: start;
    gap: 0.4rem;
    min-width: 0;
  }
  button {
    min-height: 44px;
    max-width: 100%;
    padding: 0.5rem 0.65rem;
    border: 1px solid #708a9c;
    border-radius: 6px;
    color: white;
    background: #12212d;
    font: inherit;
    cursor: pointer;
  }
  button:focus-visible {
    outline: 2px solid #f5d25c;
    outline-offset: 2px;
  }
  @media (max-width: 600px) {
    .touch-controls {
      grid-template-columns: 1fr;
    }
  }
</style>
