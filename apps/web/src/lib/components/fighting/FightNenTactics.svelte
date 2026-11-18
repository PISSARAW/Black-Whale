<script lang="ts">
  import FightNenApplications from './FightNenApplications.svelte'
  import FightNenGuide from './FightNenGuide.svelte'
  import FightHeldButton from './FightHeldButton.svelte'
  import { enProfile } from '$lib/fighting/en/profiles'
  import { enDescription } from '$lib/fighting/en/presentation'
  import type { ArcadeFighter, FightInput } from '$lib/fighting/types'
  export let fighter: ArcadeFighter | undefined = undefined
  export let language: 'fr' | 'en'
  export let onControl: (key: keyof FightInput, held: boolean) => void = () => {}
  const controls: { key: keyof FightInput; shortcut: string; label: string }[] = [
    { key: 'en', shortcut: 'R', label: 'En' },
    { key: 'shu', shortcut: 'F', label: 'Shu' },
    { key: 'conceal', shortcut: 'X', label: 'In' },
    { key: 'gyo', shortcut: 'G', label: 'Gyo' },
    { key: 'focusHead', shortcut: '1', label: 'Tête / Head' },
    { key: 'focusTorso', shortcut: '2', label: 'Torse / Torso' },
    { key: 'focusHands', shortcut: '3', label: 'Mains / Hands' },
    { key: 'focusFeet', shortcut: '4', label: 'Jambes / Legs' },
  ]
</script>

<div
  class="tactics"
  aria-label={language === 'fr' ? 'Techniques Nen à maintenir' : 'Hold Nen techniques'}
>
  {#each controls as control (control.key)}
    <FightHeldButton
      disabled={control.key === 'en' && (!fighter || enProfile(fighter).radiusUnits === null)}
      label={control.key === 'en' && fighter
        ? enDescription(fighter, language)
        : control.label.includes('/')
          ? control.label.split(' / ')[language === 'fr' ? 0 : 1]
          : control.label}
      onHold={(active) => onControl(control.key, active)}
    >
      <kbd>{control.shortcut}</kbd>
      {control.label.includes('/')
        ? control.label.split(' / ')[language === 'fr' ? 0 : 1]
        : control.label}
    </FightHeldButton>
  {/each}
  {#if fighter}<FightNenApplications {fighter} {language} {onControl} />{/if}
  <FightNenGuide {language} />
</div>

<style>
  .tactics {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .tactics :global(button) {
    min-height: 44px;
    padding: 0.35rem 0.55rem;
    border: 1px solid #6b8a9a;
    border-radius: 3px;
    background: #14232d;
    color: #e8f5fc;
    font: inherit;
    touch-action: none;
  }
  .tactics :global(button:active) {
    background: #285469;
  }
  .tactics :global(button:focus-visible) {
    outline: 2px solid #e7ca7c;
    outline-offset: 2px;
  }
  kbd {
    color: #e7ca7c;
    font: inherit;
  }
</style>
