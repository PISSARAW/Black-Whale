<script lang="ts">
  import MangaIcon from '$lib/components/icons/MangaIcon.svelte'
  import type { MangaIconName } from '$lib/components/icons/mangaIcons'
  import {
    mapState,
    type BeyondLineageFilter,
    type MapEntityFilter,
  } from '$lib/state/mapState.svelte'
  import { t } from '$lib/i18n'
  import type { BeyondLineageStatus } from '$lib/beyondLineage'

  let { characters }: { characters: { beyondLineage?: BeyondLineageStatus }[] } = $props()
  const entityTypes: MapEntityFilter[] = ['all', 'characters', 'objects']
  const factions = ['princes', 'guards', 'hunters', 'spider', 'mafia'] as const
  const factionIcons: Record<(typeof factions)[number], MangaIconName> = {
    princes: 'crown',
    guards: 'shield',
    hunters: 'hunter',
    spider: 'spider',
    mafia: 'factions',
  }
  let lineageStatuses = $derived(
    (['confirmed', 'suspected'] as BeyondLineageStatus[]).filter((status) =>
      characters.some((character) => character.beyondLineage === status),
    ),
  )
  let lineageFilters: BeyondLineageFilter[] = $derived(['all', 'any', ...lineageStatuses])
</script>

<section class="filter-group">
  <h3>{$t.ship.entityFilter.label}</h3>
  <div class="segments" role="group" aria-label={$t.ship.entityFilter.filterLabel}>
    {#each entityTypes as filter (filter)}
      <button
        class:active={mapState.filters.entityType === filter}
        aria-pressed={mapState.filters.entityType === filter}
        onclick={() => mapState.setEntityTypeFilter(filter)}>{$t.ship.entityFilter[filter]}</button
      >
    {/each}
  </div>
</section>

{#if mapState.filters.entityType !== 'objects'}
  <section class="filter-group">
    <h3>
      {$t.ship.factionsLabel}<small
        >{$t.ship.factionsActive(mapState.filters.factions.length)}</small
      >
    </h3>
    <div class="factions">
      {#each factions as faction (faction)}
        <label>
          <input
            type="checkbox"
            checked={mapState.filters.factions.includes(faction)}
            onchange={() => mapState.toggleFactionFilter(faction)}
          />
          <MangaIcon name={factionIcons[faction]} /> {$t.ship.factions[faction]}
        </label>
      {/each}
    </div>
  </section>
  {#if lineageStatuses.length}
    <section class="filter-group">
      <h3>{$t.ship.beyondLineage.label}</h3>
      <div class="segments wrap" role="group" aria-label={$t.ship.beyondLineage.filterLabel}>
        {#each lineageFilters as filter (filter)}
          <button
            class:active={mapState.filters.beyondLineage === filter}
            aria-pressed={mapState.filters.beyondLineage === filter}
            onclick={() => mapState.setBeyondLineageFilter(filter)}
            >{$t.ship.beyondLineage[filter]}</button
          >
        {/each}
      </div>
      <p>{$t.ship.beyondLineage.note}</p>
    </section>
  {/if}
{/if}

<button class="reset" onclick={() => mapState.resetFilters()}>{$t.ship.workspace.reset}</button>

<style>
  .filter-group {
    margin-bottom: 1.5rem;
  }
  h3 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin: 0 0 0.65rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-primary);
  }
  small,
  p {
    color: var(--text-muted);
    font-size: 0.7rem;
    font-weight: 400;
  }
  p {
    line-height: 1.65;
    margin-bottom: 0;
  }
  .segments {
    display: flex;
    gap: 0.3rem;
  }
  .wrap {
    flex-wrap: wrap;
  }
  button {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 0.35rem;
    padding: 0.5rem 0.7rem;
    color: var(--text-secondary);
    background: transparent;
    font-size: 0.75rem;
    cursor: pointer;
  }
  button.active {
    border-color: var(--accent-gold-dim);
    background: rgba(200, 169, 86, 0.1);
    color: var(--accent-gold-bright);
  }
  .segments button {
    flex: 1;
  }
  .factions {
    display: grid;
  }
  label {
    display: flex;
    gap: 0.7rem;
    align-items: center;
    min-height: 44px;
    color: var(--text-secondary);
    font-size: 0.8rem;
    cursor: pointer;
  }
  input {
    width: 1rem;
    height: 1rem;
    accent-color: var(--accent-gold);
  }
  .reset {
    width: 100%;
  }
  button:hover {
    border-color: var(--accent-gold);
  }
  button:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--accent-gold);
    outline-offset: 2px;
  }
</style>
