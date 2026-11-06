<script lang="ts">
  import MangaIcon from '$lib/components/icons/MangaIcon.svelte'
  import type { PageData } from './$types'
  import Seo from '$lib/components/Seo.svelte'
  import { breadcrumbSchema, collectionSchema } from '$lib/seo/schema'
  import { link, t } from '$lib/i18n'
  import type { BeyondLineageStatus } from '$lib/beyondLineage'

  let { data }: { data: PageData } = $props()
  type Character = PageData['characters'][number]
  let query = $state('')
  // Sentinel for "no faction filter", kept out of the copy so the comparison
  // below does not depend on the active language.
  const ALL_FACTIONS = '*'
  let activeFaction = $state(ALL_FACTIONS)

  // Beyond's lineage cuts across factions — a marked guard and a suspected
  // prince never share one — so it is a second axis rather than another faction
  // chip. The server drops the field past the reader's spoiler cap, so an
  // absent lineage here means "not one of them, as far as this reader knows".
  const ANY_LINEAGE = 'any'
  type LineageFilter = 'all' | typeof ANY_LINEAGE | BeyondLineageStatus
  let activeLineage = $state<LineageFilter>('all')
  const lineageOf = (character: Character): BeyondLineageStatus | undefined =>
    character.beyondLineage?.status
  // The whole control disappears rather than sitting there empty: an always-on
  // chip would tell a spoiler-capped reader that there is something to reveal.
  let lineageAvailable = $derived(data.characters.some((character) => lineageOf(character)))
  let lineageFilters: LineageFilter[] = $derived([
    'all',
    ANY_LINEAGE,
    ...(['confirmed', 'suspected'] as BeyondLineageStatus[]).filter((status) =>
      data.characters.some((character) => lineageOf(character) === status),
    ),
  ])
  let lineageLabel = $derived((filter: LineageFilter) =>
    filter === 'all' ? $t.registry.beyondLineage.all : $t.registry.beyondLineage[filter],
  )
  let lineageBadge = $derived((status: BeyondLineageStatus) =>
    status === 'confirmed'
      ? $t.registry.beyondLineage.badgeConfirmed
      : $t.registry.beyondLineage.badgeSuspected,
  )

  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  // Groups are keyed on a language-independent form of the faction id, so the
  // classification below and the active filter keep working in every locale.
  // Only the rendering of that key is translated.
  const factionKey = (value?: string | null) =>
    value ? value.replace(/^prince-/, 'faction ').replaceAll('-', ' ') : 'independent'

  let factionLabel = $derived((key: string) => {
    if (key === 'independent') return $t.registry.independent
    if (key.startsWith('faction '))
      return `${$t.registry.factionPrefix}${key.slice('faction '.length)}`
    return key
  })

  // Sorted on the translated label so the filter row reads alphabetically in
  // whichever language is on screen.
  let factions: string[] = $derived([
    ALL_FACTIONS,
    ...Array.from(
      new Set<string>(data.characters.map((character) => factionKey(character.factionId))),
    ).sort((a, b) => factionLabel(a).localeCompare(factionLabel(b), $t.common.intlLocale)),
  ])
  let filteredCharacters = $derived(
    data.characters.filter((character) => {
      const faction = factionKey(character.factionId)
      const matchesFaction = activeFaction === ALL_FACTIONS || faction === activeFaction
      const lineage = lineageOf(character)
      const matchesLineage =
        activeLineage === 'all' ||
        (activeLineage === ANY_LINEAGE ? Boolean(lineage) : lineage === activeLineage)
      const haystack = normalize(
        `${character.canonicalName} ${(character.aliases || []).join(' ')} ${character.description || ''} ${faction} ${factionLabel(faction)}${lineage ? ` ${lineageBadge(lineage)}` : ''}`,
      )
      return matchesFaction && matchesLineage && haystack.includes(normalize(query.trim()))
    }),
  )

  let charactersByFaction: Record<string, Character[]> = $derived(
    filteredCharacters.reduce((acc: Record<string, Character[]>, character) => {
      const faction = factionKey(character.factionId)
      ;(acc[faction] ||= []).push(character)
      return acc
    }, {}),
  )
