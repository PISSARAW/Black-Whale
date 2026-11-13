<script lang="ts">
  import MangaIcon from '$lib/components/icons/MangaIcon.svelte'
  import type { PageData } from './$types'
  import { aliasLabel, displayName as toDisplayName, locationLabel } from '$lib/utils/displayNames'
  import { hatsuById } from '$lib/nen/hatsuRegistry.js'
  import { activeHatsu, activateHatsu } from '$lib/nen/hatsuState.js'
  import Seo from '$lib/components/Seo.svelte'
  import ProphecyPoem from '$lib/components/ProphecyPoem.svelte'
  import {
    articleSchema,
    breadcrumbSchema,
    characterSchema,
    publisherSchema,
  } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { LOCALE_TAGS } from '$lib/i18n/config'

  let { data }: { data: PageData } = $props()
  let character = $derived(data.character)
  let prophecy = $derived(data.prophecy)
  let chapterTrajectory = $derived(data.chapterTrajectory || [])
  let roleHistory = $derived(data.roleHistory || [])
  let affiliations = $derived(data.affiliations || [])
  let documentedAppearances = $derived(
    (character.mangaAppearances || []).filter((appearance) => appearance.status !== 'absent'),
  )
  let displayName = $derived(toDisplayName(character.canonicalName, $locale))
  let factionName = $derived(
    character.factionId
      ? character.factionId
          .replaceAll('-', ' ')
          .replace(/\b\w/g, (letter: string) => letter.toUpperCase())
      : null,
  )
  // Search snippets cut around 160 characters, so prefer the canon summary and
  // trim it on a word boundary rather than shipping a truncated sentence.
  let metaDescription = $derived(
    truncate(character.description) || $t.characterDetail.fallbackDescription(displayName),
  )
  let latestKnownChapter = $derived(
    chapterTrajectory.findLast((chapter) =>
      chapter.visits.some((visit) => visit.location !== 'Position inconnue'),
    ),
  )
  let currentLocation = $derived(
    latestKnownChapter?.visits.map((visit) => visit.location).join(' → ') ||
      [
        character.shipLocation?.tier ? $t.ship.tierLabel(character.shipLocation.tier) : null,
        character.shipLocation?.room,
      ]
        .filter(Boolean)
        .join(' · ') ||
      $t.characterDetail.unknownLocation,
  )
  // The file index numbers whatever the dossier actually renders, so an optional
  // section appearing or disappearing cannot leave the list counting wrong.
  let sections = $derived(
    [
      {
        id: 'role',
        label: $t.characterDetail.sections.role,
        shown: Boolean(roleHistory.length || affiliations.length),
      },
      {
        id: 'identity',
        label: $t.characterDetail.sections.identity,
        shown: Boolean(character.identity),
      },
      {
        id: 'biography',
        label: $t.characterDetail.sections.biography,
        shown: Boolean(character.biography?.length),
      },
      {
        id: 'nen',
        label: $t.characterDetail.sections.nen,
        shown: Boolean(character.nen || character.abilities?.length),
      },
      { id: 'prophecy', label: $t.characterDetail.sections.prophecy, shown: Boolean(prophecy) },
      { id: 'appearances', label: $t.characterDetail.sections.appearances, shown: true },
      { id: 'trajectory', label: $t.characterDetail.sections.trajectory, shown: true },
    ].filter((section) => section.shown),
  )
  let labels: Record<string, string> = $derived($t.characterDetail.states)
  let kindLabels: Record<string, string> = $derived($t.characterDetail.kinds)

  let humanize = $derived(
    (value: string) => labels[value] || value.toLowerCase().replaceAll('_', ' '),
  )

  function truncate(value?: string | null, limit = 158): string {
    const text = value?.replace(/\s+/g, ' ').trim() ?? ''
    if (text.length <= limit) return text
    const cut = text.slice(0, limit)
    return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[.,;:]$/, '')}…`
  }

  function activateAbility(abilityId: string) {
    const profile = hatsuById(abilityId)
    if (profile) activateHatsu(profile)
  }

  const sourceChapter = (chapterId: string) => chapterId.replace(/^ch-/, '').split('.')[0]
  const sourceLink = (chapterId: string) => {
    const chapter = Number(sourceChapter(chapterId))
    return Number.isFinite(chapter) && chapter >= 340 ? $link(`/timeline#chapter-${chapter}`) : null
  }
