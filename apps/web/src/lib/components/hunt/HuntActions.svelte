<script lang="ts">
  import type { NenState } from '$lib/hunt/nen/states'
  import type { HuntHatsuId } from '$lib/hunt/hatsu'

  interface Props {
    nen: NenState
    canSweep: boolean
    canLay: boolean
    canTake: boolean
    hatsuId: HuntHatsuId
    canHatsu: boolean
    labels: {
      sweep: string
      zetsu: string
      ten: string
      lay: string
      take: string
      hint: string
      hatsu: Record<HuntHatsuId, string>
    }
    onSweep: () => void
    onToggleNen: () => void
    onLay: () => void
    onTake: () => void
    onHatsu: () => void
  }

  let {
    nen,
    canSweep,
    canLay,
    canTake,
    hatsuId,
    canHatsu,
    labels,
    onSweep,
    onToggleNen,
    onLay,
    onTake,
    onHatsu,
  }: Props = $props()
</script>

<nav
  class="absolute inset-x-0 bottom-3 z-20 flex flex-wrap justify-center gap-2 px-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md sm:justify-end"
  aria-label={labels.hint}
>
  <button class="hunt-action" disabled={!canSweep} onclick={onSweep}>
    <kbd>F</kbd><span>{labels.sweep}</span>
  </button>
  <button class="hunt-action" class:active={nen === 'zetsu'} onclick={onToggleNen}>
    <kbd>X</kbd><span>{nen === 'zetsu' ? labels.ten : labels.zetsu}</span>
  </button>
  {#if hatsuId === 'bungee-gum'}
    <button class="hunt-action" disabled={!canLay} onclick={onLay}>
      <kbd>V</kbd><span>{labels.lay}</span>
    </button>
  {:else}
    <button class="hunt-action hatsu" disabled={!canHatsu} onclick={onHatsu}>
      <kbd>H</kbd><span>{labels.hatsu[hatsuId]}</span>
    </button>
  {/if}
  {#if canTake}
    <button class="hunt-action active" onclick={onTake}>
      <kbd>R</kbd><span>{labels.take}</span>
    </button>
  {/if}
</nav>

<style>
  .hunt-action {
    display: flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid rgb(255 255 255 / 0.18);
    border-radius: 9999px;
    background: rgb(0 0 0 / 0.72);
    padding: 0.45rem 0.8rem;
    color: rgb(255 255 255 / 0.78);
    font-size: 0.72rem;
    backdrop-filter: blur(10px);
  }

  .hunt-action:hover:not(:disabled),
  .hunt-action.active {
    border-color: rgb(125 211 252 / 0.65);
    color: white;
  }

  .hunt-action:disabled {
    opacity: 0.3;
  }
  .hunt-action.hatsu {
    border-color: rgb(196 181 253 / 0.4);
  }
  kbd {
    color: rgb(125 211 252);
    font: inherit;
    font-weight: 700;
  }
  @media (pointer: coarse) {
    kbd {
      display: none;
    }
  }
</style>
