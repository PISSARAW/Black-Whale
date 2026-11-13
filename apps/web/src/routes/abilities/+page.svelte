<script lang="ts">
  import type { PageData } from './$types'
  import { hatsuById } from '$lib/nen/hatsuRegistry.js'
  import { activateHatsu } from '$lib/nen/hatsuState.js'
  import Seo from '$lib/components/Seo.svelte'
  import { breadcrumbSchema, collectionSchema, publisherSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { localizeHatsu } from '$lib/i18n/hatsu'

  export let data: PageData

  // The catalogue is the list, not the registry. The registry used to drive
  // this loop, which meant the whole archive shipped to the browser whatever
  // spoiler cap the reader had set — the server can only withhold what the
  // page agrees to read from it.
  $: abilities = data.abilities.map((catalogued) => {
    const registryProfile = hatsuById(catalogued.id)
    const profile = registryProfile ? localizeHatsu(registryProfile, $locale) : null
    // The catalogue is still English-only, so the registry's own French text is
    // the better record on the French side.
    const preferRegistry = profile !== null && $locale !== 'en'
    return {
      id: catalogued.id,
      name: preferRegistry && profile ? profile.name : catalogued.name,
      owner: preferRegistry && profile ? profile.owner : catalogued.owner,
      category: catalogued.category ?? 'nen',
      description: preferRegistry && profile ? profile.rule : catalogued.description,
    }
  })

  function activate(id: string) {
    const profile = hatsuById(id)
    if (profile) activateHatsu(profile)
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

  <div class="ability-list">
    {#each abilities as ability (ability.id)}
      {@const registryProfile = hatsuById(ability.id)}
      {@const profile = registryProfile ? localizeHatsu(registryProfile, $locale) : null}
      <article data-hatsu-id={ability.id}>
        <div class="ability-heading">
          <div>
            <h2><a href={$link(`/abilities/${ability.id}`)}>{ability.name}</a></h2>
            <p class="owner">{ability.owner}</p>
          </div>
          <span class="category">{ability.category || $t.abilities.unknownCategory}</span>
        </div>
        <p class="description">{ability.description || $t.abilities.noDescription}</p>
        {#if profile}
          <div class="ability-actions">
            <details>
              <summary>{$t.abilities.instructions}</summary>
              <p>{profile.instruction}</p>
              <p>{$t.abilities.cost(profile.cost)}</p>
            </details>
            <button
              type="button"
              onclick={() => activate(ability.id)}
              data-hatsu-pass
              aria-label={$t.abilities.activateAria(ability.name)}
              >{$t.abilities.activate} <span aria-hidden="true">→</span></button
            >
          </div>
        {/if}
      </article>
    {/each}
    {#if abilities.length === 0}<p class="empty">{$t.abilities.empty}</p>{/if}
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
  button span {
    margin-left: 0.5rem;
  }
  .empty {
    color: var(--text-secondary);
  }
  @media (max-width: 760px) {
    .ability-list {
      grid-template-columns: 1fr;
    }
  }
</style>
