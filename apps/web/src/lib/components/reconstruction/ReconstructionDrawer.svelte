<script lang="ts">
  import type { Snippet } from 'svelte'
  import { reconstructionWords } from '$lib/reconstruction/workspaceWords'

  let {
    title,
    open,
    onClose,
    opener,
    children,
  }: {
    title: string
    open: boolean
    onClose: () => void
    opener: HTMLElement | null
    children: Snippet
  } = $props()
  let dialog = $state<HTMLDialogElement | null>(null)

  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) {
      document.exitPointerLock?.()
      dialog.showModal()
    } else if (!open && dialog.open) dialog.close()
  })

  function closed() {
    onClose()
    opener?.focus({ preventScroll: true })
  }
</script>

<dialog
  bind:this={dialog}
  class="reconstruction-drawer"
  aria-label={title}
  data-hatsu-pass
  onclose={closed}
  oncancel={onClose}
  onkeydown={(event) => event.stopPropagation()}
  onclick={(event) => {
    if (event.target === dialog) onClose()
  }}
>
  <div class="sheet">
    <header>
      <h2>{title}</h2>
      <button type="button" onclick={onClose}
        >{$reconstructionWords.close} <span aria-hidden="true">×</span></button
      >
    </header>
    <div class="content">{@render children()}</div>
  </div>
</dialog>

<style>
  .reconstruction-drawer {
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
    color: #edf1ee;
  }
  .reconstruction-drawer::backdrop {
    background: #000a;
  }
  .sheet {
    position: absolute;
    right: 0;
    top: 0;
    display: flex;
    flex-direction: column;
    width: min(480px, 100%);
    height: 100%;
    border-left: 1px solid #343a3e;
    background: #0d1216;
    box-shadow: -20px 0 80px #0007;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #30383d;
  }
  h2 {
    font-size: 1rem;
    font-weight: 600;
  }
  button {
    min-height: 44px;
    padding: 0.5rem;
    color: #bfc8cb;
    font-size: 0.8rem;
  }
  button:hover {
    color: #e5c57a;
  }
  button span {
    margin-left: 0.75rem;
    font-size: 1.2rem;
  }
  .content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 1rem;
  }
</style>
