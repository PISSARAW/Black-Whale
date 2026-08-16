<script lang="ts">
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

  const royalPalette = ['#d4b563', '#a98655', '#7f9d8b', '#9d7b95', '#718ca2', '#b17c68', '#859f62']
  let factionIdentity = $derived((key: string) => {
    if (key.includes('phantom troupe'))
      return {
        category: $t.registry.categories.intruderCell,
        code: '№13',
        mark: '✳',
        accent: '#9b78bf',
        wash: '#211628',
      }
    if (key.includes('mafia'))
      return {
        category: $t.registry.categories.mafiaFamily,
        code: '3F',
        mark: '⬡',
        accent: '#b96552',
        wash: '#251716',
      }
    if (key.includes('zodiac') || key.includes('hunter'))
      return {
        category: $t.registry.categories.hunterAssociation,
        code: 'HXA',
        mark: '✦',
        accent: '#69b8ad',
        wash: '#112421',
      }
    if (key.includes('kakin royal army') || key.includes('justice bureau'))
      return {
        category: $t.registry.categories.stateAuthority,
        code: 'KKN',
        mark: '◆',
        accent: '#93a3a5',
        wash: '#172126',
      }
    if (key.startsWith('faction ')) {
      const hash = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0)
      const accent = royalPalette[hash % royalPalette.length]
      return {
        category: $t.registry.categories.royalHousehold,
        code: key.slice('faction '.length).slice(0, 3).toUpperCase(),
        mark: '♛',
        accent,
        wash: '#241f15',
      }
    }
    return {
      category: $t.registry.categories.unaligned,
      code: 'IND',
      mark: '·',
      accent: '#778788',
      wash: '#151d20',
    }
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
      <p class="eyebrow">{$t.registry.eyebrow}</p>
      <h1>{$t.registry.titleLine1}<br />{$t.registry.titleLine2}</h1>
    </div>
    <div class="hero-note">
      <p>{$t.registry.note}</p>
      <dl>
        <div>
          <dt>{$t.registry.totalRecords}</dt>
          <dd>{data.characters.length}</dd>
        </div>
        <div>
          <dt>{$t.registry.visible}</dt>
          <dd>{filteredCharacters.length}</dd>
        </div>
      </dl>
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
    <div class="faction-filter" aria-label={$t.registry.filterByAffiliation}>
      {#each factions as faction (faction)}
        <button
          type="button"
          class:active={activeFaction === faction}
          aria-pressed={activeFaction === faction}
          onclick={() => (activeFaction = faction)}
          >{faction === ALL_FACTIONS ? $t.common.all : factionLabel(faction)}</button
        >
      {/each}
    </div>
    {#if lineageAvailable}
      <div class="lineage-filter" aria-label={$t.registry.beyondLineage.filterLabel}>
        <span aria-hidden="true">✶</span>
        {#each lineageFilters as filter (filter)}
          <button
            type="button"
            class:active={activeLineage === filter}
            aria-pressed={activeLineage === filter}
            onclick={() => (activeLineage = filter)}>{lineageLabel(filter)}</button
          >
        {/each}
      </div>
    {/if}
  </section>

  {#if filteredCharacters.length}
    <div class="registry-groups" aria-live="polite">
      {#each Object.entries(charactersByFaction) as [faction, characters], groupIndex (faction)}
        {@const identity = factionIdentity(faction)}
        <section
          class="faction-group reveal-on-scroll"
          style={`--faction-accent:${identity.accent};--faction-wash:${identity.wash}`}
        >
          <header class="faction-heading">
            <span>{String(groupIndex + 1).padStart(2, '0')}</span>
            <div class="faction-title">
              <i aria-hidden="true">{identity.mark}</i>
              <div>
                <small>{identity.category} · {identity.code}</small>
                <h2>{factionLabel(faction)}</h2>
              </div>
            </div>
            <p>{characters.length} {$t.common.records(characters.length)}</p>
          </header>

          <div class="character-grid">
            {#each characters as character, index (character.id)}
              <a
                href={$link(`/characters/${character.id}`)}
                class="character-card"
                data-affiliation={identity.category}
              >
                <div class="portrait" aria-hidden="true">
                  <span
                    >{character.canonicalName
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part: string) => part[0])
                      .join('')}</span
                  >
                  <i>{String(index + 1).padStart(2, '0')}</i>
                </div>
                <div class="card-copy">
                  <div class="card-status">
                    <span class:canon={character.canonStatus === 'canon'}></span>{identity.code} · {character.canonStatus ===
                    'canon'
                      ? $t.registry.canonical
                      : $t.registry.secondary}
                  </div>
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
                    <span
                      >{character.firstAppearanceChapterId?.replace('-', ' ') ||
                        $t.registry.appearanceUnknown}</span
                    ><i aria-hidden="true">↗</i>
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
    min-height: 100vh;
    padding: clamp(3rem, 7vw, 7rem) var(--page-gutter) 8rem;
  }
  .registry-hero {
    display: grid;
    max-width: var(--container-wide);
    margin: 0 auto 4rem;
    grid-template-columns: 1fr minmax(18rem, 0.55fr);
    align-items: end;
    gap: 3rem;
  }
  h1 {
    margin: 0.7rem 0 0;
    color: var(--text-primary);
    font-size: clamp(4.5rem, 10vw, 9rem);
    font-weight: 500;
    letter-spacing: -0.065em;
    line-height: 0.72;
    text-transform: uppercase;
  }
  .hero-note {
    padding-left: 2rem;
    border-left: 1px solid var(--line-default);
  }
  .hero-note > p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.7;
  }
  dl {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    margin: 2rem 0 0;
    gap: 1px;
    background: var(--line-subtle);
  }
  dl div {
    padding: 0.8rem;
    background: var(--surface-void);
  }
  dt {
    color: var(--text-faint);
    font: 0.5rem/1 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  dd {
    margin: 0.35rem 0 0;
    color: var(--accent-gold-bright);
    font: 500 1.5rem/1 var(--font-display);
  }
  .registry-controls {
    position: sticky;
    z-index: 20;
    top: calc(var(--header-height) + 0.6rem);
    display: grid;
    max-width: var(--container-wide);
    margin: 0 auto 4rem;
    grid-template-columns: minmax(18rem, 0.8fr) 1.4fr;
    align-items: center;
    gap: 0.8rem;
    padding: 0.65rem;
    border: 1px solid var(--line-default);
    border-radius: 0.8rem;
    background: rgba(8, 14, 18, 0.9);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
    backdrop-filter: blur(18px);
  }
  .search-field {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.65rem;
    padding: 0.55rem 0.7rem;
  }
  .search-field > span:first-child {
    color: var(--accent-gold);
    font-size: 1.1rem;
  }
  .search-field input {
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text-primary);
    font-size: 0.78rem;
  }
  .search-field input::placeholder {
    color: var(--text-faint);
  }
  .search-field button {
    border: 0;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .faction-filter {
    display: flex;
    overflow-x: auto;
    gap: 0.35rem;
    scrollbar-width: none;
  }
  .faction-filter button {
    flex: none;
    padding: 0.5rem 0.65rem;
    border: 1px solid transparent;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--text-muted);
    font: 0.52rem/1 var(--font-mono);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .faction-filter button:hover {
    color: var(--text-primary);
  }
  .faction-filter button.active {
    border-color: var(--line-strong);
    background: rgba(200, 169, 86, 0.08);
    color: var(--accent-gold-bright);
  }
  /* Spans both columns: the lineage axis applies on top of whatever faction is
     selected, so it reads as a second line rather than a neighbour. */
  .lineage-filter {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    grid-column: 1 / -1;
    padding-top: 0.55rem;
    border-top: 1px solid var(--line-subtle);
  }
  .lineage-filter > span {
    padding-left: 0.35rem;
    color: var(--accent-alert);
    font-size: 0.6rem;
  }
  .lineage-filter button {
    flex: none;
    padding: 0.5rem 0.65rem;
    border: 1px solid transparent;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--text-muted);
    font: 0.52rem/1 var(--font-mono);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .lineage-filter button:hover {
    color: var(--text-primary);
  }
  .lineage-filter button.active {
    border-color: color-mix(in srgb, var(--accent-alert) 45%, transparent);
    background: color-mix(in srgb, var(--accent-alert) 10%, transparent);
    color: var(--accent-alert);
  }
  .lineage-badge {
    display: inline-block;
    margin: 0 0 0.35rem;
    padding: 0.2rem 0.4rem;
    border: 1px solid color-mix(in srgb, var(--accent-alert) 40%, transparent);
    border-radius: 0.25rem;
    color: var(--accent-alert);
    font: 0.44rem/1 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  /* A hypothesis must not look like a confirmed birthmark. */
  .lineage-badge.suspected {
    border-style: dashed;
    border-color: color-mix(in srgb, var(--accent-alert) 25%, transparent);
    color: color-mix(in srgb, var(--accent-alert) 65%, var(--text-muted));
  }
  .registry-groups {
    display: grid;
    max-width: var(--container-wide);
    margin: auto;
    gap: 6rem;
  }
  .faction-group {
    position: relative;
  }
  .faction-group::before {
    position: absolute;
    top: 3.25rem;
    left: 0;
    width: 7rem;
    height: 1px;
    background: var(--faction-accent);
    box-shadow: 0 0 18px color-mix(in srgb, var(--faction-accent) 45%, transparent);
    content: '';
  }
  .faction-heading {
    display: grid;
    grid-template-columns: 3rem 1fr auto;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.2rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid color-mix(in srgb, var(--faction-accent) 25%, var(--line-default));
  }
  .faction-heading > span,
  .faction-heading > p {
    color: var(--text-faint);
    font: 0.53rem/1 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .faction-title {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }
  .faction-title > i {
    display: grid;
    width: 2.6rem;
    height: 2.6rem;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--faction-accent) 45%, transparent);
    border-radius: 50%;
    color: var(--faction-accent);
    background: color-mix(in srgb, var(--faction-wash) 82%, transparent);
    font-style: normal;
  }
  .faction-title small {
    color: color-mix(in srgb, var(--faction-accent) 75%, var(--text-muted));
    font: 0.48rem/1 var(--font-mono);
    letter-spacing: 0.11em;
    text-transform: uppercase;
  }
  .faction-heading h2 {
    margin: 0.3rem 0 0;
    color: var(--text-primary);
    font-size: 2rem;
    text-transform: capitalize;
  }
  .faction-heading p {
    margin: 0;
  }
  .character-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1px;
    background: color-mix(in srgb, var(--faction-accent) 12%, var(--line-subtle));
    border: 1px solid color-mix(in srgb, var(--faction-accent) 18%, var(--line-subtle));
  }
  .character-card {
    position: relative;
    display: grid;
    min-width: 0;
    grid-template-columns: 5rem 1fr;
    gap: 1rem;
    padding: 1rem;
    overflow: hidden;
    background: linear-gradient(
      115deg,
      color-mix(in srgb, var(--faction-wash) 35%, rgba(9, 15, 19, 0.96)),
      rgba(9, 15, 19, 0.97) 42%
    );
    color: inherit;
    text-decoration: none;
    transition:
      background 0.25s,
      transform 0.3s var(--ease-out);
  }
  .character-card::after {
    position: absolute;
    right: 0.45rem;
    top: 0.4rem;
    color: color-mix(in srgb, var(--faction-accent) 24%, transparent);
    font: 0.42rem/1 var(--font-mono);
    letter-spacing: 0.06em;
    content: attr(data-affiliation);
    text-transform: uppercase;
  }
  .character-card:hover {
    z-index: 2;
    background: color-mix(in srgb, var(--faction-wash) 70%, var(--surface-raised));
    transform: translateY(-4px);
    box-shadow:
      0 18px 45px rgba(0, 0, 0, 0.25),
      inset 0 2px var(--faction-accent);
  }
  .portrait {
    position: relative;
    display: grid;
    height: 7rem;
    place-items: center;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--faction-accent) 30%, var(--line-default));
    background:
      radial-gradient(
        circle at 50% 28%,
        color-mix(in srgb, var(--faction-accent) 18%, transparent),
        transparent 42%
      ),
      linear-gradient(145deg, color-mix(in srgb, var(--faction-wash) 80%, #17262d), #0b1115);
  }
  .portrait::before {
    position: absolute;
    inset: 12%;
    border: 1px solid color-mix(in srgb, var(--faction-accent) 18%, transparent);
    border-radius: 50%;
    content: '';
  }
  .portrait::after {
    position: absolute;
    inset: 50% -20% auto;
    height: 1px;
    background: color-mix(in srgb, var(--faction-accent) 26%, transparent);
    content: '';
  }
  .portrait > span {
    color: color-mix(in srgb, var(--faction-accent) 76%, white);
    font: 500 1.4rem/1 var(--font-display);
    letter-spacing: 0.05em;
  }
  .portrait i {
    position: absolute;
    right: 0.35rem;
    bottom: 0.35rem;
    color: color-mix(in srgb, var(--faction-accent) 55%, var(--text-faint));
    font: normal 0.45rem/1 var(--font-mono);
  }
  .card-copy {
    min-width: 0;
  }
  .card-status {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: color-mix(in srgb, var(--faction-accent) 55%, var(--text-faint));
    font: 0.46rem/1 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .card-status span {
    width: 0.35rem;
    height: 0.35rem;
    border-radius: 50%;
    background: var(--state-unknown);
  }
  .card-status span.canon {
    background: var(--state-known);
    box-shadow: 0 0 8px rgba(117, 201, 184, 0.35);
  }
  .card-copy h3 {
    margin: 0.65rem 0 0.25rem;
    color: var(--text-primary);
    font-size: 1.45rem;
    line-height: 1;
  }
  .aliases {
    overflow: hidden;
    margin: 0;
    color: var(--faction-accent);
    font: 0.48rem/1.4 var(--font-mono);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .description {
    display: -webkit-box;
    overflow: hidden;
    margin: 0.8rem 0 1rem;
    color: var(--text-muted);
    font-size: 0.7rem;
    line-height: 1.55;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
  .card-footer {
    display: flex;
    justify-content: space-between;
    padding-top: 0.7rem;
    border-top: 1px solid var(--line-subtle);
    color: var(--text-faint);
    font: 0.46rem/1 var(--font-mono);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .card-footer i {
    color: var(--faction-accent);
    font-style: normal;
    transition: transform 0.2s;
  }
  .character-card:hover .card-footer i {
    transform: translate(2px, -2px);
  }
  .empty-state {
    max-width: var(--container-wide);
    margin: 0 auto;
    padding: 7rem 1rem;
    border: 1px dashed var(--line-default);
    text-align: center;
  }
  .empty-state > span {
    color: var(--accent-alert);
    font: 0.55rem/1 var(--font-mono);
    letter-spacing: 0.15em;
  }
  .empty-state h2 {
    margin: 1rem 0 0.4rem;
    font-size: 2.2rem;
  }
  .empty-state p {
    color: var(--text-muted);
  }
  .empty-state button {
    margin-top: 1rem;
    padding: 0.65rem 0.9rem;
    border: 1px solid var(--line-strong);
    border-radius: 0.35rem;
    background: transparent;
    color: var(--accent-gold-bright);
    cursor: pointer;
  }
  @media (max-width: 1050px) {
    .character-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 760px) {
    .registry-page {
      padding-inline: 1rem;
    }
    .registry-hero {
      grid-template-columns: 1fr;
    }
    .hero-note {
      padding-left: 0;
      border-left: 0;
    }
    .registry-controls {
      top: calc(var(--header-height) + 0.35rem);
      grid-template-columns: 1fr;
    }
    .character-grid {
      grid-template-columns: 1fr;
    }
    .faction-heading {
      grid-template-columns: 2rem 1fr auto;
    }
    .character-card {
      grid-template-columns: 4.5rem 1fr;
    }
  }
</style>
