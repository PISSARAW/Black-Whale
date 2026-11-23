<script lang="ts">
  import FightHeldButton from './FightHeldButton.svelte'
  import FightNenGuide from './FightNenGuide.svelte'
  import { enProfile } from '$lib/fighting/en/profiles'
  import { enDescription } from '$lib/fighting/en/presentation'
  import type { ArcadeFighter, FightInput } from '$lib/fighting/types'
  export let fighter: ArcadeFighter | undefined = undefined
  export let language: 'fr' | 'en'
  export let onControl: (key: keyof FightInput, held: boolean) => void = () => {}
  const controls: { key: keyof FightInput; label: string }[] = [
    { key: 'en', label: 'En' },
    { key: 'shu', label: 'Shu' },
    { key: 'conceal', label: 'In' },
    { key: 'gyo', label: 'Gyo' },
    { key: 'zetsuIntent', label: 'Zetsu' },
    { key: 'onIntent', label: 'On' },
    { key: 'seiyakuIntent', label: 'Seiyaku' },
    { key: 'lowGyoIntent', label: 'Gyo faible / Low Gyo' },
    { key: 'focusHead', label: 'Tête / Head' },
    { key: 'focusTorso', label: 'Torse / Torso' },
    { key: 'focusHands', label: 'Mains / Hands' },
    { key: 'focusFeet', label: 'Jambes / Legs' },
  ]
</script>

<div
  class="tactics"
  aria-label={language === 'fr' ? 'Techniques Nen à maintenir' : 'Hold Nen techniques'}
>
  {#each controls as control (control.key)}
    <FightHeldButton
      label={control.key === 'en' && fighter
        ? enDescription(fighter, language)
        : control.label.includes('/')
          ? control.label.split(' / ')[language === 'fr' ? 0 : 1]
          : control.label}
      disabled={control.key === 'en' && (!fighter || enProfile(fighter).radiusUnits === null)}
      onHold={(active) => onControl(control.key, active)}
    >
      {control.label.includes('/')
        ? control.label.split(' / ')[language === 'fr' ? 0 : 1]
        : control.label}
    </FightHeldButton>
  {/each}
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
</style>
