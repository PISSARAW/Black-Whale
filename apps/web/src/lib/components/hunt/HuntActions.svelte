<script lang="ts">
  import ModeCommand from '$lib/components/game/ModeCommand.svelte'
  import { HUNT_PAGE_KEYS } from '$lib/hunt/manualControls'
  import type { HuntHatsuId } from '$lib/hunt/hatsu'

  interface Props {
    canLay: boolean
    canTake: boolean
    hatsuDisabled: boolean
    hatsuId: HuntHatsuId
    labels: {
      sweep: string
      zetsu: string
      ten: string
      lay: string
      take: string
      hint: string
      hatsu: Record<HuntHatsuId, string>
    }
    onLay: () => void
    onTake: () => void
    onHatsu: () => void
  }

  let { canLay, canTake, hatsuDisabled, hatsuId, labels, onLay, onTake, onHatsu }: Props = $props()
</script>

<nav
  class="mode-hud mode-hud-actions hunt-actions absolute right-3 z-20 max-w-[calc(100%-1.5rem)] justify-end"
  aria-label={labels.hint}
>
  {#if hatsuId === 'bungee-gum'}
    <ModeCommand
      label={labels.lay}
      shortcut={canTake ? `${HUNT_PAGE_KEYS.lay.slice(3)} L H` : 'F V L H'}
      keyLabel={canTake ? 'V' : 'F'}
      disabled={!canLay}
      onclick={onLay}
    />
  {/if}
  {#if canTake}
    <ModeCommand
      label={labels.take}
      shortcut={`F ${HUNT_PAGE_KEYS.take.slice(3)}`}
      keyLabel="F"
      onclick={onTake}
    />
  {/if}
  {#if hatsuId !== 'bungee-gum'}
    <ModeCommand
      label={labels.hatsu[hatsuId]}
      shortcut="L H"
      keyLabel="L"
      primary
      disabled={hatsuDisabled}
      onclick={onHatsu}
    />
  {/if}
</nav>

<style>
  .hunt-actions {
    bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
  @media (pointer: coarse) {
    .hunt-actions {
      bottom: calc(11.25rem + env(safe-area-inset-bottom));
    }
  }
</style>
