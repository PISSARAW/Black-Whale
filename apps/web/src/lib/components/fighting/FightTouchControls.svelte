<script lang="ts">
  import FightHeldButton from './FightHeldButton.svelte'
  import FightDirectionPad from './FightDirectionPad.svelte'
  import FightTouchButton from './FightTouchButton.svelte'
  import FightTouchTools from './FightTouchTools.svelte'
  import { fightTouchBindings } from '$lib/fighting/fightTouchHints'
  import { moveInputHint } from '$lib/fighting/fightControlHints'
  import { fightSpecialPresentation } from '$lib/fighting/fightSpecialPresentation'
  import { moveForSlot, movesetFor } from '$lib/fighting/movesets'
  import { projectileProfile } from '$lib/fighting/projectiles'
  import type { AttackKind, FightInput, FightState } from '$lib/fighting/types'
  import './fightTouchControls.css'
  export let state: FightState
  export let onMoves: (() => void) | undefined = undefined
  export let language: 'fr' | 'en'
  export let onAttack: (kind: AttackKind) => void
  export let onThrow: () => void
  export let onCall: () => void
  export let onEmperor: () => void = () => {}
  export let onFinisher: () => void
  export let onControl: (key: keyof FightInput, held: boolean) => void
  $: fr = language === 'fr'
  $: special = fightSpecialPresentation(state, language)
  $: shot = projectileProfile(state.player.id)
  $: finisher = moveForSlot(state.player.id, 'finisher')
</script>

<div
  class="touch-controls"
  role="group"
  aria-label={fr ? 'Commandes tactiles' : 'Touch controls'}
  oncontextmenu={(event) => event.preventDefault()}
>
  <div class="touch-movement">
    <FightDirectionPad {language} {onControl} />
    <div class="touch-defense">
      <FightHeldButton
        label={fr ? 'Garde' : 'Block'}
        onHold={(active) => onControl('guard', active)}>{fr ? 'Garde' : 'Block'}</FightHeldButton
      >
      <FightHeldButton
        label={fr ? 'Maintenir Aura' : 'Hold aura'}
        onHold={(active) => onControl('aura', active)}>Aura</FightHeldButton
      >
    </div>
  </div>
  <FightTouchTools {state} {language} {onControl} {onEmperor} {onCall} {onMoves} />
  <div
    class="touch-attacks"
    role="group"
    aria-label={fr ? 'Attaques et combos' : 'Attacks and combos'}
  >
    <FightTouchButton label={fr ? 'Coup léger' : 'Light attack'} onPress={() => onAttack('light')}
      >{fr ? 'Léger' : 'Light'}</FightTouchButton
    >
    <FightTouchButton
      label={fr ? 'Coup lourd' : 'Heavy attack'}
      className="heavy-button"
      onPress={() => onAttack('heavy')}>{fr ? 'Lourd' : 'Heavy'}</FightTouchButton
    >
    <FightTouchButton label={fr ? 'Projection / déprojection — maintenir Aura pour une super projection' : 'Throw / tech — hold Aura for a super throw'} onPress={onThrow}
      >{fr ? 'Proj.' : 'Throw'}</FightTouchButton
    >
    <FightTouchButton
      label={fr ? shot.labelFr : shot.labelEn}
      className="ranged-button"
      onPress={() => onAttack('ranged')}>{fr ? 'Tir' : 'Shot'}</FightTouchButton
    >
    {#if state.player.id !== 'camilla'}
      <FightHeldButton
        className="special-button"
        label={moveInputHint(special.hint, fightTouchBindings(language))}
        onHold={(active) => onControl('hatsu', active)}
        onCommit={() => onAttack('special')}>Hatsu</FightHeldButton
      >
    {/if}
    {#if movesetFor(state.player.id) && finisher}
      <FightTouchButton
        label={fr ? finisher.nameFr : finisher.nameEn}
        className="finisher-button"
        onPress={onFinisher}>{fr ? 'Ultime' : 'Super'}</FightTouchButton
      >
    {/if}
  </div>
</div>