</script>

<Seo
  title={$t.registry.seoTitle}
  description={$t.registry.seoDescription((data.characters ?? []).length)}
  jsonLd={[
    collectionSchema({
      name: $t.registry.collectionName,
      path: $link('/characters'),
      description: $t.registry.collectionDescription,
      items: (data.characters ?? []).map((character: { id: string; canonicalName: string }) => ({
        name: character.canonicalName,
        path: $link(`/characters/${character.id}`),
      })),
    }),
    breadcrumbSchema([
      { name: $t.common.home, path: $link('/') },
      { name: $t.nav.characters, path: $link('/characters') },
    ]),
  ]}
/>

<div class="registry-page">
  <header class="registry-hero">
    <div>
      <h1>{$t.nav.characters}</h1>
    </div>
    <div class="hero-note">
      <p>{$t.registry.note}</p>
    </div>
  </header>

  <section class="registry-controls" aria-label={$t.registry.filtersLabel}>
    <label class="search-field">
      <span aria-hidden="true">⌕</span>
      <span class="sr-only">{$t.registry.searchPassengers}</span>
      <input bind:value={query} type="search" placeholder={$t.registry.searchPlaceholder} />
      {#if query}<button
          type="button"
          onclick={() => (query = '')}
          aria-label={$t.common.clearSearch}>×</button
        >{/if}
    </label>
    <label class="filter-field">
      <span>{$t.registry.filterByAffiliation}</span>
      <select bind:value={activeFaction}>
        {#each factions as faction (faction)}
          <option value={faction}
            >{faction === ALL_FACTIONS ? $t.common.all : factionLabel(faction)}</option
          >
        {/each}
      </select>
    </label>
    {#if lineageAvailable}
      <label class="filter-field">
        <span>{$t.registry.beyondLineage.filterLabel}</span>
        <select bind:value={activeLineage}>
          {#each lineageFilters as filter (filter)}
            <option value={filter}>{lineageLabel(filter)}</option>
          {/each}
        </select>
      </label>
    {/if}
    <p class="result-count" aria-live="polite">
      {$t.common.results(filteredCharacters.length, data.characters.length)}
    </p>
  </section>

  {#if filteredCharacters.length}
    <div class="registry-groups" aria-live="polite">
      {#each Object.entries(charactersByFaction) as [faction, characters] (faction)}
        <section class="faction-group reveal-on-scroll">
          <header class="faction-heading">
            <h2>{factionLabel(faction)}</h2>
            <p>{characters.length} {$t.common.records(characters.length)}</p>
          </header>

          <div class="character-grid">
            {#each characters as character (character.id)}
              <a href={$link(`/characters/${character.id}`)} class="character-card">
                <div class="card-copy">
                  <h3>{character.canonicalName}</h3>
                  {#if character.beyondLineage}
                    <p
                      class="lineage-badge"
                      class:suspected={character.beyondLineage.status === 'suspected'}
                      title={character.beyondLineage.evidence}
                    >
                      {lineageBadge(character.beyondLineage.status)}
                    </p>
                  {/if}
                  {#if character.aliases?.length}<p class="aliases">
                      {$t.registry.aka} · {character.aliases.slice(0, 2).join(' / ')}
                    </p>{/if}
                  <p class="description">
                    {character.description || $t.registry.noIntelligence}
                  </p>
                  <div class="card-footer">
                    {#if character.canonStatus !== 'canon'}<span>{$t.registry.secondary}</span>{/if}
                    <span
                      >{character.firstAppearanceChapterId?.replace('-', ' ') ||
                        $t.registry.appearanceUnknown}</span
                    ><i aria-hidden="true"><MangaIcon name="arrowUpRight" /></i>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {:else}
    <section class="empty-state" aria-live="polite">
      <span>{$t.registry.emptyTag}</span>
      <h2>{$t.registry.emptyTitle}</h2>
      <p>
        {activeLineage === 'all' ? $t.registry.emptyCopy : $t.registry.beyondLineage.emptyCopy}
      </p>
      <button
        type="button"
        onclick={() => {
          query = ''
          activeFaction = ALL_FACTIONS
          activeLineage = 'all'
        }}>{$t.common.resetFilters}</button
      >
    </section>
  {/if}
</div>

<style>
  .registry-page {
    max-width: 1280px;
    min-height: 70vh;
    margin: auto;
    padding: clamp(2rem, 4vw, 3.5rem) var(--page-gutter) 5rem;
  }
  .registry-hero {
    margin-bottom: 2rem;
  }
  h1 {
    margin: 0;
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .hero-note > p {
    max-width: 46rem;
    margin: 0.8rem 0 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.7;
  }
  .registry-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 1rem;
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid var(--line-default);
  }
  .search-field {
    display: flex;
    min-height: 44px;
    min-width: 14rem;
    flex: 1 1 18rem;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--line-default);
    border-radius: 3px;
  }
  .search-field > span:first-child {
    color: var(--text-muted);
  }
  .search-field input {
    min-width: 0;
    width: 100%;
    border: 0;
    background: transparent;
    color: var(--text-primary);
    font-size: 0.85rem;
  }
  .search-field input:focus {
    outline: none;
  }
  .search-field:focus-within {
    outline: 2px solid var(--accent-gold-bright);
    outline-offset: 2px;
  }
  .search-field button {
    border: 0;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
  }
  .filter-field {
    display: grid;
    gap: 0.4rem;
    flex: 1 1 11rem;
  }
  .filter-field > span {
    color: var(--text-secondary);
    font-size: 0.72rem;
  }
  select {
    min-height: 44px;
    max-width: 100%;
    padding: 0.6rem;
    border: 1px solid var(--line-default);
    border-radius: 3px;
    background: var(--surface-deep);
    color: var(--text-primary);
    font-size: 0.8rem;
  }
  .result-count {
    flex-basis: 100%;
    margin: 0;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .registry-groups {
    display: grid;
    gap: 2.5rem;
  }
  .faction-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--line-subtle);
  }
  .faction-heading h2 {
    margin: 0;
    font: 500 1rem/1.4 var(--font-sans);
    text-transform: capitalize;
  }
  .faction-heading p {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.7rem;
  }
  .character-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 2rem;
  }
  .character-card {
    display: block;
    min-width: 0;
    padding: 1.25rem 0;
    border-bottom: 1px solid var(--line-subtle);
    color: inherit;
    text-decoration: none;
  }
  .character-card:hover h3 {
    color: var(--accent-gold-bright);
  }
  .card-copy h3 {
    margin: 0 0 0.4rem;
    color: var(--text-primary);
    font: 600 0.95rem/1.4 var(--font-sans);
  }
  .aliases {
    overflow: hidden;
    margin: 0;
    color: var(--text-muted);
    font-size: 0.7rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .description {
    display: -webkit-box;
    overflow: hidden;
    margin: 0.65rem 0;
    color: var(--text-secondary);
    font-size: 0.8rem;
    line-height: 1.65;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .card-footer {
    display: flex;
    justify-content: space-between;
    color: var(--text-muted);
    font-size: 0.7rem;
  }
  .card-footer i {
    font-style: normal;
  }
  .lineage-badge {
    display: inline-block;
    margin: 0.2rem 0;
    color: var(--accent-alert);
    font-size: 0.7rem;
  }
  .lineage-badge.suspected {
    color: var(--state-suspected);
  }
  .empty-state {
    padding: 3rem 0;
  }
  .empty-state > span,
  .empty-state p {
    color: var(--text-secondary);
  }
  .empty-state h2 {
    margin: 0.75rem 0;
    font-size: 1.8rem;
  }
  .empty-state button {
    min-height: 44px;
    margin-top: 1rem;
    padding: 0.5rem 0.8rem;
    border: 1px solid var(--line-default);
    border-radius: 3px;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
  }
  @media (max-width: 1000px) {
    .character-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 600px) {
    .character-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
