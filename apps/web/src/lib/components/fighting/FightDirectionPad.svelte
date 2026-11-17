<script lang="ts">
  import { onDestroy } from 'svelte'
  import { createFightTouchPad } from '$lib/fighting/fightTouchDirection'
  import type { FightInput } from '$lib/fighting/types'
  export let language: 'fr' | 'en'
  export let onControl: (key: keyof FightInput, active: boolean) => void
  let element: HTMLDivElement
  let x = 0
  let y = 0
  let pressed = false
  const pad = createFightTouchPad((key, active) => onControl(key, active))
  const directions = [
    { key: 'jump', text: '↑', fr: 'Sauter', en: 'Jump' },
    { key: 'left', text: '←', fr: 'Aller à gauche', en: 'Move left' },
    { key: 'right', text: '→', fr: 'Aller à droite', en: 'Move right' },
    { key: 'down', text: '↓', fr: 'Se baisser', en: 'Crouch' },
  ] as const
  function point(event: PointerEvent) {
    const rect = element.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((event.clientY - rect.top) / rect.height) * 2 - 1,
    }
  }
  function paint(event: PointerEvent) {
    const value = point(event)
    x = Math.max(-1, Math.min(1, value.x)) * 20
    y = Math.max(-1, Math.min(1, value.y)) * 20
  }
  function cancel() {
    pad.cancel()
    pressed = false
    x = 0
    y = 0
  }
  onDestroy(cancel)
</script>

<svelte:window onblur={cancel} />
<div
  class="direction-pad"
  class:pressed
  bind:this={element}
  role="group"
  aria-label={language === 'fr'
    ? 'Déplacements · glisser pour les diagonales'
    : 'Movement · slide for diagonals'}
  oncontextmenu={(event) => event.preventDefault()}
  onpointerdown={(event) => {
    if (event.button !== 0 || !pad.press(event.pointerId, point(event))) return
    event.preventDefault()
    element.setPointerCapture(event.pointerId)
    pressed = true
    paint(event)
  }}
  onpointermove={(event) => {
    if (!element.hasPointerCapture(event.pointerId)) return
    pad.move(event.pointerId, point(event))
    if (pressed) paint(event)
  }}
  onpointerup={(event) => {
    pad.release(event.pointerId)
    if (element.hasPointerCapture(event.pointerId)) cancel()
  }}
  onpointercancel={cancel}
  onlostpointercapture={cancel}
>
  {#each directions as direction (direction.key)}
    <button
      type="button"
      class={direction.key}
      aria-label={language === 'fr' ? direction.fr : direction.en}
      onkeydown={(event) => {
        if (event.key !== ' ' && event.key !== 'Enter') return
        event.preventDefault()
        onControl(direction.key, true)
      }}
      onkeyup={() => onControl(direction.key, false)}
      onblur={() => onControl(direction.key, false)}>{direction.text}</button
    >
  {/each}
  <span class="pad-thumb" aria-hidden="true" style={`transform:translate(${x}px,${y}px)`}></span>
</div>

<style>
  .direction-pad {
    position: relative;
    width: var(--pad-size, 144px);
    height: var(--pad-size, 144px);
    display: grid;
    grid-template: repeat(3, 1fr) / repeat(3, 1fr);
    touch-action: none;
    border-radius: 50%;
    background: #161321e6;
    border: 1px solid #ba9bd45c;
    box-shadow: 0 2px 12px #0006;
  }
  button {
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: 0;
    border-radius: 12px;
    color: #ece0f6;
    background: #72558745;
    font:
      1.5rem/1 Arial,
      sans-serif;
    touch-action: none;
  }
  button:focus-visible {
    outline: 2px solid #ffb38a;
  }
  .jump {
    grid-area: 1 / 2;
  }
  .left {
    grid-area: 2 / 1;
  }
  .right {
    grid-area: 2 / 3;
  }
  .down {
    grid-area: 3 / 2;
  }
  .pad-thumb {
    pointer-events: none;
    position: absolute;
    inset: 35%;
    border-radius: 50%;
    background: #b79aff59;
    border: 1px solid #cab2ef99;
  }
  .pressed .pad-thumb {
    background: #ff864bb3;
    border-color: #ffc4a2;
  }
</style>
