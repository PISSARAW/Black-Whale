<script lang="ts">
  import { t } from '$lib/i18n'
  import { tourWords } from '$lib/tour/workspaceWords'

  interface DeckOption {
    id: string
    label: string
    active: boolean
  }
  interface Props {
    onOptions?: (event: MouseEvent) => void
    hasTechnique?: boolean
    immersive: boolean
    reveal: boolean
    copied: 'idle' | 'done' | 'failed'
    decks: DeckOption[]
    onFullscreen: () => void
    onSelectDeck: (id: string) => void
    onOpenPlan: () => void
    onOpenFinder: () => void
    onToggleReveal: () => void
    onCopy: () => void
  }

  let props: Props = $props()
</script>

<nav class="tour-toolbar" aria-label={$tourWords.navigation}>
  <label class="deck-select">
    <span class="sr-only">{$t.tour.decks}</span>
    <select
      value={props.decks.find((deck) => deck.active)?.id ?? ''}
      onchange={(event) => props.onSelectDeck(event.currentTarget.value)}
    >
      {#each props.decks as deck (deck.id)}<option value={deck.id}>{deck.label}</option>{/each}
    </select>
  </label>
  <div class="toolbar-actions">
    <button type="button" class="plan-button" onclick={props.onOpenPlan}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16" /></svg
      >
      {$tourWords.plans}<kbd>M</kbd>
    </button>
    <button type="button" onclick={props.onOpenFinder}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg
      >
      {$t.tour.find.open}
    </button>
    <button type="button" onclick={props.onOptions} aria-haspopup="dialog">
      {#if props.hasTechnique}<span class="nen-dot" aria-hidden="true"></span>Nen ·
      {/if}{$tourWords.options}
    </button>
    <button
      type="button"
      class="fullscreen-button"
      onclick={props.onFullscreen}
      aria-pressed={props.immersive}
      aria-label={props.immersive ? $t.tour.fullscreen.exit : $t.tour.fullscreen.enter}
      title={props.immersive ? $t.tour.fullscreen.exit : $t.tour.fullscreen.enter}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
        ><path
          d={props.immersive
            ? 'M3 8h5V3m8 0v5h5M3 16h5v5m8 0v-5h5'
            : 'M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5'}
        /></svg
      >
    </button>
  </div>
</nav>

<style>
  .tour-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    padding: 0.6rem 0;
    color: var(--text-primary);
  }
  .deck-select {
    min-width: 0;
    flex: 0 1 260px;
  }
  select {
    width: 100%;
    min-height: 44px;
    padding: 0.5rem 2rem 0.5rem 0.7rem;
    border: 1px solid var(--line-default);
    border-radius: 4px;
    background: var(--surface-deep);
    color: var(--text-primary);
    font-size: 0.85rem;
  }
  .toolbar-actions {
    display: flex;
    gap: 0.4rem;
  }
  button {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 0.85rem;
    border: 1px solid var(--line-default);
    border-radius: 4px;
    background: var(--surface-deep);
    color: var(--text-secondary);
    font-size: 0.8rem;
    white-space: nowrap;
  }
  button:hover {
    color: var(--text-primary);
    border-color: var(--accent-gold-bright);
  }
  .plan-button {
    color: var(--accent-gold-bright);
    border-color: #75622b;
    background: #242116;
  }
  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
  kbd {
    margin-left: 0.4rem;
    opacity: 0.55;
    font-size: 0.65rem;
  }
  .nen-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-gold-bright);
  }
  :global(.immersive) .tour-toolbar {
    padding: 0.5rem 0.8rem;
    border-bottom: 1px solid var(--line-default);
  }
  @media (max-width: 600px) {
    .deck-select {
      flex: 1 1 100%;
    }
    .toolbar-actions {
      width: 100%;
    }
    button {
      flex: 1;
      padding: 0.5rem 0.6rem;
    }
    .fullscreen-button {
      flex: 0 0 44px;
    }
    kbd {
      display: none;
    }
  }
</style>
