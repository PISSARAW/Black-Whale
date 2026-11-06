<script lang="ts">
  import type { ComponentProps, Snippet } from 'svelte'
  import { tourWords } from '$lib/tour/workspaceWords'
  import TourPageSidebar from './TourPageSidebar.svelte'
  import TourSidebarNavigation from './TourSidebarNavigation.svelte'

  interface Props extends ComponentProps<typeof TourPageSidebar> {
    immersive: boolean
    panelOpen?: boolean
    children: Snippet
  }

  let {
    immersive,
    panelOpen = $bindable(false),
    navigation,
    hatsu,
    targets,
    controls,
    calm,
    provenance,
    children,
  }: Props = $props()
  let dialog = $state<HTMLDialogElement | null>(null)
  let opener: HTMLElement | null = null

  $effect(() => {
    if (!dialog) return
    if (panelOpen && !dialog.open) dialog.showModal()
    else if (!panelOpen && dialog.open) dialog.close()
  })

  function openOptions(event: MouseEvent) {
    opener = event.currentTarget as HTMLElement
    document.exitPointerLock?.()
    panelOpen = true
  }

  function closeOptions() {
    panelOpen = false
    if (!dialog?.open) opener?.focus({ preventScroll: true })
  }
</script>

<div class="tour-workspace" class:immersive data-hatsu-pass>
  <TourSidebarNavigation {...navigation} onOptions={openOptions} hasTechnique={Boolean(hatsu)} />
  <div class="scene-frame">{@render children()}</div>
</div>

<dialog
  data-hatsu-pass
  bind:this={dialog}
  class="tour-options"
  aria-label={$tourWords.options}
  onclose={closeOptions}
  oncancel={closeOptions}
  onkeydown={(event) => event.stopPropagation()}
  onclick={(event) => {
    if (event.target === dialog) closeOptions()
  }}
>
  <div class="options-sheet">
    <header>
      <h2 id="tour-options-title">{$tourWords.options}</h2>
      <button type="button" onclick={closeOptions}
        >{$tourWords.close} <span aria-hidden="true">×</span></button
      >
    </header>
    <TourPageSidebar {navigation} {hatsu} {targets} {controls} {calm} {provenance} />
  </div>
</dialog>

<style>
  .tour-workspace {
    max-width: 1800px;
    margin: auto;
    padding: 0 var(--page-gutter) 3rem;
  }
  .scene-frame {
    height: clamp(400px, 70svh, 900px);
    min-width: 0;
  }
  .immersive {
    position: fixed;
    inset: 0;
    z-index: 90;
    display: flex;
    flex-direction: column;
    height: 100dvh;
    max-width: none;
    padding: 0;
    background: #050505;
  }
  .immersive .scene-frame {
    flex: 1;
    min-height: 0;
    height: auto;
  }
  .tour-options {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text-primary);
  }
  .tour-options::backdrop {
    background: rgb(0 0 0 / 65%);
  }
  .options-sheet {
    position: absolute;
    top: 0;
    right: 0;
    width: min(440px, 100%);
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    border-left: 1px solid var(--line-default);
    background: #0c0d10;
    box-shadow: -20px 0 80px rgb(0 0 0 / 35%);
  }
  header {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--line-default);
    background: #0c0d10;
  }
  h2 {
    font-size: 1rem;
    font-weight: 600;
  }
  button {
    min-height: 44px;
    padding: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.8rem;
  }
  button:hover {
    color: var(--accent-gold-bright);
  }
  button span {
    margin-left: 0.75rem;
    font-size: 1.25rem;
  }
  @media (max-width: 600px) {
    .tour-workspace {
      padding: 0 0.6rem 1rem;
    }
    .immersive {
      padding: 0;
    }
    .scene-frame {
      height: max(420px, calc(100svh - 250px));
    }
  }
</style>
