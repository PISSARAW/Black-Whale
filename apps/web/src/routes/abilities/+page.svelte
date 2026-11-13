<script lang="ts">
  import type { PageData } from './$types'
  import { hatsuById } from '$lib/nen/hatsuRegistry.js'
  import Seo from '$lib/components/Seo.svelte'
  import { breadcrumbSchema, collectionSchema, publisherSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import AbilityActionWheel from '$lib/nen/AbilityActionWheel.svelte'
  import AbilityViewHost from '$lib/nen/AbilityViewHost.svelte'
  import NenWhyPanel from '$lib/nen/NenWhyPanel.svelte'
  import { previewSurfaceAdapter } from '$lib/nen/abilityPresentation'

  export let data: PageData
  let query = ''
  let category = ''
  let owner = ''
  let selections: Record<string, string> = {}
  $: presentations = new Map(data.presentations.map((item) => [item.abilityId, item]))

  function presentedOwner(
    catalogued: PageData['abilities'][number],
    profile: ReturnType<typeof localizeHatsu> | null,
    useRegistry: boolean,
  ) {
    if (useRegistry && profile) return profile.owner
    if (catalogued.owner) return catalogued.owner
    return profile?.owner ?? '—'
  }

  function presentedAbility(catalogued: PageData['abilities'][number]) {
    const registryProfile = hatsuById(catalogued.id)
    const profile = registryProfile ? localizeHatsu(registryProfile, $locale) : null
    const useRegistry = profile !== null && $locale !== 'en'
    let name = catalogued.name
    let description = catalogued.description
    if (useRegistry && profile) {
      name = profile.name
      description = profile.rule
    }
    return {
      id: catalogued.id,
      name,
      owner: presentedOwner(catalogued, profile, useRegistry),
      category: catalogued.category ?? 'nen',
      description,
      cost: profile ? profile.cost : null,
      sources: catalogued.sources,
    }
  }

  // The catalogue is the list, not the registry. The registry used to drive
  // this loop, which meant the whole archive shipped to the browser whatever
  // spoiler cap the reader had set — the server can only withhold what the
  // page agrees to read from it.
  // The catalogue is English-only, so the registry supplies the French
  // presentation without becoming the list or bypassing the server cap.
  $: abilities = data.abilities.map(presentedAbility)

  $: categories = [...new Set(abilities.map((ability) => ability.category))].sort()
  $: owners = [...new Set(abilities.map((ability) => ability.owner))].sort()
  $: filteredAbilities = abilities.filter((ability) => {
    const needle = query.trim().toLocaleLowerCase($locale)
    const matchesQuery =
      !needle ||
      `${ability.name} ${ability.owner} ${ability.description}`
        .toLocaleLowerCase($locale)
        .includes(needle)
    return (
      matchesQuery &&
      (!category || ability.category === category) &&
      (!owner || ability.owner === owner)
    )
  })

  function activate(id: string) {
    window.dispatchEvent(new CustomEvent('black-whale:activate-hatsu', { detail: id }))
  }

  function selectAction(abilityId: string, actionId: string) {
    selections = { ...selections, [abilityId]: actionId }
  }
</script>

<Seo
  title={$t.abilities.seoTitle}
  description={$t.abilities.seoDescription}
  jsonLd={[
    collectionSchema({
      name: $t.abilities.title,
      path: $link('/abilities'),
      description: $t.abilities.seoDescription,
      modifiedAt: data.modifiedAt,
      items: abilities.map((ability) => ({
        name: ability.name,
        path: $link(`/abilities/${ability.id}`),
      })),
    }),
    publisherSchema(),
    breadcrumbSchema([
      { name: $t.common.home, path: $link('/') },
      { name: $t.abilities.breadcrumb, path: $link('/abilities') },
    ]),
  ]}
/>

<div class="ability-page">
  <header>
    <h1>{$t.abilities.title}</h1>
    <p>{$t.abilities.subtitle}</p>
  </header>

  <section class="catalogue-tools" aria-label={$t.abilities.title}>
    <label class="search">
      <span class="sr-only">{$t.abilities.search}</span>
      <input bind:value={query} type="search" placeholder={$t.abilities.search} />
    </label>
    <label>
      <span class="sr-only">{$t.abilities.allCategories}</span>
      <select bind:value={category}>
        <option value="">{$t.abilities.allCategories}</option>
        {#each categories as item (item)}<option value={item}
            >{item === 'unknown' ? $t.abilities.unknownCategory : item}</option
          >{/each}
      </select>
    </label>
    <label>
      <span class="sr-only">{$t.abilities.allOwners}</span>
      <select bind:value={owner}>
        <option value="">{$t.abilities.allOwners}</option>
        {#each owners as item (item)}<option value={item}>{item}</option>{/each}
      </select>
    </label>
    <span class="result-count">{$t.abilities.results(filteredAbilities.length)}</span>
  </section>

  <div class="ability-list">
    {#each filteredAbilities as ability (ability.id)}
      {@const registryProfile = hatsuById(ability.id)}
      {@const profile = registryProfile ? localizeHatsu(registryProfile, $locale) : null}
      {@const presentation = presentations.get(ability.id) ?? null}
      {@const selectedAction =
        presentation?.actions.find(({ entry }) => entry.id === selections[ability.id]) ??
        presentation?.actions.find(({ entry }) => entry.visibility !== 'hidden')}
      {@const viewModel =
        presentation && selectedAction
          ? previewSurfaceAdapter({
              name: ability.name,
              owner: ability.owner,
            }).modelFor(presentation, selectedAction.entry.id)
          : null}
      <article data-hatsu-id={ability.id}>
        <div class="ability-heading">
          <div>
            <h2><a href={$link(`/abilities/${ability.id}`)}>{ability.name}</a></h2>
            <p class="owner">{ability.owner}</p>
          </div>
          <span class="category"
            >{ability.category === 'unknown'
              ? $t.abilities.unknownCategory
              : ability.category}</span
          >
        </div>
        <p class="description">{ability.description || $t.abilities.noDescription}</p>
        {#if ability.sources.length}
          <p class="sources">
            <strong>{$t.abilities.sources}</strong>
            {ability.sources.map((chapter) => `ch. ${chapter}`).join(' · ')}
          </p>
        {/if}
        {#if profile}
          <div class="ability-actions">
            <details>
              <summary>{$t.abilities.instructions}</summary>
              <p>{profile.instruction}</p>
              <p>{$t.abilities.cost(profile.cost)}</p>
              {#if presentation && selectedAction}
                <h3>{$t.abilities.uses}</h3>
                <AbilityActionWheel
                  {presentation}
                  selected={selectedAction.entry.id}
                  onSelect={(actionId) => selectAction(ability.id, actionId)}
                />
                <NenWhyPanel plan={selectedAction.plan} compact />
                {#if viewModel}<AbilityViewHost model={viewModel} />{/if}
              {/if}
            </details>
            <div class="card-links">
              <button
                type="button"
                onclick={() => activate(ability.id)}
                data-hatsu-pass
                aria-label={$t.abilities.activateAria(ability.name)}>{$t.abilities.activate}</button
              >
              <a
                href={$link(
                  ability.id === 'contagion' ? '/tour/morena' : `/tour?hatsu=${ability.id}`,
                )}>{$t.abilities.tryTour} <span aria-hidden="true">→</span></a
              >
            </div>
          </div>
        {/if}
      </article>
    {/each}
    {#if filteredAbilities.length === 0}<p class="empty">{$t.abilities.empty}</p>{/if}
  </div>
</div>

<style>
  .ability-page {
    max-width: 1280px;
    margin: auto;
    padding: clamp(2rem, 4vw, 3.5rem) var(--page-gutter) 5rem;
  }
  header {
    margin-bottom: 2.5rem;
  }
  .catalogue-tools {
    display: grid;
    grid-template-columns: minmax(14rem, 2fr) minmax(10rem, 1fr) minmax(10rem, 1fr) auto;
    gap: 0.7rem;
    align-items: center;
    margin-bottom: 2rem;
  }
  input,
  select {
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--line-default);
    border-radius: 0.35rem;
    background: var(--surface-void);
    padding: 0.65rem 0.75rem;
    color: var(--text-primary);
  }
  .result-count {
    color: var(--text-muted);
    font-size: 0.7rem;
    white-space: nowrap;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  h1 {
    margin: 0;
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  header p {
    margin: 0.8rem 0 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.7;
  }
  .ability-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 3rem;
  }
  article {
    min-width: 0;
    padding: 1.5rem 0;
    border-top: 1px solid var(--line-default);
  }
  .ability-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }
  h2 {
    margin: 0;
    font: 600 1rem/1.5 var(--font-sans);
  }
  h2 a {
    color: inherit;
    text-decoration: none;
  }
  h2 a:hover {
    color: var(--accent-gold-bright);
  }
  .owner {
    margin: 0.35rem 0 0;
    color: var(--text-secondary);
    font-size: 0.8rem;
  }
  .category {
    color: var(--text-muted);
    font-size: 0.7rem;
    overflow-wrap: anywhere;
  }
  .description {
    margin: 1rem 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.7;
  }
  .ability-actions {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
  }
  details {
    min-width: 0;
    flex: 1;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  summary {
    min-height: 44px;
    padding: 0.75rem 0;
    cursor: pointer;
  }
  details p {
    margin: 0.5rem 0 0;
    line-height: 1.7;
  }
  details h3 {
    margin: 1rem 0 0.5rem;
    color: var(--text-secondary);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  details :global(.wheel),
  details :global(.why),
  details :global(.ability-view) {
    margin-top: 0.7rem;
  }
  .sources {
    display: flex;
    gap: 0.6rem;
    color: var(--text-muted);
    font-size: 0.68rem;
  }
  button {
    flex: none;
    min-height: 44px;
    padding: 0.5rem 0;
    border: 0;
    background: none;
    color: var(--accent-gold-bright);
    cursor: pointer;
    font-size: 0.8rem;
  }
  .card-links {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
  }
  .card-links a {
    min-height: 44px;
    display: flex;
    align-items: center;
    color: var(--accent-gold-bright);
    font-size: 0.75rem;
    text-decoration: none;
    white-space: nowrap;
  }
  .empty {
    color: var(--text-secondary);
  }
  @media (max-width: 760px) {
    .catalogue-tools {
      grid-template-columns: 1fr;
    }
    .ability-list {
      grid-template-columns: 1fr;
    }
  }
</style>
