<script lang="ts">
  import { onDestroy } from 'svelte'
  import { t } from '$lib/i18n'
  import { Fullscreen } from '$lib/tour/fullscreen.svelte'

  let { keyboard = true, shiftShortcut = false }: { keyboard?: boolean; shiftShortcut?: boolean } =
    $props()

  const screen = new Fullscreen()
  let button = $state<HTMLButtonElement | null>(null)
  const immersive = $derived(screen.immersive)

  $effect(() => screen.watch())
  $effect(() => {
    const host = button?.parentElement
    if (!host) return
    host.classList.add('tour-mode-host')
    host.classList.toggle('tour-mode-immersive', immersive)
    return () => host.classList.remove('tour-mode-host', 'tour-mode-immersive')
  })

  function toggle() {
    void screen.toggle()
  }

  function fullscreenKey(event: KeyboardEvent): boolean {
    if (!keyboard || event.key.toLowerCase() !== 'v') return false
    if (event.metaKey || event.ctrlKey || event.altKey) return false
    return !shiftShortcut || (event.shiftKey && !event.repeat && !event.defaultPrevented)
  }

  function onWindowKeydown(event: KeyboardEvent) {
    if (!fullscreenKey(event)) return
    const target = event.target
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable || target.closest('input, textarea, select') !== null)
    )
      return
    event.preventDefault()
    toggle()
  }

  onDestroy(() => screen.leave())
</script>

<svelte:window onkeydown={onWindowKeydown} />

<button
  bind:this={button}
  type="button"
  onclick={toggle}
  aria-pressed={immersive}
  aria-keyshortcuts={keyboard ? (shiftShortcut ? 'Shift+V' : 'V') : undefined}
  class="absolute right-3 top-3 z-[85] rounded border px-2.5 py-1 text-xs shadow-lg backdrop-blur-sm transition-colors {immersive
    ? 'border-[#FFD700] bg-[#050505]/90 text-[#FFD700]'
    : 'border-white/25 bg-black/70 text-white/75 hover:border-[#FFD700]/60 hover:text-[#FFD700]'}"
>
  {immersive ? $t.tour.fullscreen.exit : $t.tour.fullscreen.enter}
  {#if keyboard}<kbd class="ml-1 text-[10px] opacity-70">{shiftShortcut ? '⇧ V' : 'V'}</kbd>{/if}
</button>
