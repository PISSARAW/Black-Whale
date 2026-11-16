<script lang="ts">
  import { onDestroy } from 'svelte'
  import { createHeldFightControl } from '$lib/fighting/heldFightControl'
  export let className = ''
  export let label: string
  export let disabled = false
  export let onHold: (held: boolean) => void
  export let onCommit: (() => void) | undefined = undefined
  const held = createHeldFightControl({
    hold: (active) => onHold(active),
    commit: () => onCommit?.(),
  })
  $: if (disabled) held.cancel()
  onDestroy(() => held.cancel())
</script>

<svelte:window onblur={() => held.cancel()} />
<button
  type="button"
  class={className}
  aria-label={label}
  title={label}
  {disabled}
  onclick={(event) => {
    if (event.detail === 0) onCommit?.()
  }}
  onpointerdown={(event) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    held.press(`pointer:${event.pointerId}`)
  }}
  onpointerup={(event) => held.release(`pointer:${event.pointerId}`)}
  onpointercancel={() => held.cancel()}
  onlostpointercapture={() => held.cancel()}
  onblur={() => held.cancel()}
  onkeydown={(event) => {
    if (![' ', 'Enter'].includes(event.key)) return
    event.preventDefault()
    if (!event.repeat) held.press(`key:${event.key}`)
  }}
  onkeyup={(event) => {
    if (![' ', 'Enter'].includes(event.key)) return
    event.preventDefault()
    held.release(`key:${event.key}`)
  }}><slot /></button
>

<style>
  button {
    min-width: 44px;
    min-height: 44px;
    max-width: 100%;
    padding: 0.5rem 0.65rem;
    touch-action: none;
    color: white;
    background: #12212d;
    border: 1px solid #708a9c;
    border-radius: 6px;
    font: inherit;
    cursor: pointer;
  }
  button:active {
    background: #c7952d;
    color: #080a0c;
  }
  button:disabled {
    opacity: 0.55;
  }
  button:focus-visible {
    outline: 2px solid #f5d25c;
    outline-offset: 2px;
  }
</style>
