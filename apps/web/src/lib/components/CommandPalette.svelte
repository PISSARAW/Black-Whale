<script lang="ts">
  import { goto } from '$app/navigation'
  import { tick } from 'svelte'

  let { open = $bindable(false) }: { open?: boolean } = $props()
  let query = $state('')
  let input = $state<HTMLInputElement>()

  const destinations = [
    { href: '/ship', label: 'Explore the Black Whale', group: 'Primary', code: 'E' },
    { href: '/timeline', label: 'Open the timeline', group: 'Primary', code: 'T' },
    { href: '/characters', label: 'Search the passenger registry', group: 'Primary', code: 'C' },
    { href: '/perspectives', label: 'Inspect character knowledge', group: 'Primary', code: 'K' },
    { href: '/abilities', label: 'Browse the ability archive', group: 'Dossier', code: 'A' },
    { href: '/compare', label: 'Compare perspectives', group: 'Dossier', code: 'P' },
    { href: '/relationships', label: 'View the faction network', group: 'Dossier', code: 'F' },
    { href: '/simulations', label: 'Run simulations', group: 'Dossier', code: 'S' },
  ]

  let results = $derived(
    destinations.filter((item) =>
      `${item.label} ${item.group}`.toLowerCase().includes(query.trim().toLowerCase()),
    ),
  )

  async function show() {
    open = true
    query = ''
    await tick()
    input?.focus()
  }

  function close() {
    open = false
    query = ''
  }

  function navigate(href: string) {
    close()
    goto(href)
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      if (open) close()
      else show()
    } else if (event.key === 'Escape' && open) {
      close()
    }
  }

  function handleInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && results[0]) navigate(results[0].href)
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) close()
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

{#if open}
  <div class="command-backdrop" role="presentation" onclick={handleBackdropClick}>
    <div
      class="command-dialog"
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-label="Quick navigation"
    >
      <div class="command-search">
        <span aria-hidden="true">⌕</span>
        <label class="sr-only" for="command-query">Search site destinations</label>
        <input
          id="command-query"
          bind:this={input}
          bind:value={query}
          onkeydown={handleInputKeydown}
          placeholder="Where do you want to go?"
          autocomplete="off"
        />
        <kbd>ESC</kbd>
      </div>

      <div class="command-results" aria-live="polite">
        {#if results.length}
          {#each results as item, index (item.href)}
            <button type="button" class:featured={index === 0} onclick={() => navigate(item.href)}>
              <span class="command-code">{item.code}</span>
              <span><strong>{item.label}</strong><small>{item.group}</small></span>
              <i aria-hidden="true">↗</i>
            </button>
          {/each}
        {:else}
          <div class="command-empty">No destination matches “{query}”.</div>
        {/if}
      </div>

      <footer><span>Enter to open first result</span><span>⌘K anywhere</span></footer>
    </div>
  </div>
{/if}

<style>
  .command-backdrop {
    position: fixed;
    z-index: 150;
    inset: 0;
    display: grid;
    place-items: start center;
    padding: clamp(5rem, 13vh, 8rem) 1rem 1rem;
    background: rgba(2, 5, 7, 0.72);
    backdrop-filter: blur(14px);
    animation: fade 0.18s ease-out;
  }
  .command-dialog {
    width: min(42rem, 100%);
    overflow: hidden;
    border: 1px solid var(--line-strong);
    border-radius: 0.9rem;
    background: rgba(11, 17, 21, 0.98);
    box-shadow:
      0 40px 120px rgba(0, 0, 0, 0.65),
      0 0 60px rgba(200, 169, 86, 0.08);
    animation: enter 0.35s var(--ease-expo);
  }
  .command-search {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.8rem;
    padding: 1.1rem 1.2rem;
    border-bottom: 1px solid var(--line-default);
  }
  .command-search > span {
    color: var(--accent-gold);
    font-size: 1.35rem;
  }
  input {
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text-primary);
    font: 500 1.05rem/1.3 var(--font-sans);
  }
  input::placeholder {
    color: var(--text-faint);
  }
  kbd {
    padding: 0.25rem 0.35rem;
    border: 1px solid var(--line-default);
    border-radius: 0.25rem;
    color: var(--text-faint);
    font: 0.52rem/1 var(--font-mono);
  }
  .command-results {
    max-height: min(28rem, 58vh);
    overflow-y: auto;
    padding: 0.5rem;
  }
  .command-results button {
    display: grid;
    width: 100%;
    grid-template-columns: 2rem 1fr auto;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem;
    border: 0;
    border-radius: 0.5rem;
    background: transparent;
    color: var(--text-secondary);
    text-align: left;
    cursor: pointer;
  }
  .command-results button:hover,
  .command-results button.featured {
    background: rgba(200, 169, 86, 0.08);
    color: var(--text-primary);
  }
  .command-code {
    display: grid;
    width: 1.8rem;
    height: 1.8rem;
    place-items: center;
    border: 1px solid var(--line-default);
    border-radius: 50%;
    color: var(--accent-gold);
    font: 0.58rem/1 var(--font-mono);
  }
  button > span:nth-child(2) {
    display: grid;
    gap: 0.15rem;
  }
  strong {
    font: 500 0.95rem/1.2 var(--font-display);
    letter-spacing: 0.01em;
  }
  small {
    color: var(--text-faint);
    font: 0.52rem/1.2 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  i {
    color: var(--accent-gold);
    font-style: normal;
  }
  .command-empty {
    padding: 3rem 1rem;
    color: var(--text-muted);
    text-align: center;
  }
  footer {
    display: flex;
    justify-content: space-between;
    padding: 0.65rem 1rem;
    border-top: 1px solid var(--line-subtle);
    color: var(--text-faint);
    font: 0.5rem/1 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes enter {
    from {
      opacity: 0;
      transform: translateY(-1rem) scale(0.98);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .command-backdrop,
    .command-dialog {
      animation: none;
    }
  }
</style>
