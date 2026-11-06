<script lang="ts">
  import { t } from '$lib/i18n'
  import { tourWords } from '$lib/tour/workspaceWords'
  import type { Snippet } from 'svelte'
  interface Props {
    extra?: Snippet
    tourist?: {
      available: boolean
      mangaViewLabel?: string
      mangaViewButtonLabel?: string
      onJumpToAngle?: () => void
      onTakePhoto: () => void
      onTakePhotoWithHud: () => void
    } | null
    gyo?: {
      active: boolean
      onToggle: () => void
    } | null
  }
  let { tourist = null, gyo = null, extra }: Props = $props()
</script>

<details class="scene-tools">
  <summary
    >{$tourWords.tools}{#if gyo?.active}
      · Gyo{/if}</summary
  >
  <div class="tool-actions">
    {@render extra?.()}
    {#if tourist?.available}
      {#if tourist.onJumpToAngle}
        <button
          type="button"
          onclick={tourist.onJumpToAngle}
          title={tourist.mangaViewLabel}
          aria-label={tourist.mangaViewLabel
            ? `${$t.tour.sceneOverlay.mangaAngle} — ${tourist.mangaViewLabel}`
            : $t.tour.sceneOverlay.mangaAngle}
          class="rounded border border-[#FFD700]/40 bg-[#050505]/80 px-2 py-1 text-xs text-[#FFD700]/80 transition-colors hover:border-[#FFD700]/70 hover:text-[#FFD700]"
        >
          {tourist.mangaViewButtonLabel ?? $t.tour.sceneOverlay.mangaAngle}
        </button>
      {/if}
      <div class="grid gap-2">
        <button
          type="button"
          onclick={tourist.onTakePhoto}
          title={$t.tour.sceneOverlay.photoPure}
          class="flex min-h-11 items-center justify-center rounded border border-[#FFD700]/40 bg-[#050505]/80 text-[10px] font-bold text-[#FFD700]/80 transition-colors hover:border-[#FFD700]/70 hover:text-[#FFD700]"
        >
          {$t.tour.sceneOverlay.photoPure}
        </button>
        <button
          type="button"
          onclick={tourist.onTakePhotoWithHud}
          title={$t.tour.sceneOverlay.photoWithInterface}
          class="flex min-h-11 items-center justify-center rounded border border-[#FFD700]/40 bg-[#050505]/80 text-[10px] font-bold text-[#FFD700]/80 transition-colors hover:border-[#FFD700]/70 hover:text-[#FFD700]"
        >
          {$t.tour.sceneOverlay.photoWithInterface}
        </button>
      </div>
    {/if}

    {#if gyo}
      <button
        type="button"
        onclick={gyo.onToggle}
        class="mt-2 flex items-center gap-2 rounded border border-[#FFD700]/40 px-2 py-1 text-xs transition-colors hover:border-[#FFD700]/70 {gyo.active
          ? 'bg-[#FFD700]/20 text-[#FFD700]'
          : 'bg-[#050505]/80 text-[#FFD700]/80'}"
        title={$t.tour.sceneOverlay.gyoTitle}
      >
        <span>{gyo.active ? '[Gyo]' : '[Nen]'}</span>
        {gyo.active ? $t.tour.sceneOverlay.gyoActive : $t.tour.sceneOverlay.gyoActivate}
      </button>
    {/if}
  </div>
</details>

<style>
  .scene-tools {
    position: absolute;
    right: 0.75rem;
    top: 0.75rem;
    z-index: 40;
    max-width: min(300px, calc(100% - 1.5rem));
    max-height: calc(100% - 1.5rem);
    overflow-y: auto;
    color: var(--text-secondary);
    font-size: 0.75rem;
  }
  summary {
    min-height: 44px;
    padding: 0.75rem;
    border: 1px solid #494337;
    border-radius: 4px;
    background: #111216;
    cursor: pointer;
  }
  .tool-actions {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    margin-top: 0.4rem;
    padding: 0.75rem;
    border: 1px solid var(--line-default);
    border-radius: 4px;
    background: #111216;
    box-shadow: 0 10px 40px #0009;
  }
  .tool-actions :global(button) {
    min-height: 44px;
    text-align: left;
    padding: 0.6rem;
  }
  .tool-actions :global(.concert) {
    position: static;
    width: 100%;
    box-shadow: none;
  }
</style>
