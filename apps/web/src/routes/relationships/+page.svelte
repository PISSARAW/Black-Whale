<script lang="ts">
  import MangaIcon from '$lib/components/icons/MangaIcon.svelte'
  import RelationshipGlyph from '$lib/components/RelationshipGlyph.svelte'
  import type { PageData } from './$types'
  import Seo from '$lib/components/Seo.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, t } from '$lib/i18n'

  type CharacterRecord = {
    id: string
    canonicalName: string
    factionId?: string | null
    aliases?: string[]
    shipLocation?: { role?: string | null } | null
  }

  let { data }: { data: PageData } = $props()
  let selectedFactionId = $state('prince-woble')
  let query = $state('')
  let relationFilter = $state('all')

  const palette: Record<string, { color: string; mark: string }> = {
    alliance: { color: '#75c9b8', mark: '↔' },
    cooperation: { color: '#70bdc1', mark: '◇' },
    conflict: { color: '#df746b', mark: '×' },
    patronage: { color: '#e6b661', mark: '◆' },
    control: { color: '#c99d66', mark: '↓' },
  }

  const characters = $derived(data.characters as CharacterRecord[])
  const factionById = $derived(new Map(data.factions.map((faction) => [faction.id, faction])))
  const activeFaction = $derived(factionById.get(selectedFactionId))
  const members = $derived(
    characters.filter((character) => character.factionId === selectedFactionId),
  )
  const connectedRelations = $derived(
    data.relations
      .filter(
        (relation) => relation.from === selectedFactionId || relation.to === selectedFactionId,
      )
      .filter((relation) => relationFilter === 'all' || relation.type === relationFilter)
      .map((relation) => ({
        ...relation,
        counterpartId: relation.from === selectedFactionId ? relation.to : relation.from,
        counterpart: factionById.get(
          relation.from === selectedFactionId ? relation.to : relation.from,
        ),
      })),
  )
  const normalizedQuery = $derived(query.trim().toLowerCase())
  const visibleFactions = $derived(
    data.factions
      .map((faction) => ({
        ...faction,
        memberCount: characters.filter((character) => character.factionId === faction.id).length,
        relationCount: data.relations.filter(
          (relation) => relation.from === faction.id || relation.to === faction.id,
        ).length,
      }))
      .filter(
        (faction) =>
          !normalizedQuery ||
          `${faction.name} ${faction.description}`.toLowerCase().includes(normalizedQuery),
      )
      .sort(
        (a, b) =>
          b.relationCount - a.relationCount ||
          b.memberCount - a.memberCount ||
          a.name.localeCompare(b.name, $t.common.intlLocale),
      ),
  )

  function selectFaction(factionId: string) {
    selectedFactionId = factionId
    relationFilter = 'all'
  }
</script>

<Seo
  title={$t.factions.seoTitle}
  description={$t.factions.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.factions.breadcrumb, path: $link('/relationships') },
  ])}
/>

