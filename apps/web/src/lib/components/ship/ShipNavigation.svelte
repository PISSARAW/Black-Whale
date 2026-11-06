<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'
  import { t } from '$lib/i18n'

  const levels = [
    ['tier-1', 'tier-1-b', 'tier-1-c'],
    ['tier-2'],
    ['tier-3', 'tier-3-b', 'tier-3-c'],
    ['tier-4', 'tier-4-b'],
    ['tier-5', 'tier-5-b'],
  ]
  let activeLevel = $derived(
    levels.findIndex((decks) => decks.includes(mapState.selectedTier || '')),
  )
  let activeDecks = $derived(levels[activeLevel] || [])
  let profiles = $derived($t.ship.tiers as Record<string, { title: string; subtitle: string }>)

  function selectLevel(index: number) {
    if (activeLevel !== index) mapState.selectTier(levels[index][0])
  }
</script>

<div class="deck-navigation">
  <nav class="levels" aria-label={$t.ship.decksNavLabel}>
    <button
      class:active={mapState.currentZoomLevel === 'OVERVIEW'}
      aria-current={mapState.currentZoomLevel === 'OVERVIEW' ? 'page' : undefined}
      onclick={() => mapState.selectTier(null)}>{$t.ship.overview}</button
    >
    {#each levels as decks, index (decks[0])}
      <button
        class:active={activeLevel === index}
        aria-current={activeLevel === index ? 'page' : undefined}
        title={$t.ship.tierSummaries[index]}
        onclick={() => selectLevel(index)}>{$t.ship.workspace.level(index + 1)}</button
      >
    {/each}
  </nav>
  <div class="deck-row">
    {#if activeDecks.length}
      <nav class="decks" aria-label={$t.ship.workspace.decks}>
        {#each activeDecks as deck, index (deck)}
          <button
            class:active={mapState.selectedTier === deck}
            aria-current={mapState.selectedTier === deck ? 'page' : undefined}
            title={profiles[deck].subtitle}
            onclick={() => mapState.selectTier(deck)}
          >
            <span>{activeLevel + 1}{activeDecks.length > 1 ? `·${'ABC'[index]}` : ''}</span>
            {profiles[deck].title}
          </button>
        {/each}
      </nav>
    {:else}
      <p>{$t.ship.workspace.chooseDeck}</p>
    {/if}
  </div>
</div>

<style>
  .deck-navigation {
    min-width: 0;
    border-bottom: 1px solid var(--line);
  }
  nav {
    display: flex;
    gap: 0.25rem;
    min-width: 0;
    overflow-x: auto;
  }
  .levels {
    padding: 0.5rem 0.75rem 0;
  }
  button {
    flex-shrink: 0;
    min-height: 44px;
    padding: 0.65rem 1rem;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.8rem;
    cursor: pointer;
  }
  button:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }
  .levels button {
    border-bottom: 2px solid transparent;
    border-radius: 0.35rem 0.35rem 0 0;
  }
  .levels button.active {
    border-bottom-color: var(--accent-gold);
    color: var(--accent-gold-bright);
    background: rgba(200, 169, 86, 0.07);
  }
  .deck-row {
    min-height: 3.25rem;
    display: flex;
    align-items: center;
    padding: 0.35rem 0.75rem;
  }
  .deck-row p {
    margin: 0;
    padding: 0.5rem 1rem;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .decks button {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-height: 40px;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
  .decks button.active {
    background: rgba(200, 169, 86, 0.1);
    color: var(--text-primary);
  }
  .decks span {
    color: var(--accent-gold);
    font: 0.65rem var(--font-mono);
  }
  button:focus-visible {
    outline: 2px solid var(--accent-gold);
    outline-offset: -2px;
  }
  @media (max-width: 600px) {
    .levels {
      display: grid;
      grid-template-columns: 1.5fr repeat(5, minmax(0, 1fr));
      padding-inline: 0.35rem;
      gap: 0;
    }
    .levels button {
      flex: 1;
      padding-inline: 0.2rem;
      font-size: 0.65rem;
    }
    .deck-row {
      padding-inline: 0.35rem;
    }
    .deck-row p {
      padding-inline: 0.5rem;
      font-size: 0.7rem;
    }
  }
</style>
