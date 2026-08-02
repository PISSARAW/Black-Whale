<script lang="ts">
  import type { AdvancedNenState } from '$lib/hunt/nen/advanced'

  interface Props {
    state: AdvancedNenState
    locale: string
    canShu: boolean
    onRen: () => void
    onShu: () => void
  }
  let { state, locale, canShu, onRen, onShu }: Props = $props()
  const fr = () => locale === 'fr'
</script>

<nav class="absolute bottom-16 left-3 z-20 flex gap-2 sm:bottom-6 sm:left-6" aria-label={fr() ? 'Nen avancé' : 'Advanced Nen'}>
  <button class="advanced-action" class:active={state.ren} aria-pressed={state.ren} onclick={onRen}>
    <kbd>N</kbd><span>Ren</span>
  </button>
  <button class="advanced-action" class:active={state.shuItem !== null} disabled={!canShu} onclick={onShu}>
    <kbd>U</kbd><span>Shu</span>
  </button>
  {#if state.wounds.length > 0}
    <span class="rounded-full border border-rose-300/30 bg-black/70 px-3 py-2 text-xs text-rose-200">
      {fr() ? 'Blessures' : 'Wounds'}: {state.wounds.length}
    </span>
  {/if}
</nav>

<style>
  .advanced-action { min-height: 2.75rem; border: 1px solid rgb(255 255 255 / .18); border-radius: 999px; background: rgb(0 0 0 / .72); padding: .45rem .8rem; color: rgb(255 255 255 / .75); font-size: .72rem; }
  .advanced-action.active { border-color: rgb(250 204 21 / .65); color: white; }
  .advanced-action:focus-visible { outline: 2px solid white; outline-offset: 2px; }
  .advanced-action:disabled { opacity: .3; }
  kbd { margin-right: .4rem; color: rgb(250 204 21); font: inherit; font-weight: 700; }
  @media (pointer: coarse) { kbd { display: none; } }
</style>