<div class="network-page">
  <header class="network-hero">
    <div>
      <h1>{$t.factions.title}</h1>
      <p class="intro">{$t.factions.intro}</p>
    </div>
    <dl class="network-stats">
      <div>
        <dt>{$t.factions.factions}</dt>
        <dd>{data.factions.length}</dd>
      </div>
      <div>
        <dt>{$t.factions.knownTies}</dt>
        <dd>{data.relations.length}</dd>
      </div>
      <div>
        <dt>{$t.factions.affiliatedPeople}</dt>
        <dd>{characters.filter((character) => character.factionId).length}</dd>
      </div>
    </dl>
  </header>

  {#if data.spoilerLimit}
    <div class="spoiler-notice">
      <span>◉</span>
      {$t.factions.spoilerNotice(data.spoilerLimit)}
    </div>
  {/if}

  <main class="network-workspace">
    <aside class="faction-index" aria-label={$t.factions.indexLabel}>
      <div class="index-heading">
        <div>
          <h2>{$t.factions.chooseFaction}</h2>
        </div>
        <label>
          <span class="sr-only">{$t.factions.searchFactions}</span>
          <input bind:value={query} type="search" placeholder={$t.factions.searchPlaceholder} />
        </label>
      </div>

      <nav>
        {#each visibleFactions as faction (faction.id)}
          <button
            type="button"
            class:active={selectedFactionId === faction.id}
            aria-pressed={selectedFactionId === faction.id}
            onclick={() => selectFaction(faction.id)}
          >
            <span class="node" aria-hidden="true"></span>
            <span class="faction-copy"
              ><strong>{faction.name}</strong><small
                >{$t.factions.factionSummary(faction.memberCount, faction.relationCount)}</small
              ></span
            >
            <span class="arrow">›</span>
          </button>
        {:else}
          <p class="empty-index">{$t.factions.emptyIndex}</p>
        {/each}
      </nav>
    </aside>

    <section class="intelligence-panel" aria-live="polite">
      {#if activeFaction}
        <header class="faction-header">
          <div>
            <h2>{activeFaction.name}</h2>
            <span>{activeFaction.description}</span>
          </div>
        </header>

        <section class="ties-section">
          <div class="section-title">
            <div>
              <h3>{$t.factions.knownConnections}</h3>
            </div>
            <div class="relation-filters" aria-label={$t.factions.filterConnections}>
              {#each ['all', 'alliance', 'cooperation', 'conflict', 'control'] as const as type (type)}
                <button
                  type="button"
                  class:active={relationFilter === type}
                  onclick={() => (relationFilter = type)}>{$t.factions.relationTypes[type]}</button
                >
              {/each}
            </div>
          </div>

          <div class="ties-list">
            {#each connectedRelations as relation (relation.id)}
              <article
                class="tie-card"
                style={`--relation:${palette[relation.type]?.color || '#768083'}`}
              >
                <RelationshipGlyph glyph={palette[relation.type]?.mark} />
                <div class="tie-copy">
                  <p>
                    <span
                      >{$t.factions.relationTypes[
                        relation.type as keyof typeof $t.factions.relationTypes
                      ] || relation.type}</span
                    ><a href={$link(`/timeline#chapter-${relation.chapter}`)}
                      >{$t.factions.establishedIn(relation.chapter)}</a
                    >
                  </p>
                  <button type="button" onclick={() => selectFaction(relation.counterpartId)}
                    >{relation.counterpart?.name || relation.counterpartId}
                    <span><MangaIcon name="arrowUpRight" /></span></button
                  >
                  <h4>{relation.label}</h4>
                  <p class="evidence">{relation.evidence}</p>
                </div>
              </article>
            {:else}
              <div class="empty-state">
                <span>{$t.factions.signalAbsent}</span>
                <h4>{$t.factions.noConnection}</h4>
                <p>{$t.factions.noConnectionCopy}</p>
              </div>
            {/each}
          </div>
        </section>

        <section class="members-section">
          <div class="section-title">
            <div>
              <h3>{$t.factions.knownPersonnel}</h3>
            </div>
            <small>{$t.factions.recordCount(members.length)}</small>
          </div>
          <div class="member-grid">
            {#each members as character (character.id)}
              <a href={$link(`/characters/${character.id}`)}>
                <span
                  ><strong>{character.canonicalName}</strong><small
                    >{character.shipLocation?.role ||
                      character.aliases?.[0] ||
                      $t.factions.affiliationConfirmed}</small
                  ></span
                >
                <i><MangaIcon name="arrowUpRight" /></i>
              </a>
            {:else}
              <div class="empty-state compact">
                <p>{$t.factions.noPersonnel}</p>
              </div>
            {/each}
          </div>
        </section>
      {/if}
    </section>
  </main>
</div>

<style>
  .network-page {
    min-height: 100vh;
    padding: clamp(2rem, 4vw, 3.5rem) var(--page-gutter) 5rem;
    background: none;
  }
  .network-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(22rem, 0.7fr);
    gap: 3rem;
    align-items: end;
    max-width: var(--container-wide);
    margin: 0 auto 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--line-default);
  }
  .network-hero h1 {
    margin: 0 0 0.8rem;
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.02em;
    text-transform: none;
  }
  .intro {
    max-width: 48rem;
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.7;
  }
  .network-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin: 0;
    border: 0;
    background: none;
  }
  .network-stats div {
    padding: 0.5rem 1rem;
    border-right: 0;
  }
  .network-stats div:last-child {
    border: 0;
  }
  .network-stats dt {
    color: var(--text-muted);
    font: 0.48rem/1.2 var(--font-mono);
    letter-spacing: 0;
    text-transform: none;
    font-size: 0.7rem;
  }
  .network-stats dd {
    margin: 0.45rem 0 0;
    color: var(--text-primary);
    font: 500 1rem/1.5 var(--font-sans);
  }
  .spoiler-notice {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    max-width: var(--container-wide);
    margin: 0 auto 1rem;
    padding: 0.7rem 1rem;
    border: 1px solid rgba(230, 182, 97, 0.25);
    color: var(--state-suspected);
    background: rgba(230, 182, 97, 0.06);
    font: 0.58rem/1.4 var(--font-mono);
    letter-spacing: 0.04em;
  }
  .spoiler-notice span {
    font-size: 0.5rem;
  }
  .network-workspace {
    display: grid;
    grid-template-columns: minmax(17rem, 22rem) minmax(0, 1fr);
    max-width: var(--container-wide);
    min-height: 44rem;
    margin: auto;
    border: 1px solid var(--line-default);
    background: none;
    box-shadow: none;
  }
  .faction-index {
    border-right: 1px solid var(--line-default);
    background: rgba(11, 17, 21, 0.82);
  }
  .index-heading {
    position: sticky;
    z-index: 2;
    top: var(--header-height);
    padding: 1.25rem;
    border-bottom: 1px solid var(--line-default);
    background: rgba(11, 17, 21, 0.96);
    backdrop-filter: blur(14px);
  }
  .index-heading > div,
  .section-title > div {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }
  .index-heading h2,
  .section-title h3 {
    margin: 0;
    font-size: 1rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .index-heading label {
    display: block;
    margin-top: 1rem;
  }
  .index-heading input {
    width: 100%;
    padding: 0.7rem 0.8rem;
    border: 1px solid var(--line-default);
    border-radius: 0.2rem;
    outline: 0;
    background: var(--surface-void);
    color: var(--text-primary);
    font: 0.65rem/1 var(--font-mono);
  }
  .index-heading input:focus {
    border-color: var(--accent-gold);
  }
  .faction-index nav {
    max-height: 60rem;
    overflow: auto;
  }
  .faction-index nav button {
    display: grid;
    width: 100%;
    grid-template-columns: 0.7rem 1fr auto;
    gap: 0.8rem;
    align-items: center;
    padding: 1rem 1.15rem;
    border: 0;
    border-bottom: 1px solid var(--line-subtle);
    background: transparent;
    color: var(--text-secondary);
    text-align: left;
    cursor: pointer;
    transition: 0.18s;
  }
  .faction-index nav button:hover,
  .faction-index nav button.active {
    background: linear-gradient(90deg, rgba(200, 169, 86, 0.1), transparent);
    color: var(--text-primary);
  }
  .faction-index nav button.active {
    box-shadow: inset 2px 0 var(--accent-gold);
  }
  .node {
    width: 0.45rem;
    height: 0.45rem;
    border: 1px solid var(--text-faint);
    border-radius: 50%;
  }
  .active .node {
    border-color: var(--accent-gold);
    background: var(--accent-gold);
    box-shadow: 0 0 10px var(--accent-gold-glow);
  }
  .faction-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.35rem;
  }
  .faction-copy strong {
    overflow: hidden;
    font: 500 0.9rem/1.4 var(--font-sans);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .faction-copy small {
    color: var(--text-faint);
    font: 0.7rem/1.4 var(--font-sans);
    letter-spacing: 0;
    text-transform: none;
  }
  .arrow {
    color: var(--text-faint);
  }
  .empty-index {
    padding: 2rem;
    color: var(--text-faint);
    font-size: 0.7rem;
  }
  .intelligence-panel {
    min-width: 0;
  }
  .faction-header {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--line-default);
    background: none;
  }
  .faction-header h2 {
    margin: 0 0 0.6rem;
    font-size: 1.8rem;
    line-height: 1.2;
    text-transform: none;
  }
  .faction-header > div > span {
    display: block;
    max-width: 44rem;
    color: var(--text-muted);
    font-size: 0.75rem;
    line-height: 1.6;
  }
  .ties-section,
  .members-section {
    padding: clamp(1.25rem, 3vw, 2.25rem);
  }
  .members-section {
    border-top: 1px solid var(--line-default);
  }
  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .section-title > small {
    color: var(--text-faint);
    font: 0.5rem/1 var(--font-mono);
    text-transform: uppercase;
  }
  .relation-filters {
    display: flex;
    gap: 0.25rem;
    overflow: auto;
  }
  .relation-filters button {
    padding: 0.42rem 0.55rem;
    border: 1px solid transparent;
    border-radius: 0.2rem;
    background: transparent;
    color: var(--text-faint);
    font: 0.72rem/1.4 var(--font-sans);
    letter-spacing: 0;
    text-transform: none;
    cursor: pointer;
    min-height: 44px;
  }
  .relation-filters button:hover,
  .relation-filters button.active {
    border-color: var(--line-default);
    color: var(--text-primary);
    background: var(--surface-panel);
  }
  .ties-list {
    display: grid;
    gap: 0.7rem;
  }
  .tie-card {
    display: grid;
    grid-template-columns: 1.5rem 1fr;
    border: 0;
    background: none;
    border-bottom: 1px solid var(--line-default);
  }
  .tie-copy {
    padding: 1rem 1.15rem;
  }
  .tie-copy > p:first-child {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin: 0;
    color: var(--relation);
    font: 0.7rem/1.5 var(--font-sans);
    letter-spacing: 0;
    text-transform: none;
  }
  .tie-copy > p a {
    color: var(--text-faint);
    text-decoration: none;
  }
  .tie-copy > p a:hover {
    color: var(--accent-gold);
  }
  .tie-copy > button {
    margin: 0.7rem 0 0.25rem;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text-primary);
    font: 500 1.5rem/1 var(--font-display);
    cursor: pointer;
  }
  .tie-copy > button span {
    color: var(--relation);
    font-size: 0.7rem;
  }
  .tie-copy h4 {
    margin: 0.25rem 0;
    color: var(--relation);
    font: 0.55rem/1.2 var(--font-mono);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .evidence {
    margin: 0.65rem 0 0;
    color: var(--text-muted);
    font-size: 0.8rem;
    line-height: 1.6;
  }
  .member-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 1.5rem;
    background: none;
    border: 0;
  }
  .member-grid > a {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.75rem;
    align-items: center;
    padding: 1rem 0;
    background: none;
    color: inherit;
    text-decoration: none;
    border-bottom: 1px solid var(--line-subtle);
  }
  .member-grid > a:hover {
    background: var(--surface-panel);
  }
  .member-grid > a > span {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.25rem;
  }
  .member-grid strong {
    overflow: hidden;
    font: 500 0.85rem/1.4 var(--font-sans);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .member-grid small {
    overflow: hidden;
    color: var(--text-faint);
    font: 0.7rem/1.4 var(--font-sans);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .member-grid i {
    color: var(--accent-gold);
    font-style: normal;
    font-size: 0.6rem;
  }
  .empty-state {
    padding: 2.5rem;
    border: 1px dashed var(--line-default);
    text-align: center;
  }
  .empty-state span {
    color: var(--accent-alert);
    font: 0.48rem/1 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .empty-state h4 {
    margin: 0.6rem 0;
    font-size: 1.4rem;
  }
  .empty-state p {
    max-width: 32rem;
    margin: auto;
    color: var(--text-faint);
    font-size: 0.68rem;
    line-height: 1.6;
  }
  .empty-state.compact {
    grid-column: 1/-1;
    padding: 1.5rem;
  }
  @media (max-width: 900px) {
    .network-hero {
      grid-template-columns: 1fr;
    }
    .network-workspace {
      grid-template-columns: 1fr;
    }
    .faction-index {
      border-right: 0;
      border-bottom: 1px solid var(--line-default);
    }
    .index-heading {
      position: static;
    }
    .faction-index nav {
      display: flex;
      max-height: none;
      overflow: auto;
    }
    .faction-index nav button {
      width: 16rem;
      flex: none;
      border-right: 1px solid var(--line-subtle);
    }
    .network-stats {
      max-width: 36rem;
    }
  }
  @media (max-width: 620px) {
    .network-page {
      padding-inline: 1rem;
    }
    .network-stats {
      grid-template-columns: 1fr;
    }
    .network-stats div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-right: 0;
      border-bottom: 1px solid var(--line-default);
    }
    .faction-header {
      grid-template-columns: 1fr;
    }
    .section-title {
      align-items: flex-start;
      flex-direction: column;
    }
    .tie-card {
      grid-template-columns: 2.5rem 1fr;
    }
    .member-grid {
      grid-template-columns: 1fr;
    }
    .tie-copy > p:first-child {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.35rem;
    }
  }
</style>
