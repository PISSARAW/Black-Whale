<script lang="ts">
  import type { PageData } from './$types'
  import Seo from '$lib/components/Seo.svelte'
  import { hatsuById } from '$lib/nen/hatsuRegistry.js'
  import { activateHatsu } from '$lib/nen/hatsuState.js'
  import { articleSchema, breadcrumbSchema, publisherSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { LOCALE_TAGS } from '$lib/i18n/config'

  let { data }: { data: PageData } = $props()
  let ability = $derived(data.ability)
  let profile = $derived(hatsuById(ability.id))
  let ownerName = $derived(data.owner?.canonicalName ?? $t.common.unknown)
  let description = $derived($t.discovery.ability.seoDescription(ability.name, ownerName))

  const chapterNumber = (chapterId: string) => chapterId.replace(/^ch-/, '').split('.')[0]
  const timelineHref = (chapterId: string) => {
    const chapter = Number(chapterNumber(chapterId))
    return Number.isFinite(chapter) && chapter >= 340 ? $link(`/timeline#chapter-${chapter}`) : null
  }
</script>

<Seo
  title={$t.discovery.ability.seoTitle(ability.name)}
  {description}
  type="article"
  jsonLd={[
    articleSchema({
      name: ability.name,
      path: $link(`/abilities/${ability.id}`),
      description: ability.description,
      language: LOCALE_TAGS[$locale].html,
      modifiedAt: ability.modifiedAt,
      mainEntity: {
        '@type': 'Thing',
        name: ability.name,
        alternateName: ability.alternateNames,
      },
    }),
    publisherSchema(),
    breadcrumbSchema([
      { name: $t.common.home, path: $link('/') },
      { name: $t.discovery.ability.archive, path: $link('/abilities') },
      { name: ability.name, path: $link(`/abilities/${ability.id}`) },
    ]),
  ]}
/>

<article class="ability-dossier" data-ability-detail={ability.id}>
  <nav class="breadcrumb" aria-label={$t.discovery.ability.archive}>
    <a href={$link('/abilities')}>← {$t.discovery.ability.archive}</a>
  </nav>

  <header>
    <p class="category">{ability.category}</p>
    <h1>{ability.name}</h1>
    {#if ability.alternateNames?.length}
      <p class="aliases">{ability.alternateNames.join(' · ')}</p>
    {/if}
    <p class="answer">{ability.description}</p>
    {#if profile}
      <button type="button" onclick={() => activateHatsu(profile)} data-hatsu-pass>
        {$t.discovery.ability.activate} →
      </button>
    {/if}
  </header>

  <dl class="facts">
    <div>
      <dt>{$t.discovery.ability.owner}</dt>
      <dd>
        {#if data.owner}
          <a href={$link(`/characters/${data.owner.id}`)}>{data.owner.canonicalName}</a>
        {:else}{ownerName}{/if}
      </dd>
    </div>
    <div>
      <dt>{$t.discovery.ability.users}</dt>
      <dd>
        {#each data.users as user, index (user.id)}
          {#if index > 0}
            ·
          {/if}<a href={$link(`/characters/${user.id}`)}>{user.canonicalName}</a>
        {/each}
      </dd>
    </div>
    <div>
      <dt>{$t.discovery.ability.category}</dt>
      <dd>{[ability.category, ...(ability.secondaryCategories ?? [])].join(' · ')}</dd>
    </div>
  </dl>

  <section class="sources" aria-labelledby="sources-title">
    <h2 id="sources-title">{$t.discovery.sources}</h2>
    <p>{$t.discovery.ability.sourceNote}</p>
    <ul>
      {#each ability.sources as source (source.chapterId)}
        <li>
          {#if timelineHref(source.chapterId)}
            <a href={timelineHref(source.chapterId)!}
              >{$t.discovery.chapter(chapterNumber(source.chapterId))}</a
            >
          {:else}
            <span>{$t.discovery.chapter(chapterNumber(source.chapterId))}</span>
          {/if}
          {#if source.note}<small>{source.note}</small>{/if}
        </li>
      {/each}
    </ul>
  </section>

  <section>
    <h2>{$t.discovery.ability.uses}</h2>
    {#if data.uses.length}
      <ol class="uses">
        {#each data.uses as use (use.id)}
          <li>
            <strong>{$t.discovery.chapter(use.chapter)} · {use.userName}</strong>
            <span>{use.note}</span>
          </li>
        {/each}
      </ol>
    {:else}
      <p>{$t.discovery.ability.noUses}</p>
    {/if}
  </section>

  {#if data.related.length}
    <section>
      <h2>{$t.discovery.ability.related}</h2>
      <ul class="related">
        {#each data.related as related (related.id)}
          <li><a href={$link(`/abilities/${related.id}`)}>{related.name}</a></li>
        {/each}
      </ul>
    </section>
  {/if}

  <footer>{$t.discovery.modified(ability.modifiedAt)}</footer>
</article>

<style>
  .ability-dossier {
    max-width: 900px;
    margin: auto;
    padding: 2rem var(--page-gutter) 6rem;
  }
  .breadcrumb a,
  a {
    color: var(--accent-gold-bright);
  }
  header {
    padding: clamp(2rem, 6vw, 5rem) 0 3rem;
    border-bottom: 1px solid var(--line-default);
  }
  .category {
    margin: 0 0 0.75rem;
    color: var(--accent-gold-bright);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.72rem;
  }
  h1 {
    margin: 0;
    font-size: clamp(3rem, 8vw, 6rem);
    font-weight: 450;
    line-height: 1;
  }
  .aliases {
    color: var(--text-muted);
  }
  .answer {
    max-width: 760px;
    margin: 1.5rem 0 0;
    color: var(--text-secondary);
    font-size: 1.05rem;
    line-height: 1.85;
  }
  button {
    margin-top: 1.5rem;
    min-height: 44px;
    padding: 0.7rem 1rem;
    border: 1px solid var(--accent-gold);
    background: transparent;
    color: var(--accent-gold-bright);
    cursor: pointer;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    margin: 0;
    background: var(--line-default);
  }
  .facts div {
    padding: 1.25rem;
    background: var(--surface-void);
  }
  dt {
    color: var(--text-muted);
    font-size: 0.72rem;
  }
  dd {
    margin: 0.45rem 0 0;
    line-height: 1.6;
  }
  section {
    padding: 2.5rem 0;
    border-bottom: 1px solid var(--line-default);
  }
  h2 {
    margin: 0;
    font-size: 1.2rem;
  }
  section > p {
    color: var(--text-secondary);
    line-height: 1.7;
  }
  .sources ul,
  .related {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    padding: 0;
    list-style: none;
  }
  .sources li,
  .related li {
    padding: 0.55rem 0.75rem;
    border: 1px solid var(--line-default);
  }
  .sources small {
    display: block;
    margin-top: 0.35rem;
    color: var(--text-muted);
  }
  .uses {
    padding-left: 1.2rem;
  }
  .uses li {
    padding: 1rem 0;
  }
  .uses span {
    display: block;
    margin-top: 0.35rem;
    color: var(--text-secondary);
    line-height: 1.6;
  }
  footer {
    padding-top: 2rem;
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  @media (max-width: 700px) {
    .facts {
      grid-template-columns: 1fr;
    }
  }
</style>
