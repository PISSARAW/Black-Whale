<script lang="ts">
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
    <button
      type="button"
      disabled={control.key === 'en' && (!fighter || enProfile(fighter).radiusUnits === null)}
      title={control.key === 'en' && fighter ? enDescription(fighter, language) : control.label}
      onpointerdown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        onControl(control.key, true)
      }}
      onpointerup={() => onControl(control.key, false)}
      onpointercancel={() => onControl(control.key, false)}
      onlostpointercapture={() => onControl(control.key, false)}
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.stopPropagation()
          onControl(control.key, true)
        }
      }}
      onkeyup={(event) => {
        event.stopPropagation()
        onControl(control.key, false)
      }}
      onblur={() => onControl(control.key, false)}
      ><kbd>{control.shortcut}</kbd>
      {control.label.includes('/')
        ? control.label.split(' / ')[language === 'fr' ? 0 : 1]
        : control.label}</button
    >
  {/each}
</div>

<style>
  .tactics {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  button {
    min-height: 44px;
    padding: 0.35rem 0.55rem;
    border: 1px solid #6b8a9a;
    border-radius: 3px;
    background: #14232d;
    color: #e8f5fc;
    font: inherit;
    touch-action: none;
  }
  button:active {
    background: #285469;
  }
  button:focus-visible {
    outline: 2px solid #e7ca7c;
    outline-offset: 2px;
  }
  kbd {
    color: #e7ca7c;
    font: inherit;
  }
</style>