</script>

<Seo
  title={$t.characterDetail.seoTitle(displayName)}
  description={metaDescription}
  type="profile"
  jsonLd={[
    characterSchema({
      name: displayName,
      path: $link(`/characters/${character.id}`),
      description: metaDescription,
      affiliation: factionName,
    }),
    articleSchema({
      name: displayName,
      path: $link(`/characters/${character.id}`),
      description: metaDescription,
      language: LOCALE_TAGS[$locale].html,
      modifiedAt: character.modifiedAt,
      type: 'ProfilePage',
      mainEntity: { '@type': 'Person', name: displayName },
    }),
    publisherSchema(),
    breadcrumbSchema([
      { name: $t.common.home, path: $link('/') },
      { name: $t.nav.characters, path: $link('/characters') },
      { name: displayName, path: $link(`/characters/${character.id}`) },
    ]),
  ]}
/>

<div class="dossier-page">
  <nav class="breadcrumb" aria-label={$t.characterDetail.breadcrumbLabel}>
    <a href={$link('/characters')}>{$t.characterDetail.registryLink}</a><span>/</span><strong
      >{displayName}</strong
    >
  </nav>

  <header class="dossier-hero">
    <div class="hero-copy">
      <h1>{displayName}</h1>
      {#if character.aliases?.length}<p class="aliases">
          {$t.characterDetail.alsoKnownAs} · {character.aliases
            .map((alias: string) => aliasLabel(alias, $locale))
            .join(' / ')}
        </p>{/if}
      <div class="primary-role">
        <span>{$t.characterDetail.roleAboard}</span>
        <strong>{character.shipLocation?.role || $t.characterDetail.noConfirmedRole}</strong>
      </div>
      <div class="hero-links">
        <a href={$link('/ship')}>{$t.characterDetail.locateOnShip} <span>⌖</span></a>
      </div>
      {#if character.description}<p class="answer-summary">{character.description}</p>{/if}
    </div>

    <dl class="record-stats">
      <div>
        <dt>{$t.characterDetail.firstRecord}</dt>
        <dd>
          {character.firstVisibleChapter
            ? $t.characterDetail.chapterUpper(character.firstVisibleChapter)
            : $t.common.unknown}
        </dd>
      </div>
      <div>
        <dt>{$t.characterDetail.latestPosition}</dt>
        <dd>{currentLocation}</dd>
      </div>
      <div>
        <dt>{$t.characterDetail.reportedStatus}</dt>
        <dd>{character.shipLocation?.status || $t.characterDetail.unconfirmed}</dd>
      </div>

      {#if factionName}<div>
          <dt>{$t.characterDetail.catalogueAffiliation}</dt>
          <dd>{factionName}</dd>
        </div>{/if}
    </dl>
  </header>

  {#if character.sources.length}
    <section class="summary-sources" aria-labelledby="summary-sources-title">
      <h2 id="summary-sources-title">{$t.discovery.sources}</h2>
      <ul>
        {#each character.sources as source (source.chapterId)}
          <li>
            {#if source.chapterId === 'ch-unknown'}
              <span>{$t.common.unknown}</span>
            {:else if sourceLink(source.chapterId)}
              <a href={sourceLink(source.chapterId) ?? undefined}
                >{$t.discovery.chapter(sourceChapter(source.chapterId))}</a
              >
            {:else}
              <span>{$t.discovery.chapter(sourceChapter(source.chapterId))}</span>
            {/if}
            {#if source.note}<small>{source.note}</small>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <div class="dossier-layout">
    <aside class="dossier-index">
      <p>{$t.characterDetail.fileIndex}</p>
      <nav aria-label={$t.characterDetail.dossierSections}>
        {#each sections as section (section.id)}
          <a href={`#${section.id}`}>{section.label}</a>
        {/each}
      </nav>
    </aside>

    <div class="dossier-content">
      {#if roleHistory.length || affiliations.length}
        <section id="role" class="dossier-section role-section reveal-on-scroll">
          <header>
            <h2>{$t.characterDetail.sections.role}</h2>
          </header>
          {#if roleHistory.length || affiliations.length}
            <div class="role-history">
              {#each roleHistory as role, roleIndex (roleIndex)}
                <article>
                  <small
                    >{$t.characterDetail.chapterUpper(role.chapter)}{role.untilChapter
                      ? `–${role.untilChapter}`
                      : '+'}</small
                  ><strong>{role.label}</strong>{#if role.detail}<p>{role.detail}</p>{/if}
                </article>
              {/each}
              {#each affiliations as affiliation, affiliationIndex (affiliationIndex)}
                <article>
                  <small
                    >{$t.characterDetail.chapterUpper(affiliation.chapter)}{affiliation.untilChapter
                      ? `–${affiliation.untilChapter}`
                      : '+'} · {affiliation.status}</small
                  ><strong>{affiliation.name}</strong>
                  <p>{humanize(affiliation.role)}</p>
                </article>
              {/each}
            </div>
          {/if}
        </section>
      {/if}
      {#if character.identity}
        <section id="identity" class="identity-alert dossier-section reveal-on-scroll">
          <div>
            <p>{character.identity.status}</p>
            <h2>{$t.characterDetail.identityTitle}</h2>
            <span>{character.identity.description}</span>
          </div>
          <a href={$link(`/characters/${character.identity.counterpartId}`)}
            >{$t.characterDetail.relatedRecord}<br /><strong
              >{character.identity.counterpartLabel} <MangaIcon name="arrowUpRight" /></strong
            ></a
          >
        </section>
      {/if}

      {#if character.biography?.length}
        <section id="biography" class="dossier-section reveal-on-scroll">
          <header>
            <h2>{$t.characterDetail.sections.biography}</h2>
          </header>
          <div class="prose-record">
            {#each character.biography as paragraph, paragraphIndex (paragraphIndex)}<p>
                {paragraph}
              </p>{/each}
          </div>
          {#if character.abilitiesAndPowers}<div class="capability-summary">
              <small>{$t.characterDetail.abilitiesAndPowers}</small>
              <p>{character.abilitiesAndPowers}</p>
            </div>{/if}
          {#if character.equipment?.length}<div class="equipment-grid">
              {#each character.equipment as item, itemIndex (itemIndex)}<article>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </article>{/each}
            </div>{/if}
        </section>
      {/if}

      {#if character.nen || character.abilities?.length}
        <section id="nen" class="dossier-section reveal-on-scroll">
          <header>
            <h2>{$t.characterDetail.sections.nen}</h2>
          </header>
          {#if character.nen}
            <div class="nen-profile">
              <article>
                <small>{$t.characterDetail.primaryType}</small><strong
                  >{character.nen.typeLabel || character.nen.type}</strong
                >{#if character.nen.secondaryTypeLabels?.length}<span
                    >{character.nen.secondaryTypeLabels.join(' · ')}</span
                  >{/if}
              </article>
              <div>
                <p>{character.nen.overview}</p>
                {#if character.nen.combatProficiency}<p>{character.nen.combatProficiency}</p>{/if}
              </div>
            </div>
            {#if character.nen.techniques?.length}<div class="technique-list">
                {#each character.nen.techniques as technique, techniqueIndex (techniqueIndex)}<span
                    >{technique}</span
                  >{/each}
              </div>{/if}
          {/if}
          {#if character.abilities?.length}
            <div class="ability-grid">
              {#each character.abilities as ability, abilityIndex (abilityIndex)}
                {@const profile = hatsuById(ability.id)}
                <article
                  class:interactive={Boolean(profile)}
                  class:active={$activeHatsu?.id === ability.id}
                  style:--ability-color={profile?.color || 'var(--accent-cyan)'}
                >
                  <small
                    >{ability.category}{ability.secondaryCategories?.length
                      ? ` · ${ability.secondaryCategories.join(' · ')}`
                      : ''}</small
                  >
                  <h3>{ability.name}</h3>
                  {#if ability.alternateNames?.length}<span
                      >{ability.alternateNames.join(' / ')}</span
                    >{/if}
                  <p>{ability.description}</p>
                  {#if profile}
                    <button
                      type="button"
                      class="ability-description"
                      onclick={() => activateAbility(ability.id)}
                      aria-label={$t.abilities.activateAria(ability.name || ability.id)}
                      aria-pressed={$activeHatsu?.id === ability.id}
                      data-hatsu-pass
                    >
                      <small
                        >{$activeHatsu?.id === ability.id
                          ? $t.characterDetail.hatsuActive
                          : $t.abilities.activate}</small
                      >
                    </button>
                  {/if}
                </article>
              {/each}
            </div>
          {/if}
        </section>
      {/if}

      {#if prophecy}
        <section id="prophecy" class="dossier-section reveal-on-scroll">
          <header>
            <h2>{$t.characterDetail.sections.prophecy}</h2>
          </header>
          <ProphecyPoem {prophecy} />
        </section>
      {/if}

      <details id="appearances" class="dossier-section source-records">
        <summary><h2>{$t.characterDetail.sections.appearances}</h2></summary>
        {#if documentedAppearances.length}
          <div class="appearance-grid">
            {#each documentedAppearances as appearance, appearanceIndex (appearanceIndex)}<article>
                <strong>{appearance.chapter}</strong>
                <div>
                  <span>{appearance.title}</span><small>{humanize(appearance.status)}</small>
                </div>
              </article>{/each}
          </div>
        {:else}<div class="empty">
            <strong>{$t.characterDetail.noAppearanceRecord}</strong>
            <p>{$t.characterDetail.noAppearanceCopy}</p>
          </div>{/if}
        {#if character.battles?.length || character.competitions?.length}
          <div class="encounter-grid">
            {#if character.battles?.length}<article>
                <small>{$t.characterDetail.battles}</small
                >{#each character.battles as battle, battleIndex (battleIndex)}<p>
                    {typeof battle === 'string' ? battle : battle.label || battle.name}
                  </p>{/each}
              </article>{/if}
            {#if character.competitions?.length}<article>
                <small>{$t.characterDetail.competitions}</small
                >{#each character.competitions as competition, competitionIndex (competitionIndex)}<p
                  >
                    {typeof competition === 'string'
                      ? competition
                      : competition.label || competition.name}
                  </p>{/each}
              </article>{/if}
          </div>
        {/if}
      </details>

      <section id="trajectory" class="dossier-section reveal-on-scroll">
        <header>
          <h2>{$t.characterDetail.sections.trajectory}</h2>
        </header>
        <p class="trajectory-intro">{$t.characterDetail.trajectoryIntro}</p>

        {#if chapterTrajectory.length}
          <ol class="trajectory">
            {#each chapterTrajectory as chapter, chapterIndex (chapterIndex)}
              <li class:multi-location={chapter.visits.length > 1}>
                <div class="chapter">
                  <span>{$t.timeline.chapterAbbrev}</span><strong>{chapter.chapter}</strong><small
                    >{$t.characterDetail.positionsCount(chapter.visits.length)}</small
                  >
                </div>
                <span class="event-dot"></span>
                <article>
                  <small
                    >{chapter.isMovement
                      ? $t.characterDetail.routeWithinChapter
                      : chapter.visits.length > 1
                        ? $t.characterDetail.bodyConsciousnessPositions
                        : $t.characterDetail.positionInChapter}</small
                  >
                  <ol class="visits">
                    {#each chapter.visits as visit, index (index)}
                      <li
                        class:unknown={visit.location === 'Position inconnue'}
                        class:consciousness={visit.subject === 'consciousness'}
                      >
                        <span class="visit-order">{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <h3>⌖ {locationLabel(visit.location, $locale)}</h3>
                          <small
                            >{visit.subject}{visit.certainty
                              ? ` · ${humanize(visit.certainty)}`
                              : ''}</small
                          >
                          {#if visit.detail}<p>{visit.detail}</p>{/if}
                        </div>
                      </li>
                    {/each}
                  </ol>
                  {#if chapter.events.some((entry) => entry.kind !== 'body-location' && entry.kind !== 'consciousness-location')}
                    <div class="chapter-states">
                      {#each chapter.events.filter((entry) => entry.kind !== 'body-location' && entry.kind !== 'consciousness-location') as entry, entryIndex (entryIndex)}
                        <span>{kindLabels[entry.kind]} · {humanize(entry.label)}</span>
                      {/each}
                    </div>
                  {/if}
                </article>
              </li>
            {/each}
          </ol>
        {:else}
          <div class="empty">
            <strong>{$t.characterDetail.noTransition}</strong>
            <p>{$t.characterDetail.lastKnownPosition(currentLocation)}</p>
          </div>
        {/if}
      </section>
    </div>
  </div>
</div>

<style>
  .answer-summary {
    max-width: 44rem;
    margin: 1.5rem 0 0;
    color: var(--text-secondary);
    font-size: 1rem;
    line-height: 1.8;
  }
  .summary-sources {
    max-width: 1280px;
    margin: 0 auto;
    padding: 1.25rem var(--page-gutter);
    border-top: 1px solid var(--line-default);
    border-bottom: 1px solid var(--line-default);
  }
  .summary-sources h2 {
    margin: 0;
    font-size: 0.8rem;
  }
  .summary-sources ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.8rem 0 0;
    padding: 0;
    list-style: none;
  }
  .summary-sources li {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--line-default);
    font-size: 0.75rem;
  }
  .summary-sources a {
    color: var(--accent-gold-bright);
  }
  .summary-sources small {
    display: block;
    color: var(--text-muted);
  }
  .dossier-page {
    max-width: 1280px;
    margin: auto;
    padding: 2rem var(--page-gutter) 5rem;
  }
  .breadcrumb {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-bottom: 2rem;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .breadcrumb a {
    color: var(--text-secondary);
    text-decoration: none;
  }
  .breadcrumb a:hover {
    color: var(--text-primary);
  }
  .breadcrumb strong {
    font-weight: 400;
  }
  .dossier-hero {
    margin-bottom: 2rem;
  }
  h1 {
    margin: 0;
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.1;
    overflow-wrap: anywhere;
  }
  .aliases {
    margin: 0.8rem 0;
    color: var(--text-muted);
    font-size: 0.8rem;
    line-height: 1.6;
  }
  .primary-role {
    margin-top: 1rem;
  }
  .primary-role span {
    display: block;
    margin-bottom: 0.4rem;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .primary-role strong {
    font-size: 0.9rem;
    font-weight: 400;
    line-height: 1.6;
  }
  .hero-links {
    margin-top: 0.75rem;
  }
  .hero-links a {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 44px;
    color: var(--accent-gold-bright);
    font-size: 0.8rem;
    text-decoration: none;
  }
  .record-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.5rem;
    margin: 1.5rem 0 0;
    padding: 1.5rem 0;
    border-top: 1px solid var(--line-subtle);
    border-bottom: 1px solid var(--line-subtle);
  }
  .record-stats dt {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .record-stats dd {
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }
  .dossier-layout {
    display: grid;
    grid-template-columns: 11rem minmax(0, 1fr);
    gap: 3rem;
  }
  .dossier-index {
    position: sticky;
    top: calc(var(--header-height) + 1.5rem);
    height: fit-content;
  }
  .dossier-index > p {
    margin: 0 0 0.75rem;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .dossier-index nav {
    display: grid;
  }
  .dossier-index a {
    display: flex;
    min-height: 44px;
    align-items: center;
    color: var(--text-secondary);
    font-size: 0.8rem;
    text-decoration: none;
  }
  .dossier-index a:hover {
    color: var(--accent-gold-bright);
  }
  .dossier-content {
    min-width: 0;
  }
  .dossier-section {
    scroll-margin-top: calc(var(--header-height) + 1.5rem);
    padding: 2rem 0;
    border-top: 1px solid var(--line-subtle);
  }
  .dossier-section:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .dossier-section h2 {
    margin: 0 0 1.25rem;
    font: 500 1.25rem/1.4 var(--font-sans);
  }
  .dossier-section h3 {
    margin: 0.5rem 0;
    font: 600 0.95rem/1.5 var(--font-sans);
  }
  .dossier-section p {
    color: var(--text-secondary);
    font-size: 0.875rem;
    line-height: 1.8;
  }
  .role-history {
    display: grid;
    gap: 1rem;
  }
  .role-history article {
    display: grid;
    grid-template-columns: 7rem 1fr;
    gap: 0.4rem 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--line-subtle);
  }
  .role-history small {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .role-history strong {
    font-size: 0.85rem;
    font-weight: 500;
  }
  .role-history p {
    grid-column: 2;
    margin: 0;
  }
  .identity-alert {
    border-left: 2px solid var(--state-suspected);
    padding-left: 1.25rem;
  }
  .identity-alert > div p {
    color: var(--state-suspected);
    font-size: 0.75rem;
  }
  .identity-alert > div span {
    color: var(--text-secondary);
    font-size: 0.875rem;
    line-height: 1.8;
  }
  .identity-alert a {
    display: block;
    margin-top: 1rem;
    color: var(--accent-gold-bright);
    font-size: 0.8rem;
  }
  .identity-alert a strong {
    font-weight: 500;
  }
  .prose-record {
    max-width: 48rem;
  }
  .prose-record p {
    margin: 0 0 1rem;
  }
  .capability-summary {
    margin-top: 1.5rem;
  }
  .capability-summary small,
  .nen-profile small,
  .encounter-grid small {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .equipment-grid,
  .ability-grid,
  .encounter-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 2rem;
    margin-top: 1rem;
  }
  .equipment-grid article,
  .ability-grid article,
  .encounter-grid article {
    min-width: 0;
    padding: 1.25rem 0;
    border-top: 1px solid var(--line-subtle);
  }
  .equipment-grid strong {
    font-size: 0.85rem;
    font-weight: 500;
  }
  .ability-grid article.active {
    border-top-color: var(--ability-color);
  }
  .ability-grid small,
  .ability-grid article > span {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .nen-profile {
    display: grid;
    grid-template-columns: 10rem minmax(0, 1fr);
    gap: 1.5rem;
  }
  .nen-profile > article {
    display: grid;
    align-content: start;
    gap: 0.6rem;
  }
  .nen-profile strong {
    font-size: 1rem;
    font-weight: 500;
  }
  .nen-profile span {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .nen-profile p {
    margin: 0 0 1rem;
  }
  .technique-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    margin: 1rem 0;
    color: var(--text-secondary);
    font-size: 0.75rem;
  }
  .ability-description {
    display: flex;
    min-height: 44px;
    align-items: center;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent-gold-bright);
    cursor: pointer;
    text-align: left;
  }
  .ability-description small {
    color: inherit;
    font-size: 0.8rem;
  }
  .source-records summary {
    min-height: 44px;
    cursor: pointer;
    color: var(--text-secondary);
  }
  .source-records summary h2 {
    display: inline;
    margin-left: 0.5rem;
  }
  .appearance-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 2rem;
    margin-top: 1rem;
  }
  .appearance-grid article {
    display: grid;
    grid-template-columns: 3rem 1fr;
    gap: 0.75rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--line-subtle);
    font-size: 0.8rem;
  }
  .appearance-grid strong {
    font-weight: 500;
  }
  .appearance-grid small {
    display: block;
    margin-top: 0.35rem;
    color: var(--text-muted);
    font-size: 0.7rem;
  }
  .trajectory {
    display: grid;
    gap: 1.25rem;
    padding: 0;
    margin: 1.5rem 0 0;
    list-style: none;
  }
  .trajectory > li {
    display: grid;
    grid-template-columns: 4rem 1fr;
    gap: 1rem;
  }
  .chapter {
    display: grid;
    align-content: start;
    gap: 0.35rem;
    font-size: 0.75rem;
  }
  .chapter span,
  .chapter small {
    color: var(--text-muted);
  }
  .chapter strong {
    font-size: 1rem;
    font-weight: 500;
  }
  .event-dot {
    display: none;
  }
  .trajectory > li > article {
    min-width: 0;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--line-subtle);
  }
  .trajectory > li > article > small {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .visits {
    display: grid;
    gap: 1rem;
    margin: 0.75rem 0;
    padding: 0;
    list-style: none;
  }
  .visits > li {
    padding-left: 1rem;
    border-left: 2px solid var(--state-known);
  }
  .visits > li.consciousness {
    border-left-color: var(--state-transferred);
  }
  .visits > li.unknown {
    border-left-color: var(--state-unknown);
  }
  .visit-order {
    display: none;
  }
  .visits h3 {
    margin-top: 0;
  }
  .visits small {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  .visits p {
    margin: 0.5rem 0 0;
  }
  .chapter-states {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    color: var(--text-secondary);
    font-size: 0.75rem;
  }
  .empty {
    padding: 1rem 0;
    color: var(--text-secondary);
  }
  .empty strong {
    font-weight: 500;
  }
  @media (max-width: 900px) {
    .dossier-layout {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    .dossier-index {
      position: static;
    }
    .dossier-index nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0 1.25rem;
    }
    .record-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 600px) {
    .equipment-grid,
    .ability-grid,
    .encounter-grid,
    .appearance-grid,
    .nen-profile {
      grid-template-columns: 1fr;
    }
    .role-history article {
      grid-template-columns: 1fr;
    }
    .role-history p {
      grid-column: auto;
    }
    .trajectory > li {
      grid-template-columns: 3rem minmax(0, 1fr);
      gap: 0.75rem;
    }
  }
</style>
